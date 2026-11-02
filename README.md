# Duitin - Pelacak Keuangan Pribadi (Full-Stack Rust + React)

**Duitin** adalah aplikasi pencatat keuangan pribadi (*personal finance tracker*) berbasis web full-stack yang dirancang khusus untuk mahasiswa, *freelancer*, dan individu pemula yang membutuhkan cara praktis dan terstruktur untuk mengelola arus kas harian, memahami kebiasaan belanja, serta memantau kesehatan finansial bulanan dalam mata uang **Rupiah (IDR)**.

---

## 1. Arsitektur & Teknologi

### Frontend
- **Framework**: React 19 + TypeScript (strict mode dengan `verbatimModuleSyntax`)
- **Build Tool**: Vite
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Styling**: Vanilla CSS Design System (Clean SaaS, Plus Jakarta Sans, Dark Navy/Charcoal, Emerald Green, Coral/Rose)
- **Visual Analytics**: SVG Chart engine untuk perbandingan arus kas (*Cashflow comparison*) dan *meter progress bars* untuk breakdown kategori

### Backend
- **Bahasa**: Rust (edisi 2021)
- **HTTP Routing**: Axum 0.7
- **Async Runtime**: Tokio
- **Database & Query**: SQLx 0.8 dengan SQLite & Migrasi SQL otomatis
- **Otentikasi**:
  - Hashing kata sandi: **Argon2** (Salt acak kriptografis, tidak menyimpan teks polos)
  - Token sesi: **JWT (JSON Web Token)** dengan masa berlaku 7 hari
- **Integritas Nilai Uang**: Jumlah uang disimpan sebagai nilai integer Rupiah (`i64`) untuk mencegah kesalahan pembulatan *floating-point*
- **Isolasi Data**: Setiap permintaan transaksi dan ringkasan dibatasi ketat berdasarkan `user_id` pemilik akun

---

## 2. Struktur Proyek

```
Rustreact_santricode/
├── backend/
│   ├── Cargo.toml               # Dependensi Rust (axum, tokio, sqlx, argon2, jwt, dll.)
│   ├── .env                     # Konfigurasi runtime lokal
│   ├── migrations/              # Berkas migrasi skema SQLite
│   │   └── 0001_init.sql        # Skema tabel users, transactions, index & constraint
│   ├── src/
│   │   ├── main.rs              # Entry point aplikasi Axum, CORS, tracing
│   │   ├── config.rs            # Parser konfigurasi environment
│   │   ├── db.rs                # Inisialisasi pool SQLite & eksekutor migrasi
│   │   ├── error.rs             # Penanganan error terstruktur (AppError)
│   │   ├── auth.rs              # Argon2 password hash & Axum AuthUser extractor
│   │   ├── models/              # Struktur data request/response
│   │   │   ├── mod.rs
│   │   │   ├── user.rs
│   │   │   ├── transaction.rs
│   │   │   └── summary.rs
│   │   └── routes/              # Handler endpoint REST API
│   │       ├── mod.rs           # Komposisi router /api/v1
│   │       ├── health.rs        # GET /api/v1/health
│   │       ├── auth.rs          # /register, /login, /me
│   │       ├── transactions.rs  # CRUD transaksi dengan filter & paginasi
│   │       └── summary.rs       # Kalkulasi ringkasan & komparasi bulanan
│   └── tests/
│       └── api_tests.rs         # Test suite integrasi dan database
├── frontend/
│   ├── package.json             # Dependensi frontend
│   ├── vite.config.ts           # Konfigurasi Vite & proxy backend (/api -> 8080)
│   ├── tsconfig.json            # Konfigurasi TypeScript strict
│   ├── index.html               # Entry HTML dengan metadata SEO Indonesia
│   └── src/
│       ├── main.tsx             # Entry point React
│       ├── App.tsx              # Routing utama & proteksi sesi
│       ├── index.css            # Design system & CSS tokens
│       ├── types/index.ts       # Definisi tipe TypeScript
│       ├── api/client.ts        # Klien HTTP terpadu dengan token handler
│       ├── utils/format.ts      # Pemformat mata uang IDR & tanggal Indonesia
│       ├── components/          # Komponen UI modular
│       │   ├── Sidebar.tsx
│       │   ├── StatsCard.tsx
│       │   ├── TransactionModal.tsx
│       │   ├── DeleteConfirmModal.tsx
│       │   ├── Charts.tsx
│       │   └── EmptyState.tsx
│       └── pages/               # Tampilan halaman
│           ├── LoginPage.tsx
│           ├── RegisterPage.tsx
│           ├── DashboardPage.tsx
│           ├── TransactionsPage.tsx
│           └── SummaryPage.tsx
├── .env.example                 # Template variabel lingkungan
├── .gitignore                   # Aturan pengabaian git (target, node_modules, .db, dll.)
└── README.md                    # Dokumentasi lengkap proyek
```

---

## 3. Prasyarat Sistem

1. **Rust & Cargo**: v1.75+ (Teruji pada `rustc 1.99.1`)
2. **MinGW GCC / MSVC**: Diperlukan linker C untuk kompilasi Rust SQLite
3. **Node.js**: v18+ (Teruji pada `v24.19.0`) & **npm**: v9+ (Teruji pada `11.17.0`)

