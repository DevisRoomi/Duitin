mod auth;
mod config;
mod db;
mod error;
mod models;
mod routes;

use axum::{
    http::{header, HeaderValue, Method},
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::{
    config::Config,
    db::init_db,
    routes::{auth::AppState, create_api_router},
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "duitin_backend=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting Duitin Personal Finance Tracker Backend...");

    // Load configuration
    let config = Config::from_env();
    tracing::info!("Port configured: {}", config.port);

    // Initialize database and apply migrations
    let pool = init_db(&config.database_url).await?;

    let state = AppState {
        pool,
        config: config.clone(),
    };

    // Configure CORS for local development
    let cors = CorsLayer::new()
        .allow_origin([
            "http://localhost:5173".parse::<HeaderValue>()?,
            "http://127.0.0.1:5173".parse::<HeaderValue>()?,
            "http://localhost:8080".parse::<HeaderValue>()?,
            "http://127.0.0.1:8080".parse::<HeaderValue>()?,
            "http://duitin.test".parse::<HeaderValue>()?,
            "https://duitin.test".parse::<HeaderValue>()?,
            config.frontend_origin.parse::<HeaderValue>()?,
        ])
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::ACCEPT,
        ])
        .allow_credentials(true);

    // Build main application router
    let app = Router::new()
        .nest("/api/v1", create_api_router(state))
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Duitin API server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
