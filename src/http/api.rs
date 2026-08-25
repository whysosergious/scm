//! JSON API under `/api/*` (spec §12): configuration, projects, content,
//! Git status and publishing. Handlers stay thin: extract → validate →
//! delegate to module functions → serialize.

use crate::config::{AppConfig, ProjectConfig};
use crate::content;
use crate::error::{ScmError, ScmResult};
use crate::git;
use crate::project::{self, CheckoutStatus};
use crate::setup::AppState;
use actix_web::{delete, get, http::header, post, put, web, HttpResponse, Responder};
use actix_web::ResponseError as _;
use serde::Deserialize;
use serde_json::{json, Value};

type Ctx = web::Data<AppState>;

// ================== HELPERS ==================

fn utf8_body(body: &web::Bytes) -> ScmResult<&str> {
    std::str::from_utf8(body).map_err(|_| ScmError::invalid_json("Request body must be UTF-8 text"))
}

/// Parse a request body as any JSON value.
fn json_body(body: &web::Bytes) -> ScmResult<Value> {
    let text = utf8_body(body)?;
    serde_json::from_str(text)
        .map_err(|e| ScmError::invalid_json("Request body is not valid JSON").with_detail(e.to_string()))
}

fn get_project(state: &Ctx, id: String) -> ScmResult<ProjectConfig> {
    state.project_config(&id).ok_or_else(|| {
        ScmError::not_found(format!("No project with id '{id}' in the configuration"))
    })
}

fn slugify(input: &str) -> String {
    let mut slug = String::with_capacity(input.len());
    let mut last_dash = false;
    for c in input.chars().map(|c| c.to_ascii_lowercase()) {
        if c.is_ascii_alphanumeric() || c == '_' {
            slug.push(c);
            last_dash = false;
        } else if !last_dash && !slug.is_empty() {
            slug.push('-');
            last_dash = true;
        }
    }
    while slug.ends_with('-') {
        slug.pop();
    }
    if slug.is_empty() {
        slug.push_str("project");
    }
    slug
}

// ================== CONFIG ==================

#[get("/config")]
pub async fn get_config(state: Ctx) -> impl Responder {
    HttpResponse::Ok().json(state.config())
}

/// Replace the whole configuration: parse → validate → atomic save → swap
/// in-memory state (spec §10 steps 1–5). Unknown keys survive because the
/// config types capture them via `#[serde(flatten)]`.
#[post("/config")]
pub async fn put_config(state: Ctx, body: web::Bytes) -> ScmResult<HttpResponse> {
    let text = utf8_body(&body)?;
    let new_config = AppConfig::parse_str(text)?;
    state.replace_config(new_config.clone()).await?;
    Ok(HttpResponse::Ok().json(json!({
        "saved": true,
        "projects": new_config.projects.len(),
    })))
}

// ================== PROJECTS ==================

#[get("/projects")]
pub async fn list_projects(state: Ctx) -> ScmResult<HttpResponse> {
    let cfg = state.config();
    let root = state.projects_root();

    let mut projects = Vec::with_capacity(cfg.projects.len());
    for p in &cfg.projects {
        let mut entry = serde_json::to_value(p)
            .map_err(|e| ScmError::internal("Failed to serialize project").with_detail(e.to_string()))?;
        let status = project::checkout_status(&root, p).await;
        entry["checkout"] = serde_json::to_value(status)
            .map_err(|e| ScmError::internal("Failed to serialize checkout status").with_detail(e.to_string()))?;
        projects.push(entry);
    }

    Ok(HttpResponse::Ok().json(json!({
        "projects_dir": cfg.projects_dir,
        "projects": projects,
    })))
}

#[derive(Deserialize)]
pub struct ImportProjectBody {
    pub id: Option<String>,
    pub name: Option<String>,
    pub repo: String,
    pub branch: String,
    #[serde(default = "default_content_dir")]
    pub content_dir: String,
    /// Clone immediately after saving the configuration (default false).
    pub clone_now: Option<bool>,
}

fn default_content_dir() -> String {
    "content".to_string()
}

