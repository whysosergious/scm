//! JSON API under `/api/*` (spec §12): configuration, projects, content,
//! Git status and publishing. Handlers stay thin: extract → validate →
//! delegate to module functions → serialize.

use crate::config::{AppConfig, ProjectConfig};
use crate::content;
use crate::error::{ScmError, ScmResult};
use crate::git;
use crate::pages;
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
        media_dir: "./public/media/".to_string(),
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

// ================== PAGES ==================

#[derive(Deserialize)]
pub struct CreatePageBody {
    pub name: String,
    #[serde(default)]
    pub initial: Option<Value>,
}

/// List page JSON files in the project's pages/ directory.
#[get("/projects/{id}/pages")]
pub async fn list_pages(state: Ctx, path: web::Path<String>) -> ScmResult<HttpResponse> {
    let p = get_project(&state, path.into_inner())?;
    let dest = project::checkout_path(&state.projects_root(), &p.id)?;
    let files = pages::list_pages(&dest).await?;
    Ok(HttpResponse::Ok().json(json!({ "files": files })))
}

/// Load a page JSON file as raw text.
#[get("/projects/{id}/pages/{name}")]
pub async fn get_page(state: Ctx, path: web::Path<(String, String)>) -> ScmResult<HttpResponse> {
    let (id, name) = path.into_inner();
    let p = get_project(&state, id)?;
    let dest = project::checkout_path(&state.projects_root(), &p.id)?;
    let raw = pages::load_page(&dest, &name).await?;
    Ok(HttpResponse::Ok()
        .insert_header((header::CONTENT_TYPE, "application/json"))
        .body(raw))
}

/// Create a new page JSON file.
#[post("/projects/{id}/pages")]
pub async fn create_page(
    state: Ctx,
    path: web::Path<String>,
    body: web::Bytes,
) -> ScmResult<HttpResponse> {
    let p = get_project(&state, path.into_inner())?;
    let parsed = json_body(&body)?;
    let body: CreatePageBody = serde_json::from_value(parsed)
        .map_err(|e| ScmError::config("Invalid create-page payload").with_detail(e.to_string()))?;

    let dest = project::checkout_path(&state.projects_root(), &p.id)?;
    pages::create_page(&dest, &body.name, body.initial.as_ref()).await?;
    Ok(HttpResponse::Created().json(json!({ "created": true, "name": body.name })))
}

/// Save a page JSON file (validate + atomic write).
#[put("/projects/{id}/pages/{name}")]
pub async fn put_page(
    state: Ctx,
    path: web::Path<(String, String)>,
    body: web::Bytes,
) -> ScmResult<HttpResponse> {
    let (id, name) = path.into_inner();
    let p = get_project(&state, id)?;
    let text = utf8_body(&body)?;
    let dest = project::checkout_path(&state.projects_root(), &p.id)?;
    pages::save_page(&dest, &name, text).await?;
    Ok(HttpResponse::Ok().json(json!({ "saved": true, "name": name })))
}

/// Delete a non-index page JSON file.
#[delete("/projects/{id}/pages/{name}")]
pub async fn delete_page(
    state: Ctx,
    path: web::Path<(String, String)>,
) -> ScmResult<HttpResponse> {
    let (id, name) = path.into_inner();
    let p = get_project(&state, id)?;
    let dest = project::checkout_path(&state.projects_root(), &p.id)?;
    pages::delete_page(&dest, &name).await?;
    Ok(HttpResponse::Ok().json(json!({ "deleted": name })))
}

/// Generate static HTML from a page JSON file.
#[post("/projects/{id}/pages/{name}/generate")]
pub async fn generate_page(
    state: Ctx,
    path: web::Path<(String, String)>,
) -> ScmResult<HttpResponse> {
    let (id, name) = path.into_inner();
    let p = get_project(&state, id)?;
    let dest = project::checkout_path(&state.projects_root(), &p.id)?;

    let raw = pages::load_page(&dest, &name).await?;
    let doc: serde_json::Value = serde_json::from_str(&raw)
        .map_err(|e| ScmError::invalid_json("Page JSON is invalid").with_detail(e.to_string()))?;

    let output_path = crate::pages_gen::generate_html(&dest, &name, &doc)?;

    Ok(HttpResponse::Ok().json(json!({
        "generated": true,
        "output": output_path,
    })))
}

