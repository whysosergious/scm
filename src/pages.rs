//! Page discovery, loading, and saving (spec_page_editor.md §§6–8).
//!
//! Pages live in a `pages/` directory relative to the target project checkout.
//! Discovery scans only direct children; nested directories are ignored in v1.
//! `index.json` is non-deletable. All writes are atomic (temp file → rename).

use crate::error::{ScmError, ScmResult};
use crate::paths::{safe_join, valid_content_filename};
use serde::Serialize;
use std::path::{Path, PathBuf};

/// The pages directory name, relative to the project checkout root.
const PAGES_DIR: &str = "pages";

#[derive(Debug, Clone, Serialize)]
pub struct PageFile {
    pub name: String,
}

fn require_valid_name(name: &str) -> ScmResult<()> {
    if !valid_content_filename(name) {
        return Err(ScmError::config(format!("Invalid page filename '{name}'")));
    }
    if !name.ends_with(".json") {
        return Err(ScmError::config(format!(
            "Page files must have the .json extension, got '{name}'"
        )));
    }
    Ok(())
}

/// Resolve `<checkout>/pages/` (traversal-proof).
fn resolve_pages_dir(checkout: &Path) -> ScmResult<PathBuf> {
    safe_join(checkout, Path::new(PAGES_DIR)).ok_or_else(|| {
        ScmError::config("pages directory path escapes the target repository".to_string())
    })
}

/// Resolve a specific page file inside the pages directory.
fn resolve_page_file(checkout: &Path, name: &str) -> ScmResult<PathBuf> {
    let dir = resolve_pages_dir(checkout)?;
    let path = dir.join(name);
    if !path.starts_with(&dir) {
        return Err(ScmError::config(format!(
            "Page filename '{name}' escapes the pages directory"
        )));
    }
    Ok(path)
}

/// List direct-child `.json` files of `<checkout>/pages/`.
pub async fn list_pages(checkout: &Path) -> ScmResult<Vec<PageFile>> {
    let dir = resolve_pages_dir(checkout)?;

    let meta = tokio::fs::symlink_metadata(&dir).await;
    let meta = match meta {
        Ok(m) => m,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(vec![]),
        Err(e) => {
            return Err(
                ScmError::filesystem("Could not inspect the pages directory")
                    .with_detail(e.to_string()),
            )
        }
    };
    if !meta.is_dir() {
        return Ok(vec![]);
    }

    let scan_dir = dir.clone();
    tokio::task::spawn_blocking(move || -> std::io::Result<Vec<PageFile>> {
        let mut files: Vec<PageFile> = Vec::new();
        for entry in std::fs::read_dir(&scan_dir)? {
            let entry = entry?;
            let meta = entry.metadata()?;
            if !meta.is_file() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().into_owned();
            if name.ends_with(".json") {
                files.push(PageFile { name });
            }
        }
        files.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(files)
    })
    .await
    .map_err(|e| ScmError::internal("Page listing task panicked").with_detail(e.to_string()))?
    .map_err(|e| {
        ScmError::filesystem("Could not read the pages directory").with_detail(e.to_string())
    })
}

/// Load a single page file as raw text.
pub async fn load_page(checkout: &Path, name: &str) -> ScmResult<String> {
    require_valid_name(name)?;
    let path = resolve_page_file(checkout, name)?;

    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| match e.kind() {
            std::io::ErrorKind::NotFound => {
                ScmError::not_found(format!("Page file '{name}' not found"))
            }
            _ => ScmError::filesystem(format!("Could not read page file '{name}'"))
                .with_detail(e.to_string()),
        })
}

/// Create a new page with optional initial JSON content.
/// Refuses to overwrite existing files.
pub async fn create_page(
    checkout: &Path,
    name: &str,
    initial: Option<&serde_json::Value>,
) -> ScmResult<PathBuf> {
    require_valid_name(name)?;
    let dir = resolve_pages_dir(checkout)?;
    if !dir.is_dir() {
        tokio::fs::create_dir_all(&dir).await.map_err(|e| {
            ScmError::filesystem("Could not create pages/ directory").with_detail(e.to_string())
        })?;
    }
    let body = match initial {
        Some(v) => pretty_json(v)?,
        None => default_page_json(name),
    };
    write_new(checkout, name, &body).await
}

