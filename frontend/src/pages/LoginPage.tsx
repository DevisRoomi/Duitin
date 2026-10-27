import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, LogIn, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import type { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      onLoginSuccess(res.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Email atau kata sandi tidak sesuai');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Login with default demo user or register demo user
      let res;
      try {
        res = await api.login('demo@duitin.app', 'demo123456');
      } catch {
        res = await api.register('Santri Demo', 'demo@duitin.app', 'demo123456');
      }
      onLoginSuccess(res.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Gagal masuk sebagai akun demo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '2.25rem',
          boxShadow: 'var(--shadow-modal)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--primary-navy)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <Wallet size={26} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-navy)', letterSpacing: '-0.02em' }}>
            Masuk ke Duitin
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Kelola pengeluaran dan simpanan masa depan Anda
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'var(--expense-rose-subtle)',
              color: 'var(--expense-rose-dark)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              border: '1px solid #fecdd3',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
            <input
              type="password"
              className="form-input"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem', marginTop: '0.5rem' }}
            disabled={isLoading}
          >
            <LogIn size={18} />
            {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, borderTop: '1px solid var(--border-light)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
            atau
          </span>
          <div style={{ flex: 1, borderTop: '1px solid var(--border-light)' }} />
        </div>

        {/* Demo Fast Login */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.625rem', color: '#4f46e5', borderColor: '#c7d2fe', background: '#eef2ff' }}
          disabled={isLoading}
        >
          <Sparkles size={16} />
          Masuk Instan (Akun Demo)
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Belum memiliki akun?{' '}
          <Link to="/register" style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
            Daftar Akun Baru
          </Link>
        </div>
      </div>
    </div>
  );
};
