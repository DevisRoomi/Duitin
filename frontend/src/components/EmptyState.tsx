import React from 'react';
import { PlusCircle, Sparkles, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onAction?: () => void;
  actionText?: string;
  onSeedDemo?: () => void;
  isSeeding?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Belum Ada Transaksi',
  description = 'Mulai catat pemasukan dan pengeluaran harian Anda untuk melihat ringkasan keuangan yang rapi.',
  onAction,
  actionText = 'Catat Transaksi Pertama',
  onSeedDemo,
  isSeeding = false,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-light)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--bg-subtle)',
          color: 'var(--text-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <Inbox size={28} />
      </div>

      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.375rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', marginBottom: '1.5rem' }}>
        {description}
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {onAction && (
          <button onClick={onAction} className="btn btn-primary">
            <PlusCircle size={18} />
            {actionText}
          </button>
        )}

        {onSeedDemo && (
          <button
            onClick={onSeedDemo}
            disabled={isSeeding}
            className="btn btn-secondary"
            style={{ color: '#4f46e5' }}
          >
            <Sparkles size={16} />
            {isSeeding ? 'Memuat Demo...' : 'Coba Data Demo'}
          </button>
        )}
      </div>
    </div>
  );
};
