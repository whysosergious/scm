use actix_web::{http::StatusCode, HttpResponse, ResponseError};
use serde_json::json;
use std::fmt;

/// SCM error type shared by every module.
///
/// Carries a machine-readable category (spec §15), a user-readable message,
/// optional technical detail kept out of the API response and written to the
/// log instead, and the HTTP status derived from the category.
#[derive(Debug, Clone)]
pub struct ScmError {
    category: &'static str,
    status: StatusCode,
    status_override: Option<StatusCode>,
    message: String,
    detail: Option<String>,
}

impl ScmError {
    pub fn new(category: &'static str, status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            category,
            status,
            status_override: None,
            message: message.into(),
            detail: None,
        }
    }

    /// Attach technical detail for logs (never sent to the client).
    pub fn with_detail(mut self, detail: impl Into<String>) -> Self {
        self.detail = Some(detail.into());
        self
    }

    /// Override the derived HTTP status for cases where the category's
    /// default does not fit (e.g. "already exists" → 409).
    pub fn with_status(mut self, status: StatusCode) -> Self {
        self.status_override = Some(status);
        self
    }

    /// 409 Conflict override, used for "already exists"-style errors.
    pub fn with_status_conflict(self) -> Self {
        self.with_status(StatusCode::CONFLICT)
    }

    pub fn category(&self) -> &'static str {
        self.category
    }

    pub fn message(&self) -> &str {
        &self.message
    }

    pub fn detail(&self) -> Option<&str> {
        self.detail.as_deref()
    }

    /// Invalid configuration (spec §5, §10, §15).
    pub fn config(message: impl Into<String>) -> Self {
        Self::new("config", StatusCode::BAD_REQUEST, message)
    }

    /// Malformed or otherwise invalid JSON content (spec §9).
    pub fn invalid_json(message: impl Into<String>) -> Self {
        Self::new("invalid-json", StatusCode::BAD_REQUEST, message)
    }

    /// Missing files or directories.
    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new("not-found", StatusCode::NOT_FOUND, message)
    }

    /// Git conflicts, remote mismatches, non-fast-forward situations.
    pub fn git_conflict(message: impl Into<String>) -> Self {
        Self::new("git", StatusCode::CONFLICT, message)
    }

    /// Other Git failures (commit failed, invalid repository, ...).
    pub fn git(message: impl Into<String>) -> Self {
        Self::new("git", StatusCode::INTERNAL_SERVER_ERROR, message)
    }

    /// Filesystem failures.
    pub fn filesystem(message: impl Into<String>) -> Self {
        Self::new("filesystem", StatusCode::INTERNAL_SERVER_ERROR, message)
    }

    /// Network or remote failures (push rejected, clone unreachable).
    pub fn remote(message: impl Into<String>) -> Self {
        Self::new("network-remote", StatusCode::BAD_GATEWAY, message)
    }

    /// Internal invariant violations (should never happen; still handled).
    pub fn internal(message: impl Into<String>) -> Self {
        Self::new("internal", StatusCode::INTERNAL_SERVER_ERROR, message)
    }
}

impl fmt::Display for ScmError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}] {}", self.category, self.message)?;
        if let Some(detail) = &self.detail {
            write!(f, " ({detail})")?;
        }
        Ok(())
    }
}

impl std::error::Error for ScmError {}

impl From<std::io::Error> for ScmError {
    fn from(err: std::io::Error) -> Self {
        let message = match err.kind() {
            std::io::ErrorKind::NotFound => "File or directory not found".to_string(),
            std::io::ErrorKind::PermissionDenied => "Permission denied".to_string(),
            _ => "Filesystem operation failed".to_string(),
        };
        ScmError::filesystem(message).with_detail(err.to_string())
    }
}

impl ResponseError for ScmError {
    fn status_code(&self) -> StatusCode {
        self.status_override.unwrap_or(self.status)
    }

    fn error_response(&self) -> HttpResponse {
        let status = self.status_code();
        match status {
            StatusCode::CONFLICT | StatusCode::BAD_GATEWAY | StatusCode::INTERNAL_SERVER_ERROR => {
                log::error!("{self}")
            }
            _ => log::warn!("{self}"),
        }
        HttpResponse::build(status).json(json!({
            "error": {
                "category": self.category,
                "message": self.message,
                "detail": self.detail,
            }
        }))
    }
}

pub type ScmResult<T> = Result<T, ScmError>;
