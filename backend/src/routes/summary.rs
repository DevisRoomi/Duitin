use axum::{
    extract::{Query, State},
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use std::collections::BTreeMap;

use crate::{
    auth::AuthUser,
    error::AppError,
    models::summary::{CategorySummary, DailySummary, MonthlySummary},
    models::transaction::Transaction,
    routes::auth::AppState,
};

#[derive(Debug, Deserialize)]
pub struct SummaryQuery {
    pub month: Option<String>, // format: YYYY-MM
}

pub async fn get_summary(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(query): Query<SummaryQuery>,
) -> Result<impl IntoResponse, AppError> {
    // Determine the target month: default to current month
    let month_str = match query.month {
        Some(m) if m.len() == 7 && m.contains('-') => m,
        _ => chrono::Utc::now().format("%Y-%m").to_string(),
    };

    let start_date = format!("{}-01", month_str);
    let end_date = format!("{}-31", month_str);

    // Fetch all transactions for this user in this month
    let transactions = sqlx::query_as::<_, Transaction>(
        r#"
        SELECT * FROM transactions
        WHERE user_id = ? AND date >= ? AND date <= ?
        ORDER BY date ASC
        "#,
    )
    .bind(&auth.user_id)
    .bind(&start_date)
    .bind(&end_date)
    .fetch_all(&state.pool)
    .await?;

    let mut total_income: i64 = 0;
    let mut total_expense: i64 = 0;
    let mut category_map: BTreeMap<(String, String), (i64, i64)> = BTreeMap::new(); // (type, category) -> (total, count)
    let mut daily_map: BTreeMap<String, (i64, i64)> = BTreeMap::new(); // date -> (income, expense)

    for tx in &transactions {
        if tx.r#type == "income" {
            total_income += tx.amount;
            let entry = daily_map.entry(tx.date.clone()).or_insert((0, 0));
            entry.0 += tx.amount;
        } else {
            total_expense += tx.amount;
            let entry = daily_map.entry(tx.date.clone()).or_insert((0, 0));
            entry.1 += tx.amount;
        }

        let cat_entry = category_map
            .entry((tx.r#type.clone(), tx.category.clone()))
            .or_insert((0, 0));
        cat_entry.0 += tx.amount;
        cat_entry.1 += 1;
    }

    let net_balance = total_income - total_expense;

    // Calculate Previous Month's Expense for meaningful comparison
    let prev_month_str = {
        let parts: Vec<&str> = month_str.split('-').collect();
        if parts.len() == 2 {
            let year: i32 = parts[0].parse().unwrap_or(2026);
            let month: u32 = parts[1].parse().unwrap_or(1);
            if month == 1 {
                format!("{}-12", year - 1)
            } else {
                format!("{}-{:02}", year, month - 1)
            }
        } else {
            "2026-09".to_string()
        }
    };

    let prev_start = format!("{}-01", prev_month_str);
    let prev_end = format!("{}-31", prev_month_str);

    let prev_expense_row: (Option<i64>,) = sqlx::query_as(
        r#"
        SELECT SUM(amount) FROM transactions
        WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?
        "#,
    )
    .bind(&auth.user_id)
    .bind(&prev_start)
    .bind(&prev_end)
    .fetch_one(&state.pool)
    .await?;

    let prev_expense = prev_expense_row.0;

    let expense_change_pct = match prev_expense {
        Some(prev) if prev > 0 => {
            let change = (total_expense as f64 - prev as f64) / (prev as f64) * 100.0;
            Some((change * 10.0).round() / 10.0)
        }
        _ => None,
    };

    // Build Category Summaries
    let mut by_category: Vec<CategorySummary> = Vec::new();
    for ((tx_type, category), (total, count)) in category_map {
        let base_total = if tx_type == "expense" {
            total_expense
        } else {
            total_income
        };
        let percentage = if base_total > 0 {
            (total * 100) / base_total
        } else {
            0
        };

        by_category.push(CategorySummary {
            category,
            r#type: tx_type,
            total,
            percentage,
            count,
        });
    }

    // Sort category summaries: expenses first (by total desc), then income
    by_category.sort_by(|a, b| {
        if a.r#type != b.r#type {
            b.r#type.cmp(&a.r#type) // 'expense' before 'income'
        } else {
            b.total.cmp(&a.total)
        }
    });

    // Build Daily Summaries
    let daily_totals: Vec<DailySummary> = daily_map
        .into_iter()
        .map(|(date, (income, expense))| DailySummary {
            date,
            income,
            expense,
        })
        .collect();

    Ok(Json(MonthlySummary {
        month: month_str,
        total_income,
        total_expense,
        net_balance,
        previous_month_expense: prev_expense,
        expense_change_pct,
        by_category,
        daily_totals,
        transaction_count: transactions.len() as i64,
    }))
}
