export type TransactionType = 'income' | 'expense';

export const INCOME_CATEGORIES = [
  'Uang saku',
  'Gaji',
  'Freelance',
  'Bisnis',
  'Lainnya',
] as const;

export const EXPENSE_CATEGORIES = [
  'Makanan',
  'Transportasi',
  'Pendidikan',
  'Kebutuhan harian',
  'Hiburan',
  'Tabungan',
  'Lainnya',
] as const;

export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type TransactionCategory = IncomeCategory | ExpenseCategory | string;

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number; // integer in IDR
  type: TransactionType;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionInput {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  notes?: string;
}

export interface TransactionFilter {
  type?: 'all' | 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CategorySummary {
  category: string;
  type: TransactionType;
  total: number;
  percentage: number;
  count: number;
}

export interface DailySummary {
  date: string;
  income: number;
  expense: number;
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  total_income: number;
  total_expense: number;
  net_balance: number;
  previous_month_expense?: number | null;
  expense_change_pct?: number | null;
  by_category: CategorySummary[];
  daily_totals: DailySummary[];
  transaction_count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: string[];
}
