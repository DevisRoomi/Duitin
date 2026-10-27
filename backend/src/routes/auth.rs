use axum::{
    extract::State,
    response::IntoResponse,
    Json,
};
use uuid::Uuid;

use crate::{
    auth::{generate_token, hash_password, verify_password, AuthUser},
    config::Config,
    db::DbPool,
    error::AppError,
    models::user::{AuthResponse, LoginRequest, RegisterRequest, User, UserPublic},
};

#[derive(Clone)]
pub struct AppState {
    pub pool: DbPool,
    pub config: Config,
}

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<impl IntoResponse, AppError> {
    let name = payload.name.trim();
    let email = payload.email.trim().to_lowercase();
    let password = payload.password.trim();

    if name.is_empty() {
        return Err(AppError::BadRequest("Nama lengkap tidak boleh kosong".to_string()));
    }

    if email.is_empty() || !email.contains('@') {
        return Err(AppError::BadRequest("Format alamat email tidak valid".to_string()));
    }

    if password.len() < 6 {
        return Err(AppError::BadRequest("Kata sandi harus memiliki minimal 6 karakter".to_string()));
    }

    // Check if user already exists
    let existing = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(&email)
        .fetch_optional(&state.pool)
        .await?;

    if existing.is_some() {
        return Err(AppError::Conflict("Alamat email ini sudah terdaftar".to_string()));
    }

    // Hash password with Argon2
    let password_hash = hash_password(password)?;
    let user_id = Uuid::new_v4().to_string();

    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (id, name, email, password_hash)
        VALUES (?, ?, ?, ?)
        RETURNING *
        "#,
    )
    .bind(&user_id)
    .bind(name)
    .bind(&email)
    .bind(&password_hash)
    .fetch_one(&state.pool)
    .await?;

    // Generate JWT
    let token = generate_token(&user.id, &user.email, &state.config.jwt_secret)?;

    Ok(Json(AuthResponse {
        user: UserPublic::from(user),
        token,
    }))
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<impl IntoResponse, AppError> {
    let email = payload.email.trim().to_lowercase();
    let password = payload.password.trim();

    if email.is_empty() || password.is_empty() {
        return Err(AppError::BadRequest("Email dan kata sandi wajib diisi".to_string()));
    }

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(&email)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Email atau kata sandi tidak cocok".to_string()))?;

    // Verify password with Argon2
    let is_valid = verify_password(password, &user.password_hash)?;
    if !is_valid {
        return Err(AppError::Unauthorized("Email atau kata sandi tidak cocok".to_string()));
    }

    // Generate JWT
    let token = generate_token(&user.id, &user.email, &state.config.jwt_secret)?;

    Ok(Json(AuthResponse {
        user: UserPublic::from(user),
        token,
    }))
}

pub async fn get_me(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<impl IntoResponse, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&auth.user_id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Pengguna tidak ditemukan".to_string()))?;

    Ok(Json(serde_json::json!({
        "user": UserPublic::from(user)
    })))
}
