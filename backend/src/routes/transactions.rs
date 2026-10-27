use axum::{
    extract::{Path, Query, State},
    response::IntoResponse,
    Json,
};
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    error::AppError,
    models::transaction::{
        CreateTransactionRequest, PaginatedTransactions, Transaction, TransactionFilterParams,
        UpdateTransactionRequest,
    },
    routes::auth::AppState,
};

// Validation helpers
fn validate_transaction_fields(
    amount: i64,
    tx_type: &str,
    category: &str,
    description: &str,
    date: &str,
) -> Result<(), AppError> {
    if amount <= 0 {
        return Err(AppError::BadRequest(
            "Nominal transaksi harus berupa angka positif lebih dari 0".to_string(),
        ));
    }

    if tx_type != "income" && tx_type != "expense" {
        return Err(AppError::BadRequest(
            "Jenis transaksi harus 'income' atau 'expense'".to_string(),
        ));
    }

    if category.trim().is_empty() {
        return Err(AppError::BadRequest(
            "Kategori transaksi wajib dipilih".to_string(),
        ));
    }

    if description.trim().is_empty() {
        return Err(AppError::BadRequest(
            "Deskripsi transaksi tidak boleh kosong".to_string(),
        ));
    }

    if date.trim().len() != 10 {
        return Err(AppError::BadRequest(
            "Format tanggal transaksi tidak valid, gunakan format YYYY-MM-DD".to_string(),
        ));
    }

    Ok(())
}

pub async fn get_transactions(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(params): Query<TransactionFilterParams>,
) -> Result<impl IntoResponse, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let limit = params.limit.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * limit;

    let mut query_builder = sqlx::QueryBuilder::new(
        "SELECT * FROM transactions WHERE user_id = ",
    );
    query_builder.push_bind(&auth.user_id);

    let mut count_builder = sqlx::QueryBuilder::new(
        "SELECT COUNT(*) FROM transactions WHERE user_id = ",
    );
    count_builder.push_bind(&auth.user_id);

    if let Some(ref t) = params.r#type {
        if t != "all" && !t.is_empty() {
            query_builder.push(" AND type = ");
            query_builder.push_bind(t);
            count_builder.push(" AND type = ");
            count_builder.push_bind(t);
        }
    }

    if let Some(ref cat) = params.category {
        if !cat.is_empty() {
            query_builder.push(" AND category = ");
            query_builder.push_bind(cat);
            count_builder.push(" AND category = ");
            count_builder.push_bind(cat);
        }
    }

    if let Some(ref start) = params.start_date {
        if !start.is_empty() {
            query_builder.push(" AND date >= ");
            query_builder.push_bind(start);
            count_builder.push(" AND date >= ");
            count_builder.push_bind(start);
        }
    }

    if let Some(ref end) = params.end_date {
        if !end.is_empty() {
            query_builder.push(" AND date <= ");
            query_builder.push_bind(end);
            count_builder.push(" AND date <= ");
            count_builder.push_bind(end);
        }
    }

    let search_pattern = params.search.as_ref().map(|s| format!("%{}%", s.trim()));
    if let Some(ref pattern) = search_pattern {
        query_builder.push(" AND (description LIKE ");
        query_builder.push_bind(pattern);
        query_builder.push(" OR notes LIKE ");
        query_builder.push_bind(pattern);
        query_builder.push(")");

        count_builder.push(" AND (description LIKE ");
        count_builder.push_bind(pattern);
        count_builder.push(" OR notes LIKE ");
        count_builder.push_bind(pattern);
        count_builder.push(")");
    }

    // Sorting
    let sort_col = match params.sort_by.as_deref() {
        Some("amount") => "amount",
        _ => "date",
    };
    let sort_dir = match params.sort_order.as_deref() {
        Some("asc") => "ASC",
        _ => "DESC",
    };

    query_builder.push(format!(" ORDER BY {} {}, created_at DESC", sort_col, sort_dir));
    query_builder.push(" LIMIT ");
    query_builder.push_bind(limit);
    query_builder.push(" OFFSET ");
    query_builder.push_bind(offset);

    let total: (i64,) = count_builder
        .build_query_as()
        .fetch_one(&state.pool)
        .await?;

    let transactions: Vec<Transaction> = query_builder
        .build_query_as()
        .fetch_all(&state.pool)
        .await?;

    let total_pages = if total.0 == 0 {
        1
    } else {
        (total.0 + limit - 1) / limit
    };

    Ok(Json(PaginatedTransactions {
        data: transactions,
        total: total.0,
        page,
        limit,
        total_pages,
    }))
}

pub async fn get_transaction_by_id(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let tx = sqlx::query_as::<_, Transaction>(
        "SELECT * FROM transactions WHERE id = ? AND user_id = ?",
    )
    .bind(&id)
    .bind(&auth.user_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Transaksi tidak ditemukan atau Anda tidak memiliki akses".to_string()))?;

    Ok(Json(tx))
}

pub async fn create_transaction(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(payload): Json<CreateTransactionRequest>,
) -> Result<impl IntoResponse, AppError> {
    validate_transaction_fields(
        payload.amount,
        &payload.r#type,
        &payload.category,
        &payload.description,
        &payload.date,
    )?;

    let id = Uuid::new_v4().to_string();

    let tx = sqlx::query_as::<_, Transaction>(
        r#"
        INSERT INTO transactions (id, user_id, amount, type, category, description, date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
        "#,
    )
    .bind(&id)
    .bind(&auth.user_id)
    .bind(payload.amount)
    .bind(&payload.r#type)
    .bind(payload.category.trim())
    .bind(payload.description.trim())
    .bind(&payload.date)
    .bind(payload.notes.as_deref().map(|n| n.trim()))
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(tx))
}

pub async fn update_transaction(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
    Json(payload): Json<UpdateTransactionRequest>,
) -> Result<impl IntoResponse, AppError> {
    validate_transaction_fields(
        payload.amount,
        &payload.r#type,
        &payload.category,
        &payload.description,
        &payload.date,
    )?;

    // Check transaction exists and belongs to auth user
    let existing = sqlx::query_as::<_, Transaction>(
        "SELECT * FROM transactions WHERE id = ? AND user_id = ?",
    )
    .bind(&id)
    .bind(&auth.user_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Transaksi tidak ditemukan atau bukan milik Anda".to_string()))?;

    let updated = sqlx::query_as::<_, Transaction>(
        r#"
        UPDATE transactions
        SET amount = ?, type = ?, category = ?, description = ?, date = ?, notes = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
        RETURNING *
        "#,
    )
    .bind(payload.amount)
    .bind(&payload.r#type)
    .bind(payload.category.trim())
    .bind(payload.description.trim())
    .bind(&payload.date)
    .bind(payload.notes.as_deref().map(|n| n.trim()))
    .bind(&existing.id)
    .bind(&auth.user_id)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(updated))
}

pub async fn delete_transaction(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let result = sqlx::query(
        "DELETE FROM transactions WHERE id = ? AND user_id = ?",
    )
    .bind(&id)
    .bind(&auth.user_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(
            "Transaksi tidak ditemukan atau sudah dihapus".to_string(),
        ));
    }

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Transaksi berhasil dihapus"
    })))
}
