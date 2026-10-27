use axum::{
    extract::State,
    response::IntoResponse,
    Json,
};
use chrono::{Datelike, Utc};
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    error::AppError,
    routes::auth::AppState,
};

pub async fn seed_demo_data(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<impl IntoResponse, AppError> {
    let now = Utc::now();
    let year = now.year();
    let month = now.month();
    let cur_m = format!("{}-{:02}", year, month);

    let (prev_year, prev_month) = if month == 1 {
        (year - 1, 12)
    } else {
        (year, month - 1)
    };
    let prev_m = format!("{}-{:02}", prev_year, prev_month);

    // Realistic Indonesian sample transactions
    let demo_transactions = vec![
        // Previous month data (to test comparison percentages)
        (prev_m.clone(), "05", 2500000, "income", "Uang saku", "Kiriman uang saku bulanan dari orang tua", Some("[Demo] Transfer bulanan awal bulan")),
        (prev_m.clone(), "10", 650000, "expense", "Pendidikan", "Buku referensi praktikum dan modul", Some("[Demo] Toko Buku Kampus")),
        (prev_m.clone(), "15", 450000, "expense", "Kebutuhan harian", "Belanja bulanan sembako dan perlengkapan kos", None),
        (prev_m.clone(), "20", 350000, "expense", "Hiburan", "Nonton bioskop & makan bareng teman", None),
        (prev_m.clone(), "25", 250000, "expense", "Transportasi", "Isi ulang saldo kartu transportasi KRL & Gojek", None),

        // Current month data
        (cur_m.clone(), "01", 2500000, "income", "Uang saku", "Uang saku bulanan dari orang tua", Some("[Demo] Transfer Bank")),
        (cur_m.clone(), "04", 850000, "income", "Freelance", "Pembuatan desain landing page UMKM lokal", Some("[Demo] Project side-gig")),
        (cur_m.clone(), "05", 28000, "expense", "Makanan", "Makan siang warteg nasi komplit", None),
        (cur_m.clone(), "07", 125000, "expense", "Kebutuhan harian", "Paket data internet 50GB & pulsa", Some("[Demo] Provider digital")),
        (cur_m.clone(), "10", 35000, "expense", "Makanan", "Nasi padang rendang & es teh manis", None),
        (cur_m.clone(), "12", 45000, "expense", "Transportasi", "Ojek online pergi pulang kampus", None),
        (cur_m.clone(), "15", 350000, "expense", "Pendidikan", "Iuran praktikum laboratorium semester ini", Some("[Demo] Pembayaran akademik")),
        (cur_m.clone(), "18", 65000, "expense", "Hiburan", "Ngopi & diskusi tugas di cafe", None),
        (cur_m.clone(), "20", 500000, "expense", "Tabungan", "Setor tabungan reksa dana pasar uang", Some("[Demo] Investasi rutin")),
        (cur_m.clone(), "22", 42000, "expense", "Makanan", "Makan malam ayam geprek keju", None),
        (cur_m.clone(), "25", 85000, "expense", "Kebutuhan harian", "Sabun, deterjen, dan perlengkapan mandi kos", None),
    ];

    let mut count = 0;
    for (m_str, day_str, amount, tx_type, category, description, notes) in demo_transactions {
        let date = format!("{}-{}", m_str, day_str);
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            r#"
            INSERT INTO transactions (id, user_id, amount, type, category, description, date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&auth.user_id)
        .bind(amount)
        .bind(tx_type)
        .bind(category)
        .bind(description)
        .bind(&date)
        .bind(notes)
        .execute(&state.pool)
        .await?;

        count += 1;
    }

    Ok(Json(serde_json::json!({
        "success": true,
        "message": format!("Berhasil memuat {} transaksi contoh realistik untuk akun Anda!", count),
        "count": count
    })))
}