/// Serve generated HTML for preview.
#[get("/projects/{id}/pages/{name}/preview")]
pub async fn preview_page(
    state: Ctx,
    path: web::Path<(String, String)>,
) -> ScmResult<HttpResponse> {
    let (id, name) = path.into_inner();
    let p = get_project(&state, id)?;
    let dest = project::checkout_path(&state.projects_root(), &p.id)?;

    let html_name = name.trim_end_matches(".json").to_string() + ".html";
    let html_path = if name == "index.json" {
        dest.join(&html_name)
    } else {
        dest.join("pages").join(&html_name)
    };

    let html = tokio::fs::read_to_string(&html_path)
        .await
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                ScmError::not_found(format!(
                    "Generated HTML for '{name}' not found — generate it first"
                ))
            } else {
                ScmError::filesystem("Could not read generated HTML").with_detail(e.to_string())
            }
        })?;

    Ok(HttpResponse::Ok()
        .insert_header((header::CONTENT_TYPE, "text/html"))
        .body(html))
}

/// Import an HTML file into a page JSON document.
#[post("/projects/{id}/pages/import")]
pub async fn import_page(
    state: Ctx,
    path: web::Path<String>,
    body: web::Bytes,
) -> ScmResult<HttpResponse> {
    let p = get_project(&state, path.into_inner())?;
    let parsed = json_body(&body)?;
    let html = parsed
        .get("html")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ScmError::config("Import payload must contain { html }"))?;

    let dest = project::checkout_path(&state.projects_root(), &p.id)?;
    let result = crate::pages_import::import_html(html)?;

    // Save the imported page
    let page_name = result
        .get("saved_as")
        .and_then(|v| v.as_str())
        .unwrap_or("imported.json");
    let _page_json = serde_json::to_string_pretty(&result["page"])
        .map_err(|e| ScmError::internal("Failed to serialize imported page").with_detail(e.to_string()))?;
    pages::create_page(&dest, page_name, Some(&result["page"])).await?;

    Ok(HttpResponse::Ok().json(result))
}

// ================== MEDIA ==================

#[derive(Deserialize)]
pub struct AssetQuery {
    pub filename: String,
}

const MEDIA_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "gif", "webp", "svg", "avif", "ico", "bmp"];
const MAX_MEDIA_BYTES: usize = 20 * 1024 * 1024;

/// Validate a media filename: safe single component with an image extension
/// allow-list. Returns the normalized "stem.ext" form.
fn sanitize_media_filename(raw: &str) -> Option<String> {
    let base = raw.rsplit(['/', '\\']).next()?.trim();
    if base.is_empty() || base.len() > 120 {
        return None;
    }
    let (stem, ext) = base.rsplit_once('.')?;
    let ext = ext.to_ascii_lowercase();
    if !MEDIA_EXTENSIONS.contains(&ext.as_str()) {
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
    Some(format!("{stem}.{ext}"))
}

fn media_content_type(name: &str) -> &'static str {
    match name.rsplit_once('.').map(|(_, e)| e.to_ascii_lowercase()).as_deref() {
        Some("png") => "image/png",
        Some("jpg" | "jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("svg") => "image/svg+xml",
        Some("avif") => "image/avif",
        Some("ico") => "image/x-icon",
        Some("bmp") => "image/bmp",
        _ => "application/octet-stream",
    }
}

/// Resolve <checkout>/<media_dir> for a project (traversal-proof).
async fn media_dir_for(state: &Ctx, p: &ProjectConfig) -> ScmResult<std::path::PathBuf> {
    let checkout = project::checkout_path(&state.projects_root(), &p.id)?;
    if !checkout.is_dir() {
        return Err(ScmError::not_found(format!(
            "Checkout '{}' does not exist yet — fetch the project first",
            p.id
        )));
    }
    crate::paths::safe_join(&checkout, std::path::Path::new(&p.media_dir)).ok_or_else(|| {
        ScmError::config(format!("Invalid media_dir: '{}' escapes the checkout", p.media_dir))
    })
}

/// Site-relative URL for a media file (normalized, no ./ or trailing /).
fn media_site_url(media_dir: &str, name: &str) -> String {
    let dir = media_dir.trim_start_matches("./").trim_end_matches('/');
    format!("/{dir}/{name}")
}

#[derive(serde::Serialize)]
struct MediaEntry {
    name: String,
    size: u64,
    url: String,
    modified: i64,
}

/// List image files in the project's media directory.
#[get("/projects/{id}/media")]
pub async fn list_media(state: Ctx, path: web::Path<String>) -> ScmResult<HttpResponse> {
    let p = get_project(&state, path.into_inner())?;
    let dir = media_dir_for(&state, &p).await?;

    let files = {
        let media_dir = p.media_dir.clone();
        tokio::task::spawn_blocking(move || -> ScmResult<Vec<MediaEntry>> {
        let mut out: Vec<MediaEntry> = Vec::new();
        if dir.is_dir() {
            for entry in std::fs::read_dir(&dir)? {
                let entry = entry?;
                let meta = entry.metadata()?;
                if !meta.is_file() {
                    continue;
                }
                let raw = entry.file_name().to_string_lossy().into_owned();
                let Some(name) = sanitize_media_filename(&raw) else { continue };
                if name != raw {
                    continue; // only exact, already-normalized names
                }
                let modified = meta
                    .modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs() as i64)
                    .unwrap_or(0);
                out.push(MediaEntry {
                    url: media_site_url(&media_dir, &name),
                    name,
                    size: meta.len(),
                    modified,
                });
            }
        }
        out.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(out)
        })
        .await
        .map_err(|e| ScmError::internal("Media listing task panicked").with_detail(e.to_string()))??
    };

    Ok(HttpResponse::Ok().json(json!({ "media_dir": p.media_dir, "files": files })))
}

