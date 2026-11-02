pub mod auth;
pub mod health;
pub mod summary;
pub mod transactions;

use axum::{
    routing::{delete, get, post, put},
    Router,
};
use auth::AppState;

pub fn create_api_router(state: AppState) -> Router {
    Router::new()
        // Health
        .route("/health", get(health::health_check))
        // Authentication
        .route("/auth/register", post(auth::register))
        .route("/auth/login", post(auth::login))
        .route("/auth/me", get(auth::get_me))
        // Transactions CRUD
        .route("/transactions", get(transactions::get_transactions))
        .route("/transactions", post(transactions::create_transaction))
        .route("/transactions/:id", get(transactions::get_transaction_by_id))
        .route("/transactions/:id", put(transactions::update_transaction))
        .route("/transactions/:id", delete(transactions::delete_transaction))
        // Monthly Summary & Reports
        .route("/summary", get(summary::get_summary))
        .with_state(state)
}
