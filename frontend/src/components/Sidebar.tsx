import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  PlusCircle,
  LogOut,
  Wallet,
} from 'lucide-react';
import type { User } from '../types';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
  onOpenAddModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  onLogout,
  onOpenAddModal,
}) => {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-navy)',
              color: 'var(--text-inverse)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Wallet size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary-navy)', letterSpacing: '-0.02em' }}>
              Duitin
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pelacak Keuangan Pintar
            </div>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={onOpenAddModal}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
        >
          <PlusCircle size={18} />
          Catat Transaksi
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '1.25rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: isActive ? 'var(--primary-navy)' : 'var(--text-muted)',
            background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
            transition: 'var(--transition)',
          })}
        >
          <LayoutDashboard size={19} />
          Ringkasan
        </NavLink>

        <NavLink
          to="/transactions"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: isActive ? 'var(--primary-navy)' : 'var(--text-muted)',
            background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
            transition: 'var(--transition)',
          })}
        >
          <ReceiptText size={19} />
          Riwayat Transaksi
        </NavLink>

        <NavLink
          to="/summary"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: isActive ? 'var(--primary-navy)' : 'var(--text-muted)',
            background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
            transition: 'var(--transition)',
          })}
        >
          <PieChart size={19} />
          Laporan Bulanan
        </NavLink>
      </nav>

      {/* User Footer */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 0, flex: 1, marginRight: '0.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Pengguna Duitin'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || 'user@duitin.app'}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="btn-icon"
            title="Keluar / Logout"
            style={{ color: 'var(--expense-rose)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};