/// Serve a media file raw (for previews in the panel).
#[get("/projects/{id}/media/{name}")]
pub async fn serve_media(state: Ctx, path: web::Path<(String, String)>) -> ScmResult<HttpResponse> {
    let (id, name) = path.into_inner();
    let p = get_project(&state, id)?;
    let Some(normalized) = sanitize_media_filename(&name) else {
        return Err(ScmError::config("Invalid media filename"));
    };
    let dir = media_dir_for(&state, &p).await?;
    let file = dir.join(&normalized);
    let bytes = {
        let normalized = normalized.clone();
        tokio::task::spawn_blocking(move || -> ScmResult<Vec<u8>> {
            std::fs::read(&file).map_err(|e| {
                if e.kind() == std::io::ErrorKind::NotFound {
                    ScmError::not_found(format!("Media file '{normalized}' not found"))
                } else {
                    ScmError::filesystem("Could not read media file").with_detail(e.to_string())
                }
            })
        })
        .await
        .map_err(|e| ScmError::internal("Media serve task panicked").with_detail(e.to_string()))??
    };
    Ok(HttpResponse::Ok()
        .content_type(media_content_type(&normalized))
        .body(bytes))
}

/// Upload an image into the media directory. Body: raw bytes.
#[post("/projects/{id}/media")]
pub async fn upload_media(
    state: Ctx,
    path: web::Path<String>,
    query: web::Query<AssetQuery>,
    body: web::Bytes,
) -> ScmResult<HttpResponse> {
    let p = get_project(&state, path.into_inner())?;
    if body.is_empty() {
        return Err(ScmError::config("Empty upload — no file data received"));
    }
    if body.len() > MAX_MEDIA_BYTES {
        return Err(ScmError::config("File too large (max 20 MB)"));
    }
    let Some(name) = sanitize_media_filename(&query.filename) else {
        return Err(ScmError::config(
            "Invalid filename — allowed extensions: png, jpg, jpeg, gif, webp, svg, avif, ico, bmp",
        ));
    };
    let dir = media_dir_for(&state, &p).await?;

    let final_name = {
        let dir = dir.clone();
        tokio::task::spawn_blocking(move || -> ScmResult<String> {
            std::fs::create_dir_all(&dir)
                .map_err(|e| ScmError::filesystem("Could not create the media directory").with_detail(e.to_string()))?;
            let mut candidate = name.clone();
            let mut n = 2;
            while dir.join(&candidate).exists() {
                let (stem, ext) = candidate.rsplit_once('.').unwrap_or((&candidate, ""));
                candidate = format!("{stem}-{n}.{ext}");
                n += 1;
            }
            Ok(candidate)
        })
        .await
        .map_err(|e| ScmError::internal("Media upload task panicked").with_detail(e.to_string()))??
    };

    let file_path = dir.join(&final_name);
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
        write().map_err(|e| ScmError::filesystem("Could not write the uploaded file").with_detail(e.to_string()))
    })
    .await
    .map_err(|e| ScmError::internal("Media upload task panicked").with_detail(e.to_string()))??;

    let url = media_site_url(&p.media_dir, &final_name);
    log::info!("Media uploaded: {} ({} bytes)", url, body.len());
    Ok(HttpResponse::Created().json(json!({ "url": url, "file": final_name })))
}

