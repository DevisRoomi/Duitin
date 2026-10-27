import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatIDR } from '../utils/format';

interface StatsCardProps {
  label: string;
  amount: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  changePct?: number | null;
  changeLabel?: string;
  type?: 'income' | 'expense' | 'balance';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  amount,
  icon,
  iconBg,
  iconColor,
  changePct,
  changeLabel,
  type = 'balance',
}) => {
  return (
    <div className="stat-card card-hover">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          className="stat-icon"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>

        {changePct !== undefined && changePct !== null && (
          <div
            className="stat-badge"
            style={{
              background:
                type === 'expense'
                  ? changePct > 0
                    ? 'var(--expense-rose-subtle)'
                    : 'var(--income-green-subtle)'
                  : changePct >= 0
                  ? 'var(--income-green-subtle)'
                  : 'var(--expense-rose-subtle)',
              color:
                type === 'expense'
                  ? changePct > 0
                    ? 'var(--expense-rose-dark)'
                    : 'var(--income-green-dark)'
                  : changePct >= 0
                  ? 'var(--income-green-dark)'
                  : 'var(--expense-rose-dark)',
            }}
          >
            {changePct > 0 ? (
              <ArrowUpRight size={14} />
            ) : changePct < 0 ? (
              <ArrowDownRight size={14} />
            ) : (
              <Minus size={14} />
            )}
            <span>
              {changePct > 0 ? `+${changePct.toFixed(1)}%` : `${changePct.toFixed(1)}%`}
            </span>
          </div>
        )}
      </div>

      <span className="stat-label">{label}</span>
      <div className="stat-value">{formatIDR(amount)}</div>

      {changeLabel && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
          {changeLabel}
        </div>
      )}
    </div>
  );
};
