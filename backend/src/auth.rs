use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand_core::OsRng;
use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{header, request::Parts},
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};

use crate::{
    error::AppError,
    models::user::Claims,
};

// Argon2 password hashing
pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|e| AppError::Internal(format!("Gagal mengenkripsi kata sandi: {}", e)))
}

pub fn verify_password(password: &str, password_hash: &str) -> Result<bool, AppError> {
    let parsed_hash = PasswordHash::new(password_hash)
        .map_err(|_| AppError::Internal("Format hash kata sandi tidak valid".to_string()))?;

    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

// JWT Token Generation
pub fn generate_token(user_id: &str, email: &str, secret: &str) -> Result<String, AppError> {
    let expiration = Utc::now()
        .checked_add_signed(Duration::days(7))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        exp: expiration,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("Gagal membuat token otentikasi: {}", e)))
}

// JWT Token Verification
pub fn verify_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized("Sesi login Anda tidak valid atau telah berakhir".to_string()))
}

// Authenticated User Extractor for Axum handlers
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: String,
    #[allow(dead_code)]
    pub email: String,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|val| val.to_str().ok());

        let auth_header = match auth_header {
            Some(h) => h,
            None => {
                return Err(AppError::Unauthorized(
                    "Token otentikasi tidak ditemukan. Silakan login terlebih dahulu.".to_string(),
                ))
            }
        };

        if !auth_header.starts_with("Bearer ") {
            return Err(AppError::Unauthorized(
                "Format token otentikasi harus diawali dengan Bearer".to_string(),
            ));
        }

        let token = &auth_header[7..];

        // Retrieve JWT secret from environment or fallback
        let secret = std::env::var("JWT_SECRET")
            .unwrap_or_else(|_| "duitin-super-secret-jwt-key-minimum-32-chars-long".to_string());

        let claims = verify_token(token, &secret)?;

        Ok(AuthUser {
            user_id: claims.sub,
            email: claims.email,
        })
    }
}
