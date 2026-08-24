//! Thin async wrapper over the Git CLI using `tokio::process` (spec §11, §12).
//!
//! The CLI is required so that a missing Git executable is a detectable,
//! user-facing failure. Only the operations listed below exist on purpose:
//! no reset/clean/checkout — SCM never reverts or deletes local content.

use crate::error::{ScmError, ScmResult};
use std::path::Path;
use tokio::process::Command;

#[derive(Debug, Clone)]
pub struct GitOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}

/// Map a spawn failure of the Git executable to an ScmError.
fn spawn_error(e: std::io::Error) -> ScmError {
    match e.kind() {
        std::io::ErrorKind::NotFound => ScmError::git(
            "Git executable not found. Install Git and make sure it is on PATH.",
        )
        .with_detail(e.to_string()),
        _ => ScmError::git("Failed to execute the Git executable").with_detail(e.to_string()),
    }
}

/// Run `git <args>` inside `dir`, capturing stdout/stderr.
async fn run(dir: Option<&Path>, args: &[&str]) -> ScmResult<GitOutput> {
    let mut cmd = Command::new("git");
    cmd.args(args)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
    if let Some(d) = dir {
        cmd.current_dir(d);
    }

    let output = cmd.output().await.map_err(spawn_error)?;

    Ok(GitOutput {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
    })
}

fn detail_of(out: &GitOutput, args: &[&str]) -> String {
    format!("git {} failed:\nstderr: {}\nstdout: {}", args.join(" "), out.stderr.trim(), out.stdout.trim())
}

// ================== READ OPERATIONS ==================

/// Is `dir` inside a Git working tree?
pub async fn is_work_tree(dir: &Path) -> ScmResult<bool> {
    let out = run(Some(dir), &["rev-parse", "--is-inside-work-tree"]).await?;
    Ok(out.success && out.stdout.trim() == "true")
}

/// URL of the `origin` remote, or None when it does not exist / is unreadable.
pub async fn remote_url(dir: &Path) -> ScmResult<Option<String>> {
    let out = run(Some(dir), &["remote", "get-url", "origin"]).await?;
    if out.success {
        Ok(Some(out.stdout.trim().to_string()))
    } else {
        Ok(None)
    }
}

/// Does `branch` exist as a local branch or as `origin/<branch>`?
pub async fn branch_exists(dir: &Path, branch: &str) -> ScmResult<bool> {
    let local = run(
        Some(dir),
        &[
            "rev-parse",
            "--verify",
            "--quiet",
            &format!("refs/heads/{branch}"),
        ],
    )
    .await?;
    if local.success {
        return Ok(true);
    }
    let remote = run(
        Some(dir),
        &[
            "rev-parse",
            "--verify",
            "--quiet",
            &format!("refs/remotes/origin/{branch}"),
        ],
    )
    .await?;
    Ok(remote.success)
}

/// Current checked-out branch (`HEAD` when detached).
pub async fn current_branch(dir: &Path) -> ScmResult<Option<String>> {
    let out = run(Some(dir), &["rev-parse", "--abbrev-ref", "HEAD"]).await?;
    if out.success {
        Ok(Some(out.stdout.trim().to_string()))
    } else {
        Ok(None)
    }
}

/// Raw `git status --porcelain=v1 -b` output (first line carries the branch).
pub async fn status_porcelain(dir: &Path) -> ScmResult<String> {
    let args = ["status", "--porcelain=v1", "-b"];
    let out = run(Some(dir), &args).await?;
    if !out.success {
        return Err(ScmError::git("Could not read Git status")
            .with_detail(detail_of(&out, &args)));
    }
    Ok(out.stdout)
}

// ================== MUTATING OPERATIONS ==================

/// Clone `repo` at `branch` into `dest_dir`.
pub async fn clone(repo: &str, dest_dir: &Path, branch: &str) -> ScmResult<()> {
    let dest_str = dest_dir.to_string_lossy().into_owned();
    let args = [
        "clone",
        "--branch",
        branch,
        "--single-branch",
        "--",
        repo,
        &dest_str,
    ];
    let out = run(None, &args).await?;
    if !out.success {
        Err(classify_git_failure(&out.stderr, &detail_of(&out, &args)))
    } else {
        Ok(())
    }
}

