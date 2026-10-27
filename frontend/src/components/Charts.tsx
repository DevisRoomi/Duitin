import React from 'react';
import type { CategorySummary, DailySummary } from '../types';
import { formatIDR, getCategoryBadgeColor } from '../utils/format';

interface IncomeExpenseChartProps {
  income: number;
  expense: number;
  dailyTotals?: DailySummary[];
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({
  income,
  expense,
  dailyTotals = [],
}) => {
  const maxTotal = Math.max(income, expense, 1);
  const incomeHeightPct = Math.round((income / maxTotal) * 100);
  const expenseHeightPct = Math.round((expense / maxTotal) * 100);

  // If daily totals exist and has more than 1 day
  const hasDailyData = dailyTotals.length > 0;
  const maxDaily = hasDailyData
    ? Math.max(...dailyTotals.map((d) => Math.max(d.income, d.expense)), 1000)
    : 1;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
            Perbandingan Arus Kas
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Total pemasukan vs pengeluaran bulan ini
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--income-green)' }} />
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Pemasukan</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--expense-rose)' }} />
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Pengeluaran</span>
          </div>
        </div>
      </div>

      {income === 0 && expense === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Belum ada transaksi di bulan ini untuk ditampilkan dalam grafik.
        </div>
      ) : (
        <div>
          {/* Main Comparison Bars */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '3rem',
              height: '160px',
              padding: '1rem 0',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            {/* Income Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '90px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--income-green-dark)' }}>
                {formatIDR(income)}
              </span>
              <div
                style={{
                  width: '100%',
                  height: `${Math.max(incomeHeightPct, 6)}%`,
                  maxHeight: '120px',
                  background: 'var(--income-green)',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  transition: 'height 0.4s ease-out',
                }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Pemasukan
              </span>
            </div>

            {/* Expense Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '90px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--expense-rose-dark)' }}>
                {formatIDR(expense)}
              </span>
              <div
                style={{
                  width: '100%',
                  height: `${Math.max(expenseHeightPct, 6)}%`,
                  maxHeight: '120px',
                  background: 'var(--expense-rose)',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  transition: 'height 0.4s ease-out',
                }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Pengeluaran
              </span>
            </div>
          </div>

          {/* Daily Trend Mini-bars if multiple days exist */}
          {hasDailyData && dailyTotals.length > 2 && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Aktivitas Harian
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '60px' }}>
                {dailyTotals.map((day) => {
                  const dayNum = day.date.split('-')[2];
                  const incH = (day.income / maxDaily) * 100;
                  const expH = (day.expense / maxDaily) * 100;

                  return (
                    <div
                      key={day.date}
                      title={`${day.date}: Masuk ${formatIDR(day.income)}, Keluar ${formatIDR(day.expense)}`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', width: '100%', height: '44px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: `${Math.max(incH, 2)}%`,
                            background: 'var(--income-green)',
                            borderRadius: '2px 2px 0 0',
                            opacity: day.income > 0 ? 0.9 : 0.2,
                          }}
                        />
                        <div
                          style={{
                            flex: 1,
                            height: `${Math.max(expH, 2)}%`,
                            background: 'var(--expense-rose)',
                            borderRadius: '2px 2px 0 0',
                            opacity: day.expense > 0 ? 0.9 : 0.2,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.625rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                        {parseInt(dayNum, 10)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface CategoryBreakdownProps {
  categories: CategorySummary[];
  totalExpense: number;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
  totalExpense,
}) => {
  const expenseCategories = categories
    .filter((c) => c.type === 'expense' && c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
            Pengeluaran Berdasarkan Kategori
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Distribusi alokasi dana Anda bulan ini
          </p>
        </div>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
          {formatIDR(totalExpense)}
        </span>
      </div>

      {expenseCategories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Belum ada catatan pengeluaran di bulan ini.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {expenseCategories.map((cat) => {
            const styling = getCategoryBadgeColor(cat.category, 'expense');
            const pct = cat.percentage || (totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0);

            return (
              <div key={cat.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: styling.dot,
                      }}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {cat.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({cat.count} transaksi)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {pct}%
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {formatIDR(cat.total)}
                    </span>
                  </div>
                </div>

                {/* Progress Meter Bar */}
                <div
                  style={{
                    height: '8px',
                    width: '100%',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(pct, 100)}%`,
                      background: styling.dot,
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.4s ease-in-out',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
