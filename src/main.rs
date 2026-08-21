use std::env;

use actix_files::Files;
use actix_web::{middleware::Logger, App, HttpServer};
use dotenv::dotenv;

// local modules
mod http;

use http::routes::{index, project};

#[tokio::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env::set_var("RUST_LOG", "info");
    env_logger::init();

    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("{}:{}", host, port);

    HttpServer::new(move || {
        App::new()
            .service(Files::new("/web", "./web"))
            .service(index)
            .service(project)
            .wrap(Logger::default())
    })
    .bind(addr)?
    .run()
    .await
}
