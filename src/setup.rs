//! Application state and startup bootstrap (spec §6).
//!
//! Plain structs behind `Arc<RwLock<_>>` — no Actix actors (spec §3).

use crate::config::{AppConfig, ProjectConfig};
use crate::error::{ScmError, ScmResult};
use std::path::PathBuf;
use std::sync::{Arc, RwLock};

#[derive(Clone)]
pub struct AppState {
    config: Arc<RwLock<AppConfig>>,
}

impl AppState {
    pub fn new(config: AppConfig) -> Self {
        Self {
            config: Arc::new(RwLock::new(config)),
        }
    }

    /// Read-only snapshot of the current configuration.
    pub fn config(&self) -> AppConfig {
        self.config.read().expect("config lock poisoned").clone()
    }

    /// Resolve `projects_dir` (already validated relative at load time)
    /// against the application working directory.
    pub fn projects_root(&self) -> PathBuf {
        PathBuf::from(self.config().projects_dir)
    }

    pub fn project_config(&self, id: &str) -> Option<ProjectConfig> {
        self.config()
            .projects
            .into_iter()
            .find(|p| p.id == id)
    }

    /// Atomically persist and swap in a new configuration document.
    /// Filesystem work happens inside `spawn_blocking` (spec §12).
    pub async fn replace_config(&self, new_config: AppConfig) -> ScmResult<()> {
        let path = crate::config::default_path();
        let to_save = new_config.clone();
        tokio::task::spawn_blocking(move || to_save.save_to(&path))
            .await
            .map_err(|e| ScmError::internal("Configuration writer task panicked").with_detail(e.to_string()))??;

        *self.config.write().expect("config lock poisoned") = new_config;
        Ok(())
    }
}

/// Bootstrap sequence from spec §6 steps 1–4: load config, validate,
/// make projects available. Server start happens in main.rs.
pub fn init() -> ScmResult<AppState> {
    let config = AppConfig::load(crate::config::default_path())?;
    log::info!(
        "Loaded configuration: {} project(s), projects_dir='{}'",
        config.projects.len(),
        config.projects_dir
    );
    Ok(AppState::new(config))
}
