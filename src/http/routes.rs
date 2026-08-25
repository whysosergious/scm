use crate::http::api;
use actix_files::Files;
use actix_web::{get, web, HttpResponse, Responder};

// ================== STATIC ROUTES ==================

#[get("/")]
async fn index() -> impl Responder {
    match tokio::fs::read_to_string("web/index.html").await {
        Ok(html) => HttpResponse::Ok().content_type("text/html").body(html),
        Err(_) => HttpResponse::InternalServerError().body("Could not load index.html"),
    }
}

/// Register every service: static control panel + JSON API.
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(Files::new("/web", "./web").index_file("index.html"))
        .service(index)
        .service(
            web::scope("/api")
                .service(api::get_config)
                .service(api::put_config)
                .service(api::list_projects)
                .service(api::import_project)
                .service(api::delete_project)
                .service(api::ensure_checkout)
                .service(api::create_content_dir)
                .service(api::list_content)
                .service(api::create_content_file)
                .service(api::get_content_file)
                .service(api::put_content_file)
                .service(api::git_status)
                .service(api::list_media)
                .service(api::serve_media)
                .service(api::upload_media)
                .service(api::rename_media)
                .service(api::delete_media)
                .service(api::publish),
        );
}