---

## 4. Cara Menjalankan Aplikasi

### Langkah A: Menjalankan Backend Rust
1. Masuk ke direktori `backend/`:
   ```bash
   cd backend
   ```
2. Pastikan file `.env` tersedia (dapat menyalin dari `.env.example`):
   ```bash
   cp ../.env.example .env
   ```
3. Jalankan server Axum:
   ```bash
   cargo run
   ```
   *Server akan otomatis membuat file database SQLite `duitin.db`, mengeksekusi migrasi, dan mendengarkan pada `http://127.0.0.1:8080`.*

### Langkah B: Menjalankan Frontend React
1. Buka terminal baru dan masuk ke direktori `frontend/`:
   ```bash
   cd frontend
   ```
2. Instal dependensi (jika belum):
   ```bash
   npm install
   ```
3. Jalankan server pengembang:
   ```bash
   npm run dev
   ```
4. Buka peramban pada **`http://localhost:5173`**.

---

## 5. Fitur Utama yang Telah Diimplementasikan

### A. Otentikasi Aman & Isolasi Pengguna
- Registrasi akun baru dengan validasi format email dan panjang kata sandi minimal 6 karakter.
- Enkripsi kata sandi menggunakan **Argon2** ber-salt (tanpa teks polos).
- Pembuatan dan verifikasi token **JWT** di setiap permintaan endpoint transaksi.
- Tombol **Masuk Instan (Akun Demo)** untuk langsung mengeksplorasi aplikasi dalam 1 kali klik.
- Isolasi kepemilikan data: Pengguna tidak dapat melihat, mengubah, atau menghapus transaksi milik pengguna lain.

### B. Dashboard Finansial Pintar
- Kartu metrik utama: **Total Pemasukan**, **Total Pengeluaran**, dan **Sisa Saldo**.
- Badge perbandingan pengeluaran terhadap bulan sebelumnya (`-25.0%`, dsb.) hanya jika data perbandingan bermakna ada.
- Grafik perbandingan arus kas (*Cashflow bar chart*) dan aktivitas harian.
- Distribusi pengeluaran per kategori dengan indikator warna dan *progress meter*.
- Pratinjau 5 transaksi terkini lengkap dengan aksi Ubah dan Hapus.
- *Month selector* untuk menjelajahi catatan bulan lalu atau bulan depan.
- *Empty state* yang ramah jika belum ada data pada bulan yang dipilih.

### C. Manajemen Transaksi Komprehensif
- Pencatatan pemasukan dan pengeluaran dengan validasi nominal positif > 0.
- Kategori default Indonesia:
  - **Pemasukan**: Uang saku, Gaji, Freelance, Bisnis, Lainnya.
  - **Pengeluaran**: Makanan, Transportasi, Pendidikan, Kebutuhan harian, Hiburan, Tabungan, Lainnya.
- Dukungan pencarian *real-time* berdasarkan deskripsi dan catatan transaksi.
- Filter berdasarkan jenis (Semua / Pemasukan / Pengeluaran), kategori, serta rentang tanggal awal dan akhir.
- Pengurutan berdasarkan tanggal (terbaru/terlama) atau nominal (terbesar/terkecil).
- Paginasi rapi dengan batas per halaman yang dapat disesuaikan.
- Modal konfirmasi sebelum tindakan destruktif (penghapusan).

### D. Laporan Finansial Bulanan
- Ringkasan komprehensif pemasukan, pengeluaran, dan tabungan bersih.
- Indikator kesehatan finansial (*Surplus Kas* vs *Defisit Anggaran*).
- Kalkulasi rasio penghematan (*Savings Rate %*).
- Tabel rincian alokasi per kategori beserta persentase kontribusi terhadap total pengeluaran.
- Rekap arus kas harian (*Daily Cashflow net balance*).

---

## 6. Verifikasi & Pengujian yang Telah Dilakukan

1. **Backend Cargo Check & Build**:
   - `cargo check`: Sukses tanpa error maupun warning.
2. **Backend Unit & Integration Tests**:
   - `cargo test`: 4 pengujian integrasi database lulus (`test result: ok. 4 passed; 0 failed`).
   - Meliputi: migrasi skema tabel, validasi check constraint nominal positif, isolasi kepemilikan transaksi antar-pengguna, dan akurasi kalkulasi ringkasan bulanan.
3. **Frontend Production Build**:
   - `tsc -b && vite build`: Lulus 100% tanpa error TypeScript strict.
4. **End-to-End REST API Testing**:
   - Eksekusi skrip integrasi `test_api.ps1`:
     - Health Check `GET /api/v1/health` -> OK
     - Registrasi Pengguna `POST /api/v1/auth/register` -> Token JWT terbit
     - Summary `GET /api/v1/summary?month=2026-10` -> Pemasukan Rp 3.350.000, Pengeluaran Rp 1.275.000, Sisa Rp 2.075.000
     - Buat Transaksi `POST /api/v1/transactions` -> Sukses
     - Cari Transaksi `GET /api/v1/transactions?search=Sate` -> 1 item ditemukan
     - Update Transaksi `PUT /api/v1/transactions/:id` -> Nominal terbarui
     - Hapus Transaksi `DELETE /api/v1/transactions/:id` -> Terhapus dengan status 200 OK
