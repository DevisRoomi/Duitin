import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { MonthlySummary, Transaction, TransactionInput } from '../types';
import { api } from '../api/client';
import {
  formatIDR,
  formatDateIndo,
  formatMonthYear,
  getCurrentMonth,
  getCategoryBadgeColor,
} from '../utils/format';
import { StatsCard } from '../components/StatsCard';
import { IncomeExpenseChart, CategoryBreakdown } from '../components/Charts';
import { EmptyState } from '../components/EmptyState';
import { TransactionModal } from '../components/TransactionModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface DashboardPageProps {
  onOpenAddModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenAddModal,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit / Delete states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumData, txData] = await Promise.all([
        api.getSummary(selectedMonth),
        api.getTransactions({
          startDate: `${selectedMonth}-01`,
          endDate: `${selectedMonth}-31`,
          sortBy: 'date',
          sortOrder: 'desc',
          limit: 5,
        }),
      ]);
      setSummary(sumData);
      setRecentTransactions(txData.data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data ringkasan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  // Listen to window reload events after transaction edits elsewhere
  useEffect(() => {
    const handleRefresh = () => fetchData();
    window.addEventListener('duitin:refresh', handleRefresh);
    return () => window.removeEventListener('duitin:refresh', handleRefresh);
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

  const handleEditSubmit = async (data: TransactionInput) => {
    if (!editingTransaction) return;
    setIsActionLoading(true);
    try {
      await api.updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
      await fetchData();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    setIsActionLoading(true);
    try {
      await api.deleteTransaction(deletingTransaction.id);
      setDeletingTransaction(null);
      await fetchData();
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header with Month Selector */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ringkasan Keuangan</h1>
          <p className="page-subtitle">Pantau pemasukan, pengeluaran, dan sisa saldo Anda secara berkala.</p>
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

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="stats-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card animate-pulse" style={{ height: '150px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--border-light)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
              <div style={{ width: '100px', height: '16px', background: 'var(--border-light)', borderRadius: '4px', marginBottom: '0.5rem' }} />
              <div style={{ width: '160px', height: '28px', background: 'var(--border-light)', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      ) : summary ? (
        <>
          {/* Key Metric Cards */}
          <div className="stats-grid">
            <StatsCard
              label="Total Pemasukan"
              amount={summary.total_income}
              icon={<TrendingUp size={22} />}
              iconBg="var(--income-green-subtle)"
              iconColor="var(--income-green)"
              type="income"
            />

            <StatsCard
              label="Total Pengeluaran"
              amount={summary.total_expense}
              icon={<TrendingDown size={22} />}
              iconBg="var(--expense-rose-subtle)"
              iconColor="var(--expense-rose)"
              changePct={summary.expense_change_pct}
              changeLabel={
                summary.previous_month_expense !== undefined && summary.previous_month_expense !== null
                  ? `dibanding bulan lalu (${formatIDR(summary.previous_month_expense)})`
                  : undefined
              }
              type="expense"
            />

            <StatsCard
              label="Sisa Saldo"
              amount={summary.net_balance}
              icon={<Wallet size={22} />}
              iconBg="var(--accent-blue-subtle)"
              iconColor="var(--accent-blue)"
              type="balance"
            />
          </div>

          {/* Empty State check for zero transactions */}
          {summary.transaction_count === 0 ? (
            <EmptyState
              title={`Belum Ada Transaksi di ${formatMonthYear(selectedMonth)}`}
              description="Catat pengeluaran atau pemasukan harian Anda untuk mengaktifkan grafik dan statistik keuangan."
              onAction={onOpenAddModal}
              actionText="Tambah Transaksi Baru"
            />
          ) : (
            <>
              {/* Visual Analytics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <IncomeExpenseChart
                  income={summary.total_income}
                  expense={summary.total_expense}
                  dailyTotals={summary.daily_totals}
                />

                <CategoryBreakdown
                  categories={summary.by_category}
                  totalExpense={summary.total_expense}
                />
              </div>

              {/* Recent Transactions Preview Card */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                      Transaksi Terbaru
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      5 transaksi terkini di {formatMonthYear(selectedMonth)}
                    </p>
                  </div>

                  <Link
                    to="/transactions"
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.375rem' }}
                  >
                    Lihat Semua
                    <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Kategori</th>
                        <th>Deskripsi</th>
                        <th style={{ textAlign: 'right' }}>Nominal</th>
                        <th style={{ textAlign: 'center', width: '80px' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((tx) => {
                        const styleInfo = getCategoryBadgeColor(tx.category, tx.type);
                        return (
                          <tr key={tx.id}>
                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                              {formatDateIndo(tx.date)}
                            </td>
                            <td>
                              <span
                                className="badge"
                                style={{
                                  background: styleInfo.bg,
                                  color: styleInfo.text,
                                }}
                              >
                                <span className="badge-dot" style={{ background: styleInfo.dot }} />
                                {tx.category}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                {tx.description}
                              </div>
                              {tx.notes && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                                  {tx.notes}
                                </div>
                              )}
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                color: tx.type === 'income' ? 'var(--income-green)' : 'var(--expense-rose)',
                              }}
                            >
                              {tx.type === 'income' ? '+' : '-'} {formatIDR(tx.amount)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '4px' }}>
                                <button
                                  onClick={() => setEditingTransaction(tx)}
                                  className="btn-icon"
                                  style={{ padding: '0.375rem' }}
                                  title="Ubah"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => setDeletingTransaction(tx)}
                                  className="btn-icon"
                                  style={{ padding: '0.375rem', color: 'var(--expense-rose)' }}
                                  title="Hapus"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : null}

      {/* Edit Modal */}
      <TransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSubmit={handleEditSubmit}
        initialData={editingTransaction}
        isSubmitting={isActionLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleDeleteConfirm}
        transaction={deletingTransaction}
        isDeleting={isActionLoading}
      />
    </div>
  );
};