/// Delete a media file.
#[delete("/projects/{id}/media/{name}")]
pub async fn delete_media(state: Ctx, path: web::Path<(String, String)>) -> ScmResult<HttpResponse> {
    let (id, name) = path.into_inner();
    let p = get_project(&state, id)?;
    let Some(normalized) = sanitize_media_filename(&name) else {
        return Err(ScmError::config("Invalid media filename"));
    };
    let dir = media_dir_for(&state, &p).await?;
    let file = dir.join(&normalized);
    let normalized2 = normalized.clone();
    tokio::task::spawn_blocking(move || -> ScmResult<()> {
        std::fs::remove_file(&file).map_err(|e| match e.kind() {
            std::io::ErrorKind::NotFound => ScmError::not_found(format!("Media file '{normalized2}' not found")),
            _ => ScmError::filesystem("Could not delete media file").with_detail(e.to_string()),
        })
    })
    .await
    .map_err(|e| ScmError::internal("Media delete task panicked").with_detail(e.to_string()))??;
    Ok(HttpResponse::Ok().json(json!({ "deleted": normalized })))
}

/// Rename a media file. Rejects renaming onto an existing name (409).
#[post("/projects/{id}/media/{name}/rename")]
pub async fn rename_media(
    state: Ctx,
    path: web::Path<(String, String)>,
    body: web::Bytes,
) -> ScmResult<HttpResponse> {
    let (id, old) = path.into_inner();
    let p = get_project(&state, id)?;
    let Some(old) = sanitize_media_filename(&old) else {
        return Err(ScmError::config("Invalid media filename"));
    };
    let parsed = json_body(&body)?;
    let new_name = parsed
        .get("name")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ScmError::config("Rename payload must contain { name }"))?;
    let Some(new_name) = sanitize_media_filename(new_name) else {
        return Err(ScmError::config("Invalid new media filename"));
    };
    if new_name == old {
        return Ok(HttpResponse::Ok().json(json!({ "renamed": old, "url": media_site_url(&p.media_dir, &old) })));
    }

    let dir = media_dir_for(&state, &p).await?;
    let from = dir.join(&old);
    let to = dir.join(&new_name);
    let new_in_task = new_name.clone();
    tokio::task::spawn_blocking(move || -> ScmResult<()> {
        if to.exists() {
            return Err(ScmError::config(format!("'{new_in_task}' already exists")).with_status_conflict());
        }
        std::fs::rename(&from, &to).map_err(|e| match e.kind() {
            std::io::ErrorKind::NotFound => ScmError::not_found(format!("Media file '{old}' not found")),
            _ => ScmError::filesystem("Could not rename media file").with_detail(e.to_string()),
        })
    })
    .await
    .map_err(|e| ScmError::internal("Media rename task panicked").with_detail(e.to_string()))??;

    let url = media_site_url(&p.media_dir, &new_name);
    Ok(HttpResponse::Ok().json(json!({ "renamed": new_name, "url": url })))
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

    // Stage the content directory plus media folders when present
    // (uploads live in <checkout>/<media_dir>; public/images is the legacy
    // location kept for backwards compatibility).
    let mut pathspecs = vec![p.content_dir.clone()];
    let media_norm = p.media_dir.trim_start_matches("./").trim_end_matches('/').to_string();
    if !media_norm.is_empty() && dest.join(&media_norm).is_dir() {
        pathspecs.push(media_norm);
    }
    let legacy_assets = "public/images";
    if dest.join(legacy_assets).is_dir() {
        pathspecs.push(legacy_assets.to_string());
    }
    // Include pages directory when present
    if dest.join("pages").is_dir() {
        pathspecs.push("pages".to_string());
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
