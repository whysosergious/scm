//! Pure path-safety helpers shared by every module that touches the
//! filesystem. No I/O happens here; everything is lexically checkable and
//! unit-testable (spec §15).

use std::path::{Component, Path, PathBuf};

/// Validate a path that must be relative to some base directory.
///
/// Rejects absolute paths, empty strings, `..` traversal and any component
/// that is neither a normal name nor `.`.
pub fn validate_relative(path: &str) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("path must not be empty".to_string());
    }
    if path.contains('\\') {
        return Err(format!(
            "path must not contain backslashes, got '{path}'"
        ));
    }
    let p = Path::new(path);
    if p.is_absolute() {
        return Err(format!("path must be relative, got '{path}'"));
    }
    for comp in p.components() {
        match comp {
            Component::Normal(_) | Component::CurDir => {}
            Component::ParentDir => {
                return Err(format!("path must not contain '..': '{path}'"));
            }
            other => {
                return Err(format!(
                    "unsupported path component in '{path}': {other:?}"
                ));
            }
        }
    }
    Ok(())
}

/// A project ID must be safe as a single directory name: non-empty ASCII
/// letters/digits/`_`/`-` only — which also excludes separators and `.`/`..`.
pub fn valid_project_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 128
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

/// A content filename must be a single safe file name (no directories,
/// no traversal, no hidden/leading dot). Extension policy is enforced by
/// callers, not here.
pub fn valid_content_filename(name: &str) -> bool {
    if name.is_empty()
        || name.starts_with('.')
        || name.contains('/')
        || name.contains('\\')
        || name.contains('\0')
        || name != name.trim()
    {
        return false;
    }
    let p = Path::new(name);
    if !p.is_relative() {
        return false;
    }
    let mut comps = p.components();
    match (comps.next(), comps.next()) {
        (Some(Component::Normal(_)), None) => true,
        _ => false,
    }
}

/// Join `base` with a relative `rel`, refusing anything that could escape
/// `base`: absolute `rel`, any `..` component, or a result outside `base`
/// after normalization.
pub fn safe_join(base: &Path, rel: &Path) -> Option<PathBuf> {
    if rel.is_absolute() || rel.to_str()?.contains('\\') {
        return None;
    }
    let mut result = base.to_path_buf();
    for comp in rel.components() {
        match comp {
            Component::Normal(c) => result.push(c),
            Component::CurDir => {}
            // ParentDir / RootDir / Prefix are refused outright.
            _ => return None,
        }
    }
    if !result.starts_with(base) {
        return None;
    }
    Some(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_relative_accepts_plain_paths() {
        assert!(validate_relative("projects").is_ok());
        assert!(validate_relative("content/sub").is_ok());
        assert!(validate_relative("./content").is_ok());
    }

    #[test]
    fn validate_relative_rejects_bad_paths() {
        assert!(validate_relative("").is_err());
        assert!(validate_relative("   ").is_err());
        assert!(validate_relative("/etc").is_err());
        assert!(validate_relative("a/../b").is_err());
        assert!(validate_relative("..").is_err());
        assert!(validate_relative("a/..").is_err());
    }

    #[test]
    fn project_ids() {
        assert!(valid_project_id("wss-index"));
        assert!(valid_project_id("My_Site_2"));
        assert!(!valid_project_id(""));
        assert!(!valid_project_id("."));
        assert!(!valid_project_id(".."));
        assert!(!valid_project_id("a/b"));
        assert!(!valid_project_id("a\\b"));
        assert!(!valid_project_id("../escape"));
        assert!(!valid_project_id("white space"));
        assert!(!valid_project_id("héllo"));
    }

    #[test]
    fn content_filenames() {
        assert!(valid_content_filename("posts.json"));
        assert!(valid_content_filename("a-b_c9.txt"));
        assert!(!valid_content_filename(""));
        assert!(!valid_content_filename(".hidden"));
        assert!(!valid_content_filename(".."));
        assert!(!valid_content_filename("a/b.json"));
        assert!(!valid_content_filename("a\\b.json"));
        assert!(!valid_content_filename(" trailing "));
        assert!(!valid_content_filename("sub/dir.json"));
    }

    #[test]
    fn safe_join_basics() {
        let base = Path::new("projects/site");
        assert_eq!(
            safe_join(base, Path::new("content/posts.json")),
            Some(PathBuf::from("projects/site/content/posts.json"))
        );
        assert_eq!(
            safe_join(base, Path::new("./content")),
            Some(PathBuf::from("projects/site/content"))
        );
    }

    #[test]
    fn safe_join_rejects_escapes() {
        let base = Path::new("projects/site");
        assert_eq!(safe_join(base, Path::new("../other")), None);
        assert_eq!(safe_join(base, Path::new("/etc/passwd")), None);
        assert_eq!(safe_join(base, Path::new("content/../../x")), None);
        assert_eq!(safe_join(base, Path::new("C:\\tmp")), None);
    }
}
