use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Transaction {
    pub id: String,
    pub user_id: String,
    pub amount: i64, // integer in Rupiah
    pub r#type: String, // 'income' | 'expense'
    pub category: String,
    pub description: String,
    pub date: String, // YYYY-MM-DD
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionRequest {
    pub amount: i64,
    pub r#type: String,
    pub category: String,
    pub description: String,
    pub date: String,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTransactionRequest {
    pub amount: i64,
    pub r#type: String,
    pub category: String,
    pub description: String,
    pub date: String,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct TransactionFilterParams {
    pub r#type: Option<String>,
    pub category: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct PaginatedTransactions {
    pub data: Vec<Transaction>,
    pub total: i64,
    pub page: i64,
    pub limit: i64,
    pub total_pages: i64,
}
