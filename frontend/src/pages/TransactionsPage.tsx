import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Edit2,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type {
  Transaction,
  TransactionInput,
  TransactionType,
} from '../types';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '../types';
import { api } from '../api/client';
import { formatIDR, formatDateIndo, getCategoryBadgeColor } from '../utils/format';
import { TransactionModal } from '../components/TransactionModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface TransactionsPageProps {
  onOpenAddModal: () => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ onOpenAddModal }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [category, setCategory] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const limit = 10;

  // Modals
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getTransactions({
        search: search.trim() || undefined,
        type: type !== 'all' ? (type as TransactionType) : undefined,
        category: category || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      setTransactions(res.data);
      setTotalCount(res.total);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [type, category, startDate, endDate, sortBy, sortOrder, page]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleResetFilters = () => {
    setSearch('');
    setType('all');
    setCategory('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortOrder('desc');
    setPage(1);
  };

  const handleEditSubmit = async (data: TransactionInput) => {
    if (!editingTransaction) return;
    setIsActionLoading(true);
    try {
      await api.updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
      await fetchTransactions();
      window.dispatchEvent(new CustomEvent('duitin:refresh'));
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
      await fetchTransactions();
      window.dispatchEvent(new CustomEvent('duitin:refresh'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const allAvailableCategories =
    type === 'income'
      ? INCOME_CATEGORIES
      : type === 'expense'
      ? EXPENSE_CATEGORIES
      : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Riwayat Transaksi</h1>
          <p className="page-subtitle">Kelola dan telusuri seluruh pemasukan serta pengeluaran Anda.</p>
        </div>

        <button onClick={onOpenAddModal} className="btn btn-primary">
          <PlusCircle size={18} />
          Catat Transaksi
        </button>
      </div>

      {/* Filter and Search Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Cari transaksi / catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select
            className="form-select"
            value={type}
            onChange={(e) => {
              setType(e.target.value as any);
              setCategory('');
              setPage(1);
            }}
          >
            <option value="all">Semua Jenis Transaksi</option>
            <option value="expense">Hanya Pengeluaran</option>
            <option value="income">Hanya Pemasukan</option>
          </select>

          {/* Category Filter */}
          <select
            className="form-select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua Kategori</option>
            {allAvailableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Date Range Start */}
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            title="Dari Tanggal"
          />

          {/* Date Range End */}
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            title="Sampai Tanggal"
          />
        </div>

        {/* Filter Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <Filter size={14} />
            <span>Ditemukan <strong>{totalCount}</strong> transaksi</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', width: 'auto' }}
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
                setPage(1);
              }}
            >
              <option value="date-desc">Tanggal: Terbaru</option>
              <option value="date-asc">Tanggal: Terlama</option>
              <option value="amount-desc">Nominal: Terbesar</option>
              <option value="amount-asc">Nominal: Terkecil</option>
            </select>

            {(search || type !== 'all' || category || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="btn btn-secondary btn-sm"
                title="Reset filter"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
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

      {/* Main Table Card */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Memuat daftar transaksi...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem', marginBottom: '0.25rem' }}>
              Tidak ada transaksi yang cocok
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Coba sesuaikan kata kunci pencarian atau ubah filter tanggal Anda.
            </p>
            <button onClick={handleResetFilters} className="btn btn-secondary btn-sm">
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jenis & Kategori</th>
                    <th>Deskripsi & Catatan</th>
                    <th style={{ textAlign: 'right' }}>Nominal</th>
                    <th style={{ textAlign: 'center', width: '90px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const styleInfo = getCategoryBadgeColor(tx.category, tx.type);
                    return (
                      <tr key={tx.id}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
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
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
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
                              title="Ubah Transaksi"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setDeletingTransaction(tx)}
                              className="btn-icon"
                              style={{ padding: '0.375rem', color: 'var(--expense-rose)' }}
                              title="Hapus Transaksi"
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

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  borderTop: '1px solid var(--border-light)',
                  background: 'var(--bg-subtle)',
                }}
              >
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.25rem 0.5rem' }}
                  >
                    <ChevronLeft size={16} />
                    Sebelumnya
                  </button>

                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.25rem 0.5rem' }}
                  >
                    Selanjutnya
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