/// Save a page: validate JSON + atomic write.
pub async fn save_page(checkout: &Path, name: &str, body: &str) -> ScmResult<()> {
    require_valid_name(name)?;

    let parsed: serde_json::Value = serde_json::from_str(body).map_err(|e| {
        ScmError::invalid_json("JSON syntax error — page was not saved")
            .with_detail(e.to_string())
    })?;

    let pretty = pretty_json(&parsed)?;
    let path = resolve_existing_file(checkout, name)?;
    write_atomic(&path, &pretty).await
}

/// Delete a page. Rejects deletion of `index.json`.
pub async fn delete_page(checkout: &Path, name: &str) -> ScmResult<()> {
    require_valid_name(name)?;
    if name == "index.json" {
        return Err(ScmError::config(
            "Cannot delete index.json — it is the root page".to_string(),
        ));
    }
    let path = resolve_existing_file(checkout, name)?;
    let name_owned = name.to_string();
    tokio::task::spawn_blocking(move || -> ScmResult<()> {
        std::fs::remove_file(&path).map_err(|e| match e.kind() {
            std::io::ErrorKind::NotFound => {
                ScmError::not_found(format!("Page file '{name_owned}' not found"))
            }
            _ => ScmError::filesystem(format!("Could not delete page file '{name_owned}'"))
                .with_detail(e.to_string()),
        })
    })
    .await
    .map_err(|e| {
        ScmError::internal("Page delete task panicked").with_detail(e.to_string())
    })?
}

/// Create the pages directory if it does not exist.
pub async fn ensure_pages_dir(checkout: &Path) -> ScmResult<PathBuf> {
    let dir = resolve_pages_dir(checkout)?;
    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|e| {
            ScmError::filesystem("Could not create the pages directory")
                .with_detail(e.to_string())
        })?;
    Ok(dir)
}

/// Check if a page file exists.
pub async fn page_exists(checkout: &Path, name: &str) -> ScmResult<bool> {
    let path = resolve_page_file(checkout, name)?;
    Ok(tokio::fs::metadata(&path)
        .await
        .map(|m| m.is_file())
        .unwrap_or(false))
}

// ================== INTERNALS ==================

fn resolve_existing_file(checkout: &Path, name: &str) -> ScmResult<PathBuf> {
    let path = resolve_page_file(checkout, name)?;
    if !path.is_file() {
        return Err(ScmError::not_found(format!(
            "Page file '{name}' not found under pages/"
        )));
    }
    Ok(path)
}

async fn write_new(checkout: &Path, name: &str, body: &str) -> ScmResult<PathBuf> {
    let dir = resolve_pages_dir(checkout)?;
    if !dir.is_dir() {
        return Err(ScmError::not_found(
            "Pages directory 'pages/' does not exist — create it first".to_string(),
        ));
    }
    let path = dir.join(name);
    if path.exists() {
        return Err(
            ScmError::config(format!("Page file '{name}' already exists"))
                .with_status_conflict(),
        );
    }
    write_atomic(&path, body).await?;
    Ok(path)
}

async fn write_atomic(path: &Path, body: &str) -> ScmResult<()> {
    let path = path.to_path_buf();
    let body = body.to_string();
    tokio::task::spawn_blocking(move || -> ScmResult<()> {
        use std::io::Write;
        let tmp = path.with_file_name(format!(
            ".{}.tmp",
            path.file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default()
        ));
        let write_result = (|| -> std::io::Result<()> {
            let mut f = std::fs::File::create(&tmp)?;
            f.write_all(body.as_bytes())?;
            f.flush()?;
            f.sync_all()?;
            drop(f);
            std::fs::rename(&tmp, &path)?;
            Ok(())
        })();
        match write_result {
            Ok(()) => Ok(()),
            Err(e) => {
                let _ = std::fs::remove_file(&tmp);
                Err(ScmError::filesystem(format!(
                    "Could not write '{}'",
                    path.display()
                ))
                .with_detail(e.to_string()))
            }
        }
    })
    .await
    .map_err(|e| {
        ScmError::internal("Page writer task panicked").with_detail(e.to_string())
    })?
}

