use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
    pub frontend_origin: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "sqlite://duitin.db?mode=rwc".to_string());
        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "duitin-super-secret-jwt-key-minimum-32-chars-long".to_string());
        let port = env::var("PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(8080);
        let frontend_origin = env::var("FRONTEND_ORIGIN")
            .unwrap_or_else(|_| "http://localhost:5173".to_string());

        Self {
            database_url,
            jwt_secret,
            port,
            frontend_origin,
        }
    }
}
