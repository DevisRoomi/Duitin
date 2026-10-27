import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import type { User, TransactionInput } from './types';
import { api } from './api/client';
import { Sidebar } from './components/Sidebar';
import { TransactionModal } from './components/TransactionModal';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SummaryPage } from './pages/SummaryPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch {
        api.setToken(null);
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuth();

    const handleAuthExpired = () => {
      setUser(null);
      navigate('/login');
      showToast('Sesi Anda telah berakhir, silakan masuk kembali', 'error');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    navigate('/login');
    showToast('Berhasil keluar dari akun', 'success');
  };

  const handleAddTransactionSubmit = async (data: TransactionInput) => {
    setIsSubmitting(true);
    try {
      await api.createTransaction(data);
      setIsAddModalOpen(false);
      showToast('Transaksi berhasil dicatat!', 'success');
      window.dispatchEvent(new CustomEvent('duitin:refresh'));
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan transaksi', 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await api.seedDemo();
      showToast(res.message || 'Contoh data demo berhasil dimuat!', 'success');
      window.dispatchEvent(new CustomEvent('duitin:refresh'));
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat contoh data', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-app)',
          color: 'var(--text-muted)',
          fontSize: '0.9375rem',
        }}
      >
        Memuat Duitin...
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 999,
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: toastMessage.type === 'success' ? 'var(--income-green-dark)' : 'var(--expense-rose-dark)',
            color: '#ffffff',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {toastMessage.text}
        </div>
      )}

      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage
                onLoginSuccess={(u) => {
                  setUser(u);
                  showToast(`Selamat datang kembali, ${u.name}!`, 'success');
                }}
              />
            )
          }
        />

        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <RegisterPage
                onRegisterSuccess={(u) => {
                  setUser(u);
                  showToast(`Akun berhasil dibuat. Selamat datang di Duitin, ${u.name}!`, 'success');
                }}
              />
            )
          }
        />

        {/* Protected App Shell */}
        <Route
          path="*"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <div className="app-container">
                <Sidebar
                  user={user}
                  onLogout={handleLogout}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onSeedDemo={handleSeedDemo}
                  isSeeding={isSeeding}
                />

                <main className="main-content">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <DashboardPage
                          onOpenAddModal={() => setIsAddModalOpen(true)}
                          onSeedDemo={handleSeedDemo}
                          isSeeding={isSeeding}
                        />
                      }
                    />
                    <Route
                      path="/transactions"
                      element={
                        <TransactionsPage
                          onOpenAddModal={() => setIsAddModalOpen(true)}
                        />
                      }
                    />
                    <Route path="/summary" element={<SummaryPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>

                <TransactionModal
                  isOpen={isAddModalOpen}
                  onClose={() => setIsAddModalOpen(false)}
                  onSubmit={handleAddTransactionSubmit}
                  isSubmitting={isSubmitting}
                />
              </div>
            )
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
