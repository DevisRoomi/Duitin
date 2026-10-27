import { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
} from 'lucide-react';
import type { MonthlySummary } from '../types';
import { api } from '../api/client';
import {
  formatIDR,
  formatDateIndo,
  formatMonthYear,
  getCurrentMonth,
  getCategoryBadgeColor,
} from '../utils/format';
import { StatsCard } from '../components/StatsCard';

export const SummaryPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getSummary(selectedMonth);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat laporan ringkasan bulanan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    const prevYear = d.getFullYear();
    const prevMonth = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${prevYear}-${prevMonth}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    const nextYear = d.getFullYear();
    const nextMonth = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${nextYear}-${nextMonth}`);
  };

  // Savings rate
  const savingsRate =
    summary && summary.total_income > 0
      ? Math.max(0, Math.round((summary.net_balance / summary.total_income) * 100))
      : 0;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan Keuangan Bulanan</h1>
          <p className="page-subtitle">
            Evaluasi kesehatan finansial dan periksa rasio tabungan di {formatMonthYear(selectedMonth)}.
          </p>
        </div>

        {/* Month Selector Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '0.25rem 0.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <button
            onClick={handlePrevMonth}
            className="btn-icon"
            style={{ padding: '0.375rem' }}
            title="Bulan Sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0 0.5rem', minWidth: '150px', justifyContent: 'center' }}>
            <Calendar size={16} color="var(--accent-blue)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {formatMonthYear(selectedMonth)}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="btn-icon"
            style={{ padding: '0.375rem' }}
            title="Bulan Berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--expense-rose-subtle)',
            color: 'var(--expense-rose-dark)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            border: '1px solid #fecdd3',
          }}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Memuat laporan keuangan...
        </div>
      ) : summary ? (
        <>
          {/* Summary Metric Cards */}
          <div className="stats-grid">
            <StatsCard
              label="Pemasukan Masuk"
              amount={summary.total_income}
              icon={<TrendingUp size={22} />}
              iconBg="var(--income-green-subtle)"
              iconColor="var(--income-green)"
              type="income"
            />

            <StatsCard
              label="Pengeluaran Keluar"
              amount={summary.total_expense}
              icon={<TrendingDown size={22} />}
              iconBg="var(--expense-rose-subtle)"
              iconColor="var(--expense-rose)"
              changePct={summary.expense_change_pct}
              type="expense"
            />

            <StatsCard
              label="Sisa Kas / Tabungan Bersih"
              amount={summary.net_balance}
              icon={<Wallet size={22} />}
              iconBg="var(--accent-blue-subtle)"
              iconColor="var(--accent-blue)"
              type="balance"
            />
          </div>

          {/* Financial Health Banner */}
          <div
            className="card"
            style={{
              marginBottom: '2rem',
              background: summary.net_balance >= 0 ? '#f0fdf4' : '#fff1f2',
              borderColor: summary.net_balance >= 0 ? '#bbf7d0' : '#fecdd3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: summary.net_balance >= 0 ? 'var(--income-green)' : 'var(--expense-rose)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {summary.net_balance >= 0 ? <PiggyBank size={24} /> : <TrendingDown size={24} />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                  {summary.net_balance >= 0
                    ? `Surplus Kas: ${savingsRate}% dari pemasukan berhasil dihemat`
                    : 'Defisit Anggaran: Pengeluaran melebihi pemasukan bulan ini'}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {summary.net_balance >= 0
                    ? `Kerja bagus! Anda menyisihkan ${formatIDR(summary.net_balance)} sebagai cadangan dana.`
                    : `Perhatian: Anda mengalami defisit sebesar ${formatIDR(Math.abs(summary.net_balance))}. Evaluasi pos pengeluaran harian.`}
                </p>
              </div>
            </div>

            <div
              style={{
                textAlign: 'right',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tingkat Penghematan</div>
              <div style={{ fontSize: '1.375rem', fontWeight: 700, color: summary.net_balance >= 0 ? 'var(--income-green-dark)' : 'var(--expense-rose-dark)' }}>
                {savingsRate}%
              </div>
            </div>
          </div>

          {/* Categorical Breakdown Table */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
              Rincian Alokasi Berdasarkan Kategori
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Daftar komprehensif alokasi pengeluaran dan sumber pemasukan
            </p>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th>Tipe Aliran</th>
                    <th>Jumlah Transaksi</th>
                    <th style={{ width: '35%' }}>Porsi Terhadap Total</th>
                    <th style={{ textAlign: 'right' }}>Total Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.by_category.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Tidak ada transaksi pada bulan yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    summary.by_category.map((cat) => {
                      const styleInfo = getCategoryBadgeColor(cat.category, cat.type);
                      const baseTotal = cat.type === 'expense' ? summary.total_expense : summary.total_income;
                      const pct = baseTotal > 0 ? Math.round((cat.total / baseTotal) * 100) : 0;

                      return (
                        <tr key={`${cat.type}-${cat.category}`}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: styleInfo.dot,
                                }}
                              />
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                {cat.category}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: cat.type === 'income' ? 'var(--income-green-subtle)' : 'var(--expense-rose-subtle)',
                                color: cat.type === 'income' ? 'var(--income-green-dark)' : 'var(--expense-rose-dark)',
                              }}
                            >
                              {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {cat.count} kali
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  flex: 1,
                                  height: '7px',
                                  background: 'var(--bg-subtle)',
                                  borderRadius: 'var(--radius-full)',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${Math.min(pct, 100)}%`,
                                    background: styleInfo.dot,
                                    borderRadius: 'var(--radius-full)',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: '35px' }}>
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              color: cat.type === 'income' ? 'var(--income-green-dark)' : 'var(--expense-rose-dark)',
                            }}
                          >
                            {formatIDR(cat.total)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Cashflow Record Table */}
          {summary.daily_totals.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
                Rekap Harian Arus Kas
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Pergerakan kas masuk dan keluar per tanggal di bulan ini
              </p>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th style={{ textAlign: 'right' }}>Pemasukan</th>
                      <th style={{ textAlign: 'right' }}>Pengeluaran</th>
                      <th style={{ textAlign: 'right' }}>Arus Kas Bersih (Net)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.daily_totals.map((day) => {
                      const net = day.income - day.expense;
                      return (
                        <tr key={day.date}>
                          <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {formatDateIndo(day.date)}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--income-green-dark)', fontWeight: 600 }}>
                            {day.income > 0 ? `+${formatIDR(day.income)}` : '-'}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--expense-rose-dark)', fontWeight: 600 }}>
                            {day.expense > 0 ? `-${formatIDR(day.expense)}` : '-'}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              color: net > 0 ? 'var(--income-green)' : net < 0 ? 'var(--expense-rose)' : 'var(--text-muted)',
                            }}
                          >
                            {net > 0 ? `+${formatIDR(net)}` : net < 0 ? `-${formatIDR(Math.abs(net))}` : 'Rp 0'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
