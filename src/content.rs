//! JSON content discovery, loading, and saving (spec §8, §9).
//!
//! Discovery scans only direct children of `content_dir`; nested directories
//! are ignored in version one. All path inputs are traversal-checked before
//! any I/O; all writes are atomic (temp file → rename).

use crate::error::{ScmError, ScmResult};
use crate::paths::{safe_join, valid_content_filename};
use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize)]
pub struct ContentFile {
    pub name: String,
}

fn require_valid_name(name: &str) -> ScmResult<()> {
    if !valid_content_filename(name) {
        return Err(ScmError::config(format!("Invalid content filename '{name}'")));
    }
    if !name.ends_with(".json") {
        return Err(ScmError::config(format!(
            "Content files must have the .json extension, got '{name}'"
        )));
    }
    Ok(())
}

fn resolve_content_dir(checkout: &Path, content_dir: &str) -> ScmResult<PathBuf> {
    safe_join(checkout, Path::new(content_dir)).ok_or_else(|| {
        ScmError::config(format!(
            "content_dir '{content_dir}' escapes the target repository"
        ))
    })
}

/// List direct-child `.json` files of `checkout/content_dir`.
pub async fn list_files(checkout: &Path, content_dir: &str) -> ScmResult<Vec<ContentFile>> {
    let dir = resolve_content_dir(checkout, content_dir)?;

    let meta = tokio::fs::symlink_metadata(&dir).await.map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            ScmError::not_found(format!(
                "Content directory '{}' does not exist in this checkout",
                content_dir
            ))
            .with_detail(format!("Expected at: {}", dir.display()))
        } else {
            ScmError::filesystem("Could not inspect the content directory").with_detail(e.to_string())
        }
    })?;
    if !meta.is_dir() {
        return Err(ScmError::not_found(format!(
            "'{content_dir}' exists but is not a directory"
        )));
    }

    let scan_dir = dir.clone();
    tokio::task::spawn_blocking(move || -> std::io::Result<Vec<ContentFile>> {
        let mut files: Vec<ContentFile> = Vec::new();
        for entry in std::fs::read_dir(&scan_dir)? {
            let entry = entry?;
            // Symlink-aware metadata: a symlink (even to a regular file)
            // is not treated as a content entry.
            let meta = entry.metadata()?;
            if !meta.is_file() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().into_owned();
            if name.ends_with(".json") {
                files.push(ContentFile { name });
            }
        }
        files.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(files)
    })
    .await
    .map_err(|e| ScmError::internal("Content listing task panicked").with_detail(e.to_string()))?
    .map_err(|e| ScmError::filesystem("Could not read the content directory").with_detail(e.to_string()))
}

/// Load a single content file as raw text. No server-side reformatting.
pub async fn load_file(checkout: &Path, content_dir: &str, name: &str) -> ScmResult<String> {
    require_valid_name(name)?;
    let dir = resolve_content_dir(checkout, content_dir)?;
    let path = dir.join(name);

    tokio::fs::read_to_string(&path).await.map_err(|e| match e.kind() {
        std::io::ErrorKind::NotFound => {
            ScmError::not_found(format!("Content file '{name}' not found"))
        }
        _ => ScmError::filesystem(format!("Could not read content file '{name}'")).with_detail(e.to_string()),
    })
}

/// Create `name` with optional initial JSON inside an existing content dir.
/// Refuses to overwrite existing files.
pub async fn create_file(
    checkout: &Path,
    content_dir: &str,
    name: &str,
    initial: Option<&serde_json::Value>,
) -> ScmResult<PathBuf> {
    require_valid_name(name)?;
    let body = match initial {
        Some(v) => pretty_json(v)?,
        None => "{}\n".to_string(),
    };
    write_new(checkout, content_dir, name, &body).await
}

/// Validate `body` parses as any JSON root value and save it atomically to
/// the named content file (spec §9).
pub async fn save_file(checkout: &Path, content_dir: &str, name: &str, body: &str) -> ScmResult<()> {
    require_valid_name(name)?;

    // Any root type is allowed: object, array, string, number, boolean, null.
    let parsed: serde_json::Value = serde_json::from_str(body)
        .map_err(|e| ScmError::invalid_json("JSON syntax error — file was not saved").with_detail(e.to_string()))?;

    let pretty = pretty_json(&parsed)?;
    let path = resolve_existing_file(checkout, content_dir, name)?;
    write_atomic(&path, &pretty).await
}

/// Create the configured content directory if it does not exist.
pub async fn ensure_content_dir(checkout: &Path, content_dir: &str) -> ScmResult<PathBuf> {
    let dir = resolve_content_dir(checkout, content_dir)?;
    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|e| ScmError::filesystem("Could not create the content directory").with_detail(e.to_string()))?;
    Ok(dir)
}

// ================== INTERNALS ==================

fn resolve_existing_file(checkout: &Path, content_dir: &str, name: &str) -> ScmResult<PathBuf> {
    let dir = resolve_content_dir(checkout, content_dir)?;
    let path = dir.join(name);
    if !path.is_file() {
        return Err(ScmError::not_found(format!(
            "Content file '{name}' not found under '{content_dir}'"
        )));
    }
    Ok(path)
}

async fn write_new(checkout: &Path, content_dir: &str, name: &str, body: &str) -> ScmResult<PathBuf> {
    let dir = resolve_content_dir(checkout, content_dir)?;
    if !dir.is_dir() {
        return Err(ScmError::not_found(format!(
            "Content directory '{content_dir}' does not exist — create it first"
        )));
    }
    let path = dir.join(name);
    if path.exists() {
        return Err(ScmError::config(format!(
            "Content file '{name}' already exists"
        ))
        .with_status_conflict());
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
            path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default()
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
    .map_err(|e| ScmError::internal("Content writer task panicked").with_detail(e.to_string()))?
}

fn pretty_json(value: &serde_json::Value) -> ScmResult<String> {
    let mut out = serde_json::to_string_pretty(value)
        .map_err(|e| ScmError::internal("Failed to serialize JSON").with_detail(e.to_string()))?;
    out.push('\n');
    Ok(out)
}