fn pretty_json(value: &serde_json::Value) -> ScmResult<String> {
    let mut out = serde_json::to_string_pretty(value)
        .map_err(|e| ScmError::internal("Failed to serialize JSON").with_detail(e.to_string()))?;
    out.push('\n');
    Ok(out)
}

/// Default page JSON for a newly created page.
fn default_page_json(name: &str) -> String {
    let title = name
        .trim_end_matches(".json")
        .chars()
        .next()
        .map(|c| {
            let rest: String = name
                .trim_end_matches(".json")
                .chars()
                .skip(1)
                .collect();
            format!("{}{}", c.to_uppercase(), rest)
        })
        .unwrap_or_else(|| "Page".to_string());

    format!(
        r#"{{
  "version": 1,
  "title": "{title}",
  "meta": {{
    "description": "",
    "og_image": ""
  }},
  "classes": [],
  "root": {{
    "id": "root",
    "type": "box",
    "props": {{
      "element": "main"
    }},
    "styles": {{}},
    "classes": [],
    "children": []
  }}
}}
"#
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::ResponseError;
    use std::fs;
    use std::sync::atomic::{AtomicUsize, Ordering};

    static COUNTER: AtomicUsize = AtomicUsize::new(0);

    fn setup() -> PathBuf {
        let n = COUNTER.fetch_add(1, Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!(
            "scm-pages-test-{}-{}",
            std::process::id(),
            n
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("pages")).unwrap();
        dir
    }

    #[tokio::test]
    async fn list_empty_pages_dir() {
        let dir = setup();
        let files = list_pages(&dir).await.unwrap();
        assert!(files.is_empty());
        fs::remove_dir_all(&dir).unwrap();
    }

    #[tokio::test]
    async fn create_and_list_pages() {
        let dir = setup();
        create_page(&dir, "index.json", None).await.unwrap();
        create_page(&dir, "about.json", None).await.unwrap();

        let files = list_pages(&dir).await.unwrap();
        assert_eq!(files.len(), 2);
        assert_eq!(files[0].name, "about.json");
        assert_eq!(files[1].name, "index.json");

        fs::remove_dir_all(&dir).unwrap();
    }

    #[tokio::test]
    async fn load_page_roundtrip() {
        let dir = setup();
        create_page(&dir, "test.json", None).await.unwrap();
        let content = load_page(&dir, "test.json").await.unwrap();
        assert!(content.contains("\"version\": 1"));
        assert!(content.contains("\"title\": \"Test\""));
        fs::remove_dir_all(&dir).unwrap();
    }

    #[tokio::test]
    async fn save_page_validates_json() {
        let dir = setup();
        create_page(&dir, "test.json", None).await.unwrap();
        let err = save_page(&dir, "test.json", "not json").await.unwrap_err();
        assert_eq!(err.category(), "invalid-json");
        fs::remove_dir_all(&dir).unwrap();
    }

    #[tokio::test]
    async fn delete_index_json_rejected() {
        let dir = setup();
        create_page(&dir, "index.json", None).await.unwrap();
        let err = delete_page(&dir, "index.json").await.unwrap_err();
        assert_eq!(err.category(), "config");
        assert!(err.message().contains("Cannot delete index.json"));
        fs::remove_dir_all(&dir).unwrap();
    }

    #[tokio::test]
    async fn delete_non_index_works() {
        let dir = setup();
        create_page(&dir, "about.json", None).await.unwrap();
        delete_page(&dir, "about.json").await.unwrap();
        let files = list_pages(&dir).await.unwrap();
        assert!(files.is_empty());
        fs::remove_dir_all(&dir).unwrap();
    }

    #[tokio::test]
    async fn create_duplicate_rejected() {
        let dir = setup();
        create_page(&dir, "test.json", None).await.unwrap();
        let err = create_page(&dir, "test.json", None).await.unwrap_err();
        assert_eq!(err.status_code(), actix_web::http::StatusCode::CONFLICT);
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn default_page_json_has_correct_structure() {
        let json = default_page_json("contact.json");
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["version"], 1);
        assert_eq!(parsed["title"], "Contact");
        assert_eq!(parsed["root"]["type"], "box");
        assert_eq!(parsed["root"]["props"]["element"], "main");
    }
}