/// Import a new target website project (spec §14 empty-state action).
#[post("/projects")]
pub async fn import_project(state: Ctx, body: web::Bytes) -> ScmResult<HttpResponse> {
    let parsed = json_body(&body)?;
    let body: ImportProjectBody = serde_json::from_value(parsed)
        .map_err(|e| ScmError::config("Invalid import payload").with_detail(e.to_string()))?;

    let mut cfg = state.config();

    let id = match body.id.as_deref() {
        Some(id) => id.trim().to_string(),
        None => slugify(body.name.as_deref().unwrap_or(&body.repo)),
    };
    if !crate::paths::valid_project_id(&id) {
        return Err(ScmError::config(format!(
            "Invalid project id '{id}': use ASCII letters, digits, '_' or '-' only"
        )));
    }
    if cfg.projects.iter().any(|p| p.id == id) {
        return Err(ScmError::config(format!(
            "A project with id '{id}' already exists"
        ))
        .with_status_conflict());
    }

    let project_cfg = ProjectConfig {
        id: id.clone(),
        name: body.name.unwrap_or_else(|| id.clone()),
        repo: body.repo.trim().to_string(),
        branch: body.branch.trim().to_string(),
        content_dir: body.content_dir.trim().to_string(),
        extra: Default::default(),
    };
    cfg.projects.push(project_cfg.clone());
    state.replace_config(cfg).await?;

    let root = state.projects_root();
    let checkout = if body.clone_now.unwrap_or(false) {
        Some(project::ensure_checkout(&root, &project_cfg).await?)
    } else {
        None
    };

    Ok(HttpResponse::Created().json(json!({
        "project": project_cfg,
        "checkout": checkout,
    })))
}

/// Remove a project from the configuration only; local checkout files are
/// never touched (spec §6).
#[delete("/projects/{id}")]
pub async fn delete_project(state: Ctx, path: web::Path<String>) -> ScmResult<HttpResponse> {
    let id = path.into_inner();
    let cfg = project::remove_from_config(&state, &id).await?;
    Ok(HttpResponse::Ok().json(json!({
        "removed": id,
        "remaining_projects": cfg.projects.len(),
    })))
}

/// Clone-or-verify the checkout for a project.
#[post("/projects/{id}/checkout")]
pub async fn ensure_checkout(state: Ctx, path: web::Path<String>) -> ScmResult<HttpResponse> {
    let p = get_project(&state, path.into_inner())?;
    let root = state.projects_root();
    let status: CheckoutStatus = project::ensure_checkout(&root, &p).await?;
    Ok(HttpResponse::Ok().json(status))
}

#[post("/projects/{id}/ensure-content-dir")]
pub async fn create_content_dir(state: Ctx, path: web::Path<String>) -> ScmResult<HttpResponse> {
    let p = get_project(&state, path.into_inner())?;
    let dest = project::checkout_path(&state.projects_root(), &p.id)?;
    if !dest.is_dir() {
        return Err(ScmError::not_found(format!(
            "Checkout '{}' does not exist yet — fetch the project first",
            p.id
        )));
    }
    content::ensure_content_dir(&dest, &p.content_dir).await?;
    Ok(HttpResponse::Ok().json(json!({ "created": true, "content_dir": p.content_dir })))
}

// ================== CONTENT ==================

#[get("/projects/{id}/content")]
pub async fn list_content(state: Ctx, path: web::Path<String>) -> ScmResult<HttpResponse> {
    let p = get_project(&state, path.into_inner())?;
    let dest = project::checkout_path(&state.projects_root(), &p.id)?;
    let files = content::list_files(&dest, &p.content_dir).await?;
    Ok(HttpResponse::Ok().json(json!({ "files": files })))
}

#[derive(Deserialize)]
pub struct CreateFileBody {
    pub name: String,
    #[serde(default)]
    pub initial: Option<Value>,
}

#[post("/projects/{id}/content")]
pub async fn create_content_file(
    state: Ctx,
    path: web::Path<String>,
    body: web::Bytes,
) -> ScmResult<HttpResponse> {
    let p = get_project(&state, path.into_inner())?;
    let parsed = json_body(&body)?;
    let body: CreateFileBody = serde_json::from_value(parsed)
        .map_err(|e| ScmError::config("Invalid create-file payload").with_detail(e.to_string()))?;

    let dest = project::checkout_path(&state.projects_root(), &p.id)?;
    content::create_file(&dest, &p.content_dir, &body.name, body.initial.as_ref()).await?;
    Ok(HttpResponse::Created().json(json!({ "created": true, "name": body.name })))
}