/// Stage explicit pathspecs (SCM stages the content directory only, spec §11).
pub async fn stage(dir: &Path, pathspecs: &[&str]) -> ScmResult<()> {
    let mut args: Vec<&str> = vec!["add", "--"];
    args.extend(pathspecs.iter().copied());
    let out = run(Some(dir), &args).await?;
    if !out.success {
        Err(ScmError::git("Staging changes failed").with_detail(detail_of(&out, &args)))
    } else {
        Ok(())
    }
}

/// Commit staged changes with `message`.
pub async fn commit(dir: &Path, message: &str) -> ScmResult<()> {
    let args = ["commit", "-m", message];
    let out = run(Some(dir), &args).await?;
    if !out.success {
        let stderr = out.stderr.trim();
        if stderr.contains("CONFLICT") || stderr.contains("unmerged") {
            Err(ScmError::git_conflict(
                "Commit failed due to merge conflicts in the working tree",
            )
            .with_detail(detail_of(&out, &args)))
        } else {
            Err(ScmError::git("Commit failed").with_detail(detail_of(&out, &args)))
        }
    } else {
        Ok(())
    }
}

/// Push the configured branch to origin.
pub async fn push(dir: &Path, branch: &str) -> ScmResult<()> {
    let args = ["push", "origin", branch];
    let out = run(Some(dir), &args).await?;
    if !out.success {
        Err(classify_push_failure(&out.stderr, &detail_of(&out, &args)))
    } else {
        Ok(())
    }
}

// ================== HELPERS ==================

/// Normalize a remote URL for comparison: trim whitespace and trailing
/// slashes, strip one trailing `.git`. Scheme/host case differences are
/// ignored for the comparison itself by lowercasing both sides here.
pub fn normalize_remote(url: &str) -> String {
    let mut s = url.trim().to_string();
    while s.ends_with('/') {
        s.pop();
    }
    if s.len() >= 4 && s[s.len() - 4..].eq_ignore_ascii_case(".git") {
        s.truncate(s.len() - 4);
    }
    while s.ends_with('/') {
        s.pop();
    }
    s.to_lowercase()
}

pub fn remotes_match(a: &str, b: &str) -> bool {
    normalize_remote(a) == normalize_remote(b)
}

/// Map a clone failure to the closest error category with a readable message.
pub fn classify_git_failure(stderr: &str, detail: &str) -> ScmError {
    let s = stderr.to_lowercase();
    if s.contains("authentication") || s.contains("could not read username") || s.contains("permission denied (publickey") {
        ScmError::remote("Authentication failed while accessing the repository").with_detail(detail.to_string())
    } else if s.contains("could not resolve host") || s.contains("connection timed out") || s.contains("network") || s.contains("connection refused") {
        ScmError::remote("Could not reach the remote repository (network problem)").with_detail(detail.to_string())
    } else if s.contains("not found") || s.contains("does not appear to be a git repository") {
        ScmError::not_found("Repository not found or unreachable").with_detail(detail.to_string())
    } else {
        ScmError::remote("Cloning the repository failed").with_detail(detail.to_string())
    }
}

