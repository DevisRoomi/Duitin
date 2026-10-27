import React, { useState, useEffect } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import type {
  Transaction,
  TransactionInput,
  TransactionType,
} from '../types';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '../types';
import { formatIDR, getTodayDate } from '../utils/format';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionInput) => Promise<void>;
  initialData?: Transaction | null;
  isSubmitting?: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDate());
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmountStr(initialData.amount.toString());
      setCategory(initialData.category);
      setDescription(initialData.description);
      setDate(initialData.date);
      setNotes(initialData.notes || '');
    } else {
      setType('expense');
      setAmountStr('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setDescription('');
      setDate(getTodayDate());
      setNotes('');
    }
    setError(null);
  }, [initialData, isOpen]);

  // When type changes, adjust default category if current category does not belong
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      if (!(INCOME_CATEGORIES as readonly string[]).includes(category)) {
        setCategory(INCOME_CATEGORIES[0]);
      }
    } else {
      if (!(EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
        setCategory(EXPENSE_CATEGORIES[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Nominal harus berupa angka bulat positif lebih besar dari 0');
      return;
    }

    if (!description.trim()) {
      setError('Deskripsi transaksi wajib diisi');
      return;
    }

    if (!category) {
      setError('Kategori wajib dipilih');
      return;
    }

    if (!date) {
      setError('Tanggal transaksi wajib dipilih');
      return;
    }

    try {
      await onSubmit({
        type,
        amount: parsedAmount,
        category,
        description: description.trim(),
        date,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan transaksi');
    }
  };

  if (!isOpen) return null;

  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const numAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div className="modal-header">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
            {initialData ? 'Ubah Transaksi' : 'Catat Transaksi Baru'}
          </h3>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ borderRadius: '50%' }}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--expense-rose-subtle)',
                  color: 'var(--expense-rose-dark)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                  border: '1px solid #fecdd3',
                }}
              >
                {error}
              </div>
            )}

            {/* Type Selector (Pemasukan vs Pengeluaran) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: type === 'expense' ? '2px solid var(--expense-rose)' : '1px solid var(--border-light)',
                  background: type === 'expense' ? 'var(--expense-rose-subtle)' : 'var(--bg-surface)',
                  color: type === 'expense' ? 'var(--expense-rose-dark)' : 'var(--text-muted)',
                  transition: 'var(--transition)',
                }}
              >
                <ArrowDownCircle size={18} color={type === 'expense' ? 'var(--expense-rose)' : 'currentColor'} />
                Pengeluaran
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: type === 'income' ? '2px solid var(--income-green)' : '1px solid var(--border-light)',
                  background: type === 'income' ? 'var(--income-green-subtle)' : 'var(--bg-surface)',
                  color: type === 'income' ? 'var(--income-green-dark)' : 'var(--text-muted)',
                  transition: 'var(--transition)',
                }}
              >
                <ArrowUpCircle size={18} color={type === 'income' ? 'var(--income-green)' : 'currentColor'} />
                Pemasukan
              </button>
            </div>

            {/* Amount Input */}
            <div className="form-group">
              <label className="form-label">Nominal (Rupiah)</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    fontSize: '0.9375rem',
                  }}
                >
                  Rp
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '40px', fontSize: '1.125rem', fontWeight: 600 }}
                  placeholder="Contoh: 50000"
                  value={amountStr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setAmountStr(val);
                  }}
                  autoFocus
                  required
                />
              </div>
              {!isNaN(numAmount) && numAmount > 0 && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                  Terbaca: <strong>{formatIDR(numAmount)}</strong>
                </div>
              )}
            </div>

            {/* Category Select */}
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {currentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Input */}
            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Makan siang warteg, Beli buku kuliah..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Date Input */}
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Optional Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Catatan Tambahan (Opsional)</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Contoh: Dibayari teman Rp 10.000 dulu..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className={type === 'expense' ? 'btn btn-primary' : 'btn btn-success'}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : initialData ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
