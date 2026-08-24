//! Project checkout lifecycle (spec §6): clone-on-demand, verification of
//! existing checkouts, and status reporting for the control panel.

use crate::config::{AppConfig, ProjectConfig};
use crate::error::{ScmError, ScmResult};
use crate::git;
use crate::paths::safe_join;
use serde::Serialize;
use std::path::{Path, PathBuf};

/// Live checkout facts for the UI. `None`-able fields mean "could not be
/// determined" rather than "no".
#[derive(Debug, Clone, Serialize)]
pub struct CheckoutStatus {
    pub exists: bool,
    pub is_git_worktree: bool,
    pub remote_url: Option<String>,
    pub remote_matches: Option<bool>,
    pub branch_ready: Option<bool>,
}

impl CheckoutStatus {
    fn missing() -> Self {
        Self {
            exists: false,
            is_git_worktree: false,
            remote_url: None,
            remote_matches: None,
            branch_ready: None,
        }
    }
}

/// Directory of a project's local checkout, traversal-proof.
pub fn checkout_path(projects_root: &Path, project_id: &str) -> ScmResult<PathBuf> {
    safe_join(projects_root, Path::new(project_id)).ok_or_else(|| {
        ScmError::config(format!(
            "Project id '{project_id}' is not safe to use as a directory name"
        ))
    })
}

/// Best-effort status snapshot; never fails hard — missing pieces become
/// false/None so the panel can render an accurate picture.
pub async fn checkout_status(projects_root: &Path, project: &ProjectConfig) -> CheckoutStatus {
    let Ok(dest) = checkout_path(projects_root, &project.id) else {
        return CheckoutStatus::missing();
    };
    if !dest.is_dir() {
        return CheckoutStatus::missing();
    }

    let mut status = CheckoutStatus {
        exists: true,
        is_git_worktree: git::is_work_tree(&dest).await.unwrap_or(false),
        remote_url: None,
        remote_matches: None,
        branch_ready: None,
    };

    if status.is_git_worktree {
        if let Ok(Some(url)) = git::remote_url(&dest).await {
            status.remote_matches = Some(git::remotes_match(&url, &project.repo));
            status.remote_url = Some(url);
            status.branch_ready = Some(git::branch_exists(&dest, &project.branch).await.unwrap_or(false));
        }
    }
    status
}

/// Clone the project if its checkout does not exist; otherwise verify the
/// existing directory against the configuration (spec §6):
///
/// - path is a directory and a Git working tree
/// - a remote exists and corresponds to the configured repository
/// - the configured branch can be used
///
/// Never deletes or reverts anything on mismatch — it errors instead.
pub async fn ensure_checkout(projects_root: &Path, project: &ProjectConfig) -> ScmResult<CheckoutStatus> {
    let dest = checkout_path(projects_root, &project.id)?;

    if !dest.exists() {
        tokio::fs::create_dir_all(projects_root)
            .await
            .map_err(|e| ScmError::filesystem("Could not create the projects directory").with_detail(e.to_string()))?;
        log::info!(
            "Cloning '{}' into '{}'",
            project.repo,
            dest.display()
        );
        git::clone(&project.repo, &dest, &project.branch).await?;
    }

    verify_existing(&dest, project).await?;
    Ok(checkout_status(projects_root, project).await)
}

async fn verify_existing(dest: &Path, project: &ProjectConfig) -> ScmResult<()> {
    if !dest.is_dir() {
        return Err(ScmError::git_conflict(format!(
            "Existing target path '{}' is not a directory",
            dest.display()
        )));
    }
    if !git::is_work_tree(dest).await? {
        return Err(ScmError::git_conflict(format!(
            "Existing directory '{}' is not a Git working tree",
            dest.display()
        ))
        .with_detail("Refusing to reuse or delete it. Remove/rename the directory manually or fix the project id.".to_string()));
    }

    let Some(url) = git::remote_url(dest).await? else {
        return Err(ScmError::git_conflict(format!(
            "Checkout '{}' has no 'origin' remote configured",
            dest.display()
        )));
    };
    if !git::remotes_match(&url, &project.repo) {
        return Err(ScmError::git_conflict(format!(
            "Existing checkout points at a different remote ('{url}'), configured is '{}'",
            project.repo
        ))
        .with_detail(format!("Checkout directory: {}", dest.display())));
    }

    if !git::branch_exists(dest, &project.branch).await? {
        return Err(ScmError::not_found(format!(
            "Branch '{}' does not exist locally or on origin in this checkout",
            project.branch
        )));
    }
    Ok(())
}

/// Remove a project from the configuration only. Local files are never
/// touched (spec §6).
pub async fn remove_from_config(state: &crate::setup::AppState, id: &str) -> ScmResult<AppConfig> {
    let mut cfg = state.config();
    let before = cfg.projects.len();
    cfg.projects.retain(|p| p.id != id);
    if cfg.projects.len() == before {
        return Err(ScmError::not_found(format!("No project with id '{id}'")));
    }
    state.replace_config(cfg.clone()).await?;
    Ok(cfg)
}
