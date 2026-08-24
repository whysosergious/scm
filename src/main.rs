use actix_web::{middleware::Logger, web, App, HttpServer};
use dotenv::dotenv;
use std::env;

mod config;
mod content;
mod error;
mod git;
mod http;
mod paths;
mod project;
mod setup;

use http::routes;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env::set_var("RUST_LOG", "info");
    env_logger::init();

    // Bootstrap: load + validate scm-config.json (spec §6 steps 1–3).
    let state = match setup::init() {
        Ok(state) => state,
        Err(e) => {
            eprintln!("SCM cannot start: {e}");
            std::process::exit(1);
        }
    };

    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("{}:{}", host, port);

    log::info!("SCM control panel on http://{addr}/");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(state.clone()))
            .configure(routes::configure)
            .wrap(Logger::default())
    })
    .bind(addr)?
    .run()
    .await
}