/// Map a push failure to the closest error category with a readable message.
pub fn classify_push_failure(stderr: &str, detail: &str) -> ScmError {
    let s = stderr.to_lowercase();
    if s.contains("authentication") || s.contains("could not read username") || s.contains("permission denied (publickey") {
        ScmError::remote("Authentication failed during push").with_detail(detail.to_string())
    } else if s.contains("non-fast-forward") || s.contains("fetch first") || s.contains("rejected") {
        ScmError::git_conflict(
            "Push rejected: the remote has changes you do not have. Pull/rebase manually and retry.",
        )
        .with_detail(detail.to_string())
    } else if s.contains("conflict") {
        ScmError::git_conflict("Merge conflict detected while pushing").with_detail(detail.to_string())
    } else if s.contains("could not resolve host") || s.contains("connection timed out") || s.contains("network") || s.contains("connection refused") {
        ScmError::remote("Could not reach the remote repository (network problem)").with_detail(detail.to_string())
    } else {
        ScmError::remote("Pushing to the remote failed").with_detail(detail.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::http::StatusCode;
    use actix_web::ResponseError;
    use std::fs;
    use std::path::PathBuf;
    use std::process::Command as StdCommand;

    fn sh(dir: &Path, args: &[&str]) {
        let out = StdCommand::new("git")
            .args(args)
            .current_dir(dir)
            .env("GIT_AUTHOR_NAME", "t")
            .env("GIT_AUTHOR_EMAIL", "t@t")
            .env("GIT_COMMITTER_NAME", "t")
            .env("GIT_COMMITTER_EMAIL", "t@t")
            .output()
            .expect("git setup failed");
        assert!(out.status.success(), "git {args:?}: {}", String::from_utf8_lossy(&out.stderr));
    }

    /// Build bare origin + seeded first commit so `clone --branch` has a HEAD.
    fn make_origin(base: &Path) -> (String, PathBuf) {
        let origin = base.join("origin.git");
        let seed = base.join("seed");
        fs::create_dir_all(&seed).unwrap();
        sh(base, &["init", "-q", "--bare", "-b", "main", origin.to_str().unwrap()]);
        sh(&seed, &["init", "-q", "-b", "main"]);
        fs::create_dir_all(seed.join("content")).unwrap();
        fs::write(seed.join("content/posts.json"), r#"{"posts":[]}"#).unwrap();
        sh(&seed, &["add", "--", "."]);
        sh(&seed, &["commit", "-q", "-m", "seed"]);
        sh(&seed, &["remote", "add", "origin", origin.to_str().unwrap()]);
        sh(&seed, &["push", "-q", "origin", "main"]);
        (
            format!("file://{}", origin.to_str().unwrap()),
            origin,
        )
    }

    #[tokio::test]
    async fn clone_read_ops_and_publish_roundtrip() {
        let base = std::env::temp_dir().join(format!("scm-git-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();

        let (url, _origin) = make_origin(&base);
        let dest = base.join("wss-index");

        // clone
        clone(&url, &dest, "main").await.unwrap();
        assert!(is_work_tree(&dest).await.unwrap());

        // remote detection + normalization
        let ru = remote_url(&dest).await.unwrap().unwrap();
        assert!(remotes_match(&ru, &url));
        assert!(!remotes_match(&ru, "https://github.com/someone/else.git"));

        // branch ops
        assert!(branch_exists(&dest, "main").await.unwrap());
        assert!(!branch_exists(&dest, "nope").await.unwrap());
        assert_eq!(current_branch(&dest).await.unwrap().as_deref(), Some("main"));

        // status starts clean
        let st = status_porcelain(&dest).await.unwrap();
        assert!(st.lines().all(|l| !l.starts_with(|c: char| c != '#' && c != '?') || l.starts_with("##")));
        assert!(!st.lines().any(|l| l.as_bytes().first().is_some_and(|b| b.is_ascii_digit() || b.is_ascii_uppercase())));

        // edit → stage → commit → push
        fs::write(dest.join("content/posts.json"), r#"{"posts":[1]}"#).unwrap();
        stage(&dest, &["content"]).await.unwrap();
        commit(&dest, "Update content").await.unwrap();
        push(&dest, "main").await.unwrap();

        let st2 = status_porcelain(&dest).await.unwrap();
        assert!(st2.lines().filter(|l| !l.starts_with("##")).count() == 0, "expected clean tree, got {st2}");

        // failure classification: pushing against a diverged remote
        let other = base.join("other");
        clone(&url, &other, "main").await.unwrap();
        fs::write(other.join("content/posts.json"), r#"{"posts":[2]}"#).unwrap();
        stage(&other, &["content"]).await.unwrap();
        commit(&other, "diverge").await.unwrap();
        // force remote forward via seed clone (dest) then try stale push from other
        fs::write(dest.join("content/posts.json"), r#"{"posts":[3]}"#).unwrap();
        stage(&dest, &["content"]).await.unwrap();
        commit(&dest, "ahead").await.unwrap();
        push(&dest, "main").await.unwrap();
        let err = push(&other, "main").await.unwrap_err();
        assert_eq!(err.category(), "git", "unexpected: {err}");
        assert!(err.status_code() == StatusCode::CONFLICT);

        fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn spawn_error_mapping() {
        let e = spawn_error(std::io::Error::from_raw_os_error(libc_enoent()));
        assert!(e.message().starts_with("Git executable not found"));

        // A bogus binary name yields io::ErrorKind::NotFound, which run()
        // maps through spawn_error.
        let rt = tokio::runtime::Builder::new_current_thread().build().unwrap();
        let err = rt.block_on(async {
            let mut cmd = Command::new("scm-definitely-not-git");
            cmd.arg("status");
            cmd.output().await.expect_err("expected spawn failure").kind()
        });
        assert_eq!(err, std::io::ErrorKind::NotFound);
    }

    fn libc_enoent() -> i32 {
        2 // ENOENT on Linux/macOS
    }
}