#[get("/projects/{id}/content/{name}")]
pub async fn get_content_file(state: Ctx, path: web::Path<(String, String)>) -> ScmResult<HttpResponse> {
    let (id, name) = path.into_inner();
    let p = get_project(&state, id)?;
    let dest = project::checkout_path(&state.projects_root(), &p.id)?;
    let raw = content::load_file(&dest, &p.content_dir, &name).await?;
    Ok(HttpResponse::Ok()
        .insert_header((header::CONTENT_TYPE, "application/json"))
        .body(raw))
}

#[put("/projects/{id}/content/{name}")]
pub async fn put_content_file(
    state: Ctx,
    path: web::Path<(String, String)>,
    body: web::Bytes,
) -> ScmResult<HttpResponse> {
    let (id, name) = path.into_inner();
    let p = get_project(&state, id)?;
    let text = utf8_body(&body)?;
    let dest = project::checkout_path(&state.projects_root(), &p.id)?;
    content::save_file(&dest, &p.content_dir, &name, text).await?;
    Ok(HttpResponse::Ok().json(json!({ "saved": true, "name": name })))
}

// ================== ASSETS ==================

const IMAGE_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "ico", "bmp"];
const MAX_ASSET_BYTES: usize = 20 * 1024 * 1024;

/// Sanitize a client-supplied filename to a safe single path component and
/// enforce the image extension allowlist. Returns (stem, lowercase_ext).
fn sanitize_image_filename(raw: &str) -> Option<(String, String)> {
    let base = raw.rsplit(['/', '\\']).next()?.trim();
    if base.is_empty() || base.len() > 120 {
        return None;
    }
    let (stem, ext) = base.rsplit_once('.')?;
    let ext = ext.to_ascii_lowercase();
    if !IMAGE_EXTENSIONS.contains(&ext.as_str()) {
        return None;
    }
    let cleaned: String = stem
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.' { c } else { '-' })
        .collect();
    let stem = cleaned.trim_matches('-').trim_matches('.').to_string();
    if stem.is_empty() {
        return None;
    }
    Some((stem, ext))
}

#[derive(Deserialize)]
pub struct AssetQuery {
    pub filename: String,
}

/// Upload an image into the checkout's `public/images/` folder.
/// Body: raw image bytes. Query: ?filename=photo.png
/// Responds with the site-relative URL to embed in content.
#[post("/projects/{id}/assets")]
pub async fn upload_asset(
    state: Ctx,
    path: web::Path<String>,
    query: web::Query<AssetQuery>,
    body: web::Bytes,
) -> ScmResult<HttpResponse> {
    let p = get_project(&state, path.into_inner())?;
    if body.is_empty() {
        return Err(ScmError::config("Empty upload — no image data received"));
    }
    if body.len() > MAX_ASSET_BYTES {
        return Err(ScmError::config("Image too large (max 20 MB)"));
    }
    let Some((stem, ext)) = sanitize_image_filename(&query.filename) else {
        return Err(ScmError::config(
            "Invalid image filename — allowed extensions: png, jpg, jpeg, gif, webp, svg, avif, ico, bmp",
        ));
    };

    let dest = project::checkout_path(&state.projects_root(), &p.id)?;
    if !dest.is_dir() {
        return Err(ScmError::not_found(format!(
            "Checkout '{}' does not exist yet — fetch the project first",
            p.id
        )));
    }
    let assets_dir = crate::paths::safe_join(&dest, std::path::Path::new("public/images"))
        .ok_or_else(|| ScmError::config("Asset path failed safety validation"))?;

    // Deduplicate: photo.png -> photo-2.png -> photo-3.png …
    let final_name = {
        let assets_dir = assets_dir.clone();
        tokio::task::spawn_blocking(move || -> ScmResult<String> {
            std::fs::create_dir_all(&assets_dir)
                .map_err(|e| ScmError::filesystem("Could not create the images directory").with_detail(e.to_string()))?;
            let mut candidate = format!("{stem}.{ext}");
            let mut n = 2;
            while assets_dir.join(&candidate).exists() {
                candidate = format!("{stem}-{n}.{ext}");
                n += 1;
            }
            Ok(candidate)
        })
        .await
        .map_err(|e| ScmError::internal("Asset task panicked").with_detail(e.to_string()))??
    };

    let file_path = assets_dir.join(&final_name);
    let bytes = body.to_vec();
    tokio::task::spawn_blocking(move || -> ScmResult<()> {
        let write = || -> std::io::Result<()> {
            use std::io::Write as _;
            let mut f = std::fs::File::create(&file_path)?;
            f.write_all(&bytes)?;
            f.flush()?;
            f.sync_all()?;
            Ok(())
        };
        write().map_err(|e| ScmError::filesystem("Could not write the uploaded image").with_detail(e.to_string()))
    })
    .await
    .map_err(|e| ScmError::internal("Asset task panicked").with_detail(e.to_string()))??;

    let url = format!("/public/images/{final_name}");
    log::info!("Asset uploaded: {} ({} bytes)", url, body.len());
    Ok(HttpResponse::Created().json(json!({ "url": url, "file": final_name })))
}

