import type {
  AuthResponse,
  MonthlySummary,
  PaginatedResponse,
  Transaction,
  TransactionFilter,
  TransactionInput,
  User,
} from '../types';

const API_BASE = '/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('duitin_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('duitin_token', token);
    } else {
      localStorage.removeItem('duitin_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      // If unauthorized and not already on login/register page, can trigger re-auth
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    let data: any;
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { error: text || 'Terjadi kesalahan pada server' };
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || `Permintaan gagal (status ${response.status})`;
      throw new Error(errorMessage);
    }

    return data as T;
  }

  // Auth Endpoints
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Transaction Endpoints
  async getTransactions(filter: TransactionFilter = {}): Promise<PaginatedResponse<Transaction>> {
    const params = new URLSearchParams();
    if (filter.type && filter.type !== 'all') params.append('type', filter.type);
    if (filter.category) params.append('category', filter.category);
    if (filter.startDate) params.append('start_date', filter.startDate);
    if (filter.endDate) params.append('end_date', filter.endDate);
    if (filter.search) params.append('search', filter.search);
    if (filter.sortBy) params.append('sort_by', filter.sortBy);
    if (filter.sortOrder) params.append('sort_order', filter.sortOrder);
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.limit) params.append('limit', filter.limit.toString());

    const queryString = params.toString();
    const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;
    return this.request<PaginatedResponse<Transaction>>(endpoint);
  }

  async getTransactionById(id: string): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/${id}`);
  }

  async createTransaction(payload: TransactionInput): Promise<Transaction> {
    return this.request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTransaction(id: string, payload: TransactionInput): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTransaction(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Summary Endpoint
  async getSummary(month: string): Promise<MonthlySummary> {
    return this.request<MonthlySummary>(`/summary?month=${encodeURIComponent(month)}`);
  }

  // Health Endpoint
  async checkHealth(): Promise<{ status: string; version: string }> {
    return this.request<{ status: string; version: string }>('/health');
  }
}

export const api = new ApiClient();
