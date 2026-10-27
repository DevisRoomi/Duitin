use sqlx::sqlite::SqlitePoolOptions;
use uuid::Uuid;

// Test models mirroring the database
#[derive(Debug, sqlx::FromRow, PartialEq, Eq)]
struct TestUser {
    id: String,
    name: String,
    email: String,
    password_hash: String,
}

#[derive(Debug, sqlx::FromRow, PartialEq, Eq)]
struct TestTransaction {
    id: String,
    user_id: String,
    amount: i64,
    r#type: String,
    category: String,
    description: String,
    date: String,
}

async fn setup_test_db() -> sqlx::Pool<sqlx::Sqlite> {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("Failed to connect to in-memory test database");

    sqlx::query("PRAGMA foreign_keys = ON;")
        .execute(&pool)
        .await
        .unwrap();

    // Run schema
    sqlx::query(
        r#"
        CREATE TABLE users (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE transactions (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            amount INTEGER NOT NULL CHECK (amount > 0),
            type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        "#,
    )
    .execute(&pool)
    .await
    .expect("Failed to run schema in test database");

    pool
}

#[tokio::test]
async fn test_database_migrations_and_user_creation() {
    let pool = setup_test_db().await;
    let user_id = Uuid::new_v4().to_string();

    let user = sqlx::query_as::<_, TestUser>(
        "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?) RETURNING *",
    )
    .bind(&user_id)
    .bind("Santri Test")
    .bind("test@duitin.app")
    .bind("hashed_secret_argon2")
    .fetch_one(&pool)
    .await
    .expect("Failed to insert user");

    assert_eq!(user.name, "Santri Test");
    assert_eq!(user.email, "test@duitin.app");

    // Test unique constraint on email
    let duplicate_res = sqlx::query(
        "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind("Duplicate User")
    .bind("test@duitin.app")
    .bind("hash")
    .execute(&pool)
    .await;

    assert!(duplicate_res.is_err(), "Duplicate email must be rejected");
}

#[tokio::test]
async fn test_transaction_crud_and_amount_check_constraint() {
    let pool = setup_test_db().await;
    let user_id = Uuid::new_v4().to_string();

    sqlx::query("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)")
        .bind(&user_id)
        .bind("User One")
        .bind("user1@duitin.app")
        .bind("hash1")
        .execute(&pool)
        .await
        .unwrap();

    // 1. Create valid transaction
    let tx_id = Uuid::new_v4().to_string();
    let tx = sqlx::query_as::<_, TestTransaction>(
        r#"
        INSERT INTO transactions (id, user_id, amount, type, category, description, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
        "#,
    )
    .bind(&tx_id)
    .bind(&user_id)
    .bind(75000)
    .bind("expense")
    .bind("Makanan")
    .bind("Makan siang prasmanan")
    .bind("2026-10-27")
    .fetch_one(&pool)
    .await
    .expect("Valid transaction should succeed");

    assert_eq!(tx.amount, 75000);
    assert_eq!(tx.r#type, "expense");

    // 2. Reject non-positive amounts (amount <= 0)
    let bad_tx = sqlx::query(
        "INSERT INTO transactions (id, user_id, amount, type, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(-5000)
    .bind("expense")
    .bind("Makanan")
    .bind("Negatif")
    .bind("2026-10-27")
    .execute(&pool)
    .await;

    assert!(bad_tx.is_err(), "Negative amounts must violate CHECK constraint");

    // 3. Reject invalid type
    let bad_type = sqlx::query(
        "INSERT INTO transactions (id, user_id, amount, type, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(50000)
    .bind("invalid_type")
    .bind("Makanan")
    .bind("Type error")
    .bind("2026-10-27")
    .execute(&pool)
    .await;

    assert!(bad_type.is_err(), "Invalid transaction type must be rejected");

    // 4. Update transaction
    let updated = sqlx::query_as::<_, TestTransaction>(
        "UPDATE transactions SET amount = 85000, description = 'Makan siang plus jus' WHERE id = ? RETURNING *",
    )
    .bind(&tx_id)
    .fetch_one(&pool)
    .await
    .unwrap();

    assert_eq!(updated.amount, 85000);
    assert_eq!(updated.description, "Makan siang plus jus");

    // 5. Delete transaction
    let del_res = sqlx::query("DELETE FROM transactions WHERE id = ?")
        .bind(&tx_id)
        .execute(&pool)
        .await
        .unwrap();

    assert_eq!(del_res.rows_affected(), 1);
}

#[tokio::test]
async fn test_user_ownership_isolation() {
    let pool = setup_test_db().await;
    let user_a = Uuid::new_v4().to_string();
    let user_b = Uuid::new_v4().to_string();

    sqlx::query("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)")
        .bind(&user_a)
        .bind("User A")
        .bind("usera@duitin.app")
        .bind("hash_a")
        .execute(&pool)
        .await
        .unwrap();

    sqlx::query("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)")
        .bind(&user_b)
        .bind("User B")
        .bind("userb@duitin.app")
        .bind("hash_b")
        .execute(&pool)
        .await
        .unwrap();

    // Create transaction for User A
    let tx_a_id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO transactions (id, user_id, amount, type, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&tx_a_id)
    .bind(&user_a)
    .bind(150000)
    .bind("expense")
    .bind("Pendidikan")
    .bind("Buku A")
    .bind("2026-10-27")
    .execute(&pool)
    .await
    .unwrap();

    // User B tries to query User A's transaction
    let user_b_view = sqlx::query_as::<_, TestTransaction>(
        "SELECT * FROM transactions WHERE id = ? AND user_id = ?",
    )
    .bind(&tx_a_id)
    .bind(&user_b)
    .fetch_optional(&pool)
    .await
    .unwrap();

    assert!(user_b_view.is_none(), "User B must not see User A's transaction");

    // User B tries to delete User A's transaction
    let delete_attempt = sqlx::query("DELETE FROM transactions WHERE id = ? AND user_id = ?")
        .bind(&tx_a_id)
        .bind(&user_b)
        .execute(&pool)
        .await
        .unwrap();

    assert_eq!(delete_attempt.rows_affected(), 0, "User B must not delete User A's transaction");
}

#[tokio::test]
async fn test_monthly_summary_calculation() {
    let pool = setup_test_db().await;
    let user_id = Uuid::new_v4().to_string();

    sqlx::query("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)")
        .bind(&user_id)
        .bind("Student User")
        .bind("student@duitin.app")
        .bind("hash")
        .execute(&pool)
        .await
        .unwrap();

    // Insert 2 incomes (Rp 1.500.000 + Rp 500.000) and 2 expenses (Rp 100.000 + Rp 50.000)
    sqlx::query(
        "INSERT INTO transactions (id, user_id, amount, type, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(1500000)
    .bind("income")
    .bind("Uang saku")
    .bind("Uang saku bulanan")
    .bind("2026-10-01")
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO transactions (id, user_id, amount, type, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(500000)
    .bind("income")
    .bind("Freelance")
    .bind("Desain banner")
    .bind("2026-10-10")
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO transactions (id, user_id, amount, type, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(100000)
    .bind("expense")
    .bind("Makanan")
    .bind("Belanja makan")
    .bind("2026-10-15")
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query(
        "INSERT INTO transactions (id, user_id, amount, type, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(50000)
    .bind("expense")
    .bind("Transportasi")
    .bind("Ongkos bensin")
    .bind("2026-10-20")
    .execute(&pool)
    .await
    .unwrap();

    // Query aggregated sums
    let income_row: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND type = 'income' AND date >= '2026-10-01' AND date <= '2026-10-31'",
    )
    .bind(&user_id)
    .fetch_one(&pool)
    .await
    .unwrap();

    let expense_row: (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND type = 'expense' AND date >= '2026-10-01' AND date <= '2026-10-31'",
    )
    .bind(&user_id)
    .fetch_one(&pool)
    .await
    .unwrap();

    let total_income = income_row.0;
    let total_expense = expense_row.0;
    let net_balance = total_income - total_expense;

    assert_eq!(total_income, 2000000, "Total income must equal Rp 2.000.000");
    assert_eq!(total_expense, 150000, "Total expense must equal Rp 150.000");
    assert_eq!(net_balance, 1850000, "Net balance must equal Rp 1.850.000");
}