// ================== GIT STATUS + PUBLISH ==================

#[derive(Debug, Clone, serde::Serialize)]
pub struct StatusFile {
    pub x: char,
    pub y: char,
    pub path: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ParsedStatus {
    pub branch: Option<String>,
    pub upstream: Option<String>,
    pub ahead: u32,
    pub behind: u32,
    pub files: Vec<StatusFile>,
    pub clean: bool,
}

pub fn parse_status(raw: &str) -> ParsedStatus {
    let mut result = ParsedStatus {
        branch: None,
        upstream: None,
        ahead: 0,
        behind: 0,
        files: Vec::new(),
        clean: true,
    };

    for (i, line) in raw.lines().enumerate() {
        if i == 0 && line.starts_with("## ") {
            let info = &line[3..];
            let mut parts = info.splitn(2, "...");
            result.branch = Some(parts.next().unwrap_or_default().trim().to_string());
            let rest = parts.next().unwrap_or("");
            let rest = rest.split(" [").next().unwrap_or(rest);
            result.upstream = (!rest.is_empty()).then(|| rest.trim().to_string());
            if let Some(idx) = info.find("[ahead ") {
                result.ahead = info[idx + 7..]
                    .split(|c: char| !c.is_ascii_digit())
                    .next()
                    .and_then(|d| d.parse().ok())
                    .unwrap_or(0);
            }
            if let Some(idx) = info.find("[behind ") {
                result.behind = info[idx + 8..]
                    .split(|c: char| !c.is_ascii_digit())
                    .next()
                    .and_then(|d| d.parse().ok())
                    .unwrap_or(0);
            }
            continue;
        }
        let bytes = line.as_bytes();
        if bytes.len() < 4 {
            continue;
        }
        let x = bytes[0] as char;
        let y = bytes[1] as char;
        let mut file_path = line[3..].to_string();
        if let Some((_old, new)) = file_path.split_once(" -> ") {
            file_path = new.to_string();
        }
        result.files.push(StatusFile {
            x,
            y,
            path: file_path,
        });
    }
    result.clean = result.files.is_empty();
    result
}

#[get("/projects/{id}/git/status")]
pub async fn git_status(state: Ctx, path: web::Path<String>) -> ScmResult<HttpResponse> {
    let p = get_project(&state, path.into_inner())?;
    let dest = project::checkout_path(&state.projects_root(), &p.id)?;

    if !dest.is_dir() {
        return Err(ScmError::not_found(format!(
            "Checkout for '{0}' does not exist yet — select/fetch the project first",
            p.id
        )));
    }
    let raw = git::status_porcelain(&dest).await?;
    Ok(HttpResponse::Ok().json(parse_status(&raw)))
}

#[derive(Deserialize, Default)]
pub struct PublishBody {
    #[serde(default)]
    pub message: Option<String>,
}

/// Outcome names cover every case from spec §11.
#[derive(Debug, Clone, serde::Serialize)]
pub struct PublishOutcome {
    pub outcome: String,
    pub message: String,
    pub branch: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

/// Stage the configured content directory → commit → push (spec §11).
/// Local content is never reverted on failure; the outcome says what happened.
#[post("/projects/{id}/publish")]
pub async fn publish(state: Ctx, path: web::Path<String>, body: web::Bytes) -> ScmResult<HttpResponse> {
    let p = get_project(&state, path.into_inner())?;
    let message = if body.is_empty() {
        None
    } else {
        serde_json::from_slice::<PublishBody>(&body)
            .ok()
            .and_then(|b| b.message)
            .map(|m| m.trim().to_string())
            .filter(|m| !m.is_empty())
    }
    .unwrap_or_else(|| "Update content".to_string());

    let dest = project::checkout_path(&state.projects_root(), &p.id)?;

    let mk = |outcome: &str, msg: &str, detail: Option<String>| PublishOutcome {
        outcome: outcome.to_string(),
        message: msg.to_string(),
        branch: Some(p.branch.clone()),
        detail,
    };

    // Verify this is a usable checkout before touching anything.
    if !dest.is_dir() || !git::is_work_tree(&dest).await.unwrap_or(false) {
        return Ok(HttpResponse::Ok().json(mk(
            "invalid_repo",
            "The local directory is not a valid Git working tree",
            None,
        )));
    }

    let status = match git::status_porcelain(&dest).await {
        Ok(s) => s,
        Err(e) => return Ok(HttpResponse::Ok().json(outcome_from_error(e, "commit_failed", &mk))),
    };

    let parsed = parse_status(&status);
    if parsed.clean {
        return Ok(HttpResponse::Ok().json(mk(
            "no_changes",
            "Nothing to publish — the working tree is clean",
            None,
        )));
    }

    // Stage the content directory plus the assets folder when present
    // (uploaded images live in <checkout>/public/images).
    let mut pathspecs = vec![p.content_dir.clone()];
    let assets_dir = "public/images";
    if dest.join(assets_dir).is_dir() {
        pathspecs.push(assets_dir.to_string());
    }
    let stage_refs: Vec<&str> = pathspecs.iter().map(|s| s.as_str()).collect();
    if let Err(e) = git::stage(&dest, &stage_refs).await {
        return Ok(HttpResponse::Ok().json(outcome_from_error(e, "commit_failed", &mk)));
    }

    if let Err(e) = git::commit(&dest, &message).await {
        let outcome = if e.status_code() == actix_web::http::StatusCode::CONFLICT {
            "merge_conflict"
        } else {
            "commit_failed"
        };
        return Ok(HttpResponse::Ok().json(outcome_from_error(e, outcome, &mk)));
    }

    if let Err(e) = git::push(&dest, &p.branch).await {
        let outcome = push_outcome_name(&e);
        return Ok(HttpResponse::Ok().json(outcome_from_error(e, outcome, &mk)));
    }

    Ok(HttpResponse::Ok().json(PublishOutcome {
        outcome: "committed_and_pushed".to_string(),
        message: format!("Committed and pushed to origin/{}", p.branch),
        branch: Some(p.branch.clone()),
        detail: None,
    }))
}

fn outcome_from_error(
    err: ScmError,
    fallback: &str,
    mk: impl Fn(&str, &str, Option<String>) -> PublishOutcome,
) -> PublishOutcome {
    let outcome = match err.category() {
        "not-found" => "invalid_repo",
        "network-remote" => push_outcome_name(&err),
        "git" => {
            if err.message().contains("Git executable not found") {
                "git_missing"
            } else {
                fallback
            }
        }
        "filesystem" => fallback,
        _ => fallback,
    };
    mk(outcome, err.message(), err.detail().map(str::to_string))
}

fn push_outcome_name(err: &ScmError) -> &'static str {
    match err.category() {
        "git" => {
            if err.status_code() == actix_web::http::StatusCode::CONFLICT {
                "remote_rejected"
            } else {
                "push_failed"
            }
        }
        "network-remote" => {
            if err.message().contains("Authentication") {
                "auth_failed"
            } else {
                "push_failed"
            }
        }
        "not-found" => "invalid_repo",
        _ => "push_failed",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_porcelain_v1() {
        let raw = "## main...origin/main [ahead 1]\n\
                   M  content/posts.json\n\
                   ?? notes.json\n\
                   R  a.json -> b.json\n";
        let s = parse_status(raw);
        assert_eq!(s.branch.as_deref(), Some("main"));
        assert_eq!(s.upstream.as_deref(), Some("origin/main"));
        assert_eq!(s.ahead, 1);
        assert!(!s.clean);
        assert_eq!(s.files.len(), 3);
        assert_eq!(s.files[2].path, "b.json");
        assert_eq!(s.files[1].x, '?');
    }

    #[test]
    fn empty_status_is_clean() {
        let s = parse_status("## main...origin/main\n");
        assert!(s.clean);
        assert_eq!(s.ahead, 0);
        assert_eq!(s.behind, 0);
    }

    #[test]
    fn slugify_ids() {
        assert_eq!(slugify("My Cool Site"), "my-cool-site");
        assert_eq!(slugify("https://github.com/x/y.git"), "https-github-com-x-y-git");
        assert_eq!(slugify("---"), "project");
    }
}
