use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CategorySummary {
    pub category: String,
    pub r#type: String,
    pub total: i64,
    pub percentage: i64,
    pub count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DailySummary {
    pub date: String,
    pub income: i64,
    pub expense: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MonthlySummary {
    pub month: String,
    pub total_income: i64,
    pub total_expense: i64,
    pub net_balance: i64,
    pub previous_month_expense: Option<i64>,
    pub expense_change_pct: Option<f64>,
    pub by_category: Vec<CategorySummary>,
    pub daily_totals: Vec<DailySummary>,
    pub transaction_count: i64,
}
