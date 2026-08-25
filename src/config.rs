//! Loading, validating, and atomically saving `scm-config.json` (spec §5, §10).

use crate::error::{ScmError, ScmResult};
use crate::paths;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::HashSet;
use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};

pub const CONFIG_FILE: &str = "scm-config.json";
pub const SUPPORTED_CONFIG_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub config_version: u32,
    pub projects_dir: String,
    #[serde(default)]
    pub projects: Vec<ProjectConfig>,
    /// Unknown top-level keys, preserved across load/save round-trips (spec §10).
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectConfig {
    pub id: String,
    pub name: String,
    pub repo: String,
    pub branch: String,
    pub content_dir: String,
    /// Per-project media folder (relative to checkout). Defaults to
    /// ./public/media/ when absent.
    #[serde(default = "default_media_dir")]
    pub media_dir: String,
    /// Unknown per-project keys, preserved across round-trips (spec §10).
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

pub fn default_path() -> PathBuf {
    PathBuf::from(CONFIG_FILE)
}

fn default_media_dir() -> String {
    "./public/media/".to_string()
}

impl AppConfig {
    /// Load and validate the configuration from `path`.
    /// Distinguishes unreadable file vs malformed JSON vs failed validation.
    pub fn load(path: impl AsRef<Path>) -> ScmResult<Self> {
        let raw = fs::read_to_string(path.as_ref()).map_err(|e| match e.kind() {
            std::io::ErrorKind::NotFound => ScmError::config(format!(
                "Configuration file '{}' not found",
                path.as_ref().display()
            ))
            .with_detail(e.to_string()),
            _ => ScmError::config(format!(
                "Could not read configuration file '{}'",
                path.as_ref().display()
            ))
            .with_detail(e.to_string()),
        })?;
        Self::parse_str(&raw)
    }

    /// Parse and validate a configuration document from raw JSON text.
    pub fn parse_str(raw: &str) -> ScmResult<Self> {
        let cfg: AppConfig = serde_json::from_str(raw)
            .map_err(|e| ScmError::config("Configuration is not valid JSON against the schema")
                .with_detail(e.to_string()))?;
        cfg.validate()?;
        Ok(cfg)
    }

    /// Enforce every rule from spec §5/§15. All violations produce
    /// user-readable messages.
    pub fn validate(&self) -> ScmResult<()> {
        if self.config_version != SUPPORTED_CONFIG_VERSION {
            return Err(ScmError::config(format!(
                "Unsupported config_version {}: this version supports {} only",
                self.config_version, SUPPORTED_CONFIG_VERSION
            )));
        }
        paths::validate_relative(&self.projects_dir)
            .map_err(|e| ScmError::config(format!("Invalid projects_dir: {e}")))?;

        let mut seen_ids: HashSet<&str> = HashSet::new();
        for project in &self.projects {
            if !paths::valid_project_id(&project.id) {
                return Err(ScmError::config(format!(
                    "Invalid project id '{}': must be non-empty ASCII letters, digits, '_' or '-' with no path separators",
                    project.id
                )));
            }
            if !seen_ids.insert(project.id.as_str()) {
                return Err(ScmError::config(format!(
                    "Duplicate project id '{}': project ids must be unique",
                    project.id
                )));
            }
            if project.name.trim().is_empty() {
                return Err(ScmError::config(format!(
                    "Project '{}' has an empty name",
                    project.id
                )));
            }
            if project.repo.trim().is_empty() {
                return Err(ScmError::config(format!(
                    "Project '{}' has an empty repository URL",
                    project.id
                )));
            }
            if project.branch.trim().is_empty() {
                return Err(ScmError::config(format!(
                    "Project '{}' has an empty branch name",
                    project.id
                )));
            }
            paths::validate_relative(&project.content_dir).map_err(|e| {
                ScmError::config(format!("Project '{}' has an invalid content_dir: {e}", project.id))
            })?;
            paths::validate_relative(&project.media_dir).map_err(|e| {
                ScmError::config(format!("Project '{}' has an invalid media_dir: {e}", project.id))
            })?;
        }
        Ok(())
    }

    /// Serialize the configuration and write it atomically over the file at
    /// `path`: temp file in the same directory → flush/sync → rename (spec §10).
    pub fn save_to(&self, path: impl AsRef<Path>) -> ScmResult<()> {
        self.validate()?;
        let path = path.as_ref();
        let mut body = serde_json::to_string_pretty(self)
            .map_err(|e| ScmError::internal("Failed to serialize configuration").with_detail(e.to_string()))?;
        body.push('\n');

        let file_name = path
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_else(|| CONFIG_FILE.to_string());
        let tmp = path.with_file_name(format!(".{file_name}.tmp"));

        let write_result = (|| -> std::io::Result<()> {
            let mut f = File::create(&tmp)?;
            f.write_all(body.as_bytes())?;
            f.flush()?;
            f.sync_all()?;
            drop(f);
            fs::rename(&tmp, path)?;
            Ok(())
        })();

        match write_result {
            Ok(()) => Ok(()),
            Err(e) => {
                // Best effort: don't leave temp litter behind.
                let _ = fs::remove_file(&tmp);
                Err(ScmError::filesystem(format!(
                    "Could not write configuration file '{}'",
                    path.display()
                ))
                .with_detail(e.to_string()))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    const VALID: &str = r#"{
        "config_version": 1,
        "projects_dir": "projects",
        "future_top_level": true,
        "projects": [
            {
                "id": "wss-index",
                "name": "WSS Index",
                "repo": "https://example.com/x.git",
                "branch": "main",
                "content_dir": "content",
                "future_project_key": 42
            }
        ]
    }"#;

    #[test]
    fn parses_and_preserves_unknown_keys() {
        let cfg = AppConfig::parse_str(VALID).unwrap();
        assert_eq!(cfg.extra.get("future_top_level"), Some(&json!(true)));
        assert_eq!(
            cfg.projects[0].extra.get("future_project_key"),
            Some(&json!(42))
        );
        let out = serde_json::to_value(&cfg).unwrap();
        assert_eq!(out["future_top_level"], json!(true));
        assert_eq!(out["projects"][0]["future_project_key"], json!(42));
    }

    #[test]
    fn rejects_bad_configs() {
        let mk = |patch: serde_json::Value| {
            let mut v = serde_json::to_value(&AppConfig::parse_str(VALID).unwrap()).unwrap();
            v["projects_dir"] = json!("projects");
            for (k, val) in patch.as_object().unwrap() {
                v[k.to_string()] = val.clone();
            }
            serde_json::to_string(&v).unwrap()
        };

        assert!(AppConfig::parse_str(&mk(json!({"config_version": 2}))).is_err());
        assert!(AppConfig::parse_str(&mk(json!({"projects_dir": "/abs"}))).is_err());
        assert!(AppConfig::parse_str(&mk(json!({"projects_dir": "a/../b"}))).is_err());

        let dup = r#"{ "config_version": 1, "projects_dir": "p",
            "projects": [
              {"id":"a","name":"A","repo":"r","branch":"b","content_dir":"c"},
              {"id":"a","name":"A2","repo":"r2","branch":"b2","content_dir":"c2"}
            ]}"#;
        let err = AppConfig::parse_str(dup).unwrap_err();
        assert_eq!(err.category(), "config");
        assert!(err.message().contains("Duplicate project id"));

        let bad_id = r#"{ "config_version": 1, "projects_dir": "p",
            "projects": [{"id":"../evil","name":"A","repo":"r","branch":"b","content_dir":"c"}]}"#;
        assert!(AppConfig::parse_str(bad_id).is_err());

        let bad_content = r#"{ "config_version": 1, "projects_dir": "p",
            "projects": [{"id":"ok","name":"A","repo":"r","branch":"b","content_dir":"/etc"}]}"#;
        assert!(AppConfig::parse_str(bad_content).is_err());
    }

    #[test]
    fn save_is_atomic_and_round_trips() {
        let dir = std::env::temp_dir().join(format!("scm-cfg-test-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join("scm-config.json");

        let cfg = AppConfig::parse_str(VALID).unwrap();
        cfg.save_to(&path).unwrap();
        assert!(!dir.join(".scm-config.json.tmp").exists(), "temp cleaned up");

        let reloaded = AppConfig::load(&path).unwrap();
        assert_eq!(reloaded.projects.len(), 1);
        assert_eq!(reloaded.projects[0].id, "wss-index");
        assert_eq!(reloaded.extra.get("future_top_level"), Some(&json!(true)));

        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn malformed_json_gives_config_error_not_panic() {
        let err = AppConfig::parse_str("{ not json").unwrap_err();
        assert_eq!(err.category(), "config");
    }
}
