import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { QuoteWizard } from '@/components/QuoteWizard';
import { AdminPanel } from '@/pages/AdminPanel';
import { LoginPage } from '@/pages/LoginPage';
import { AppHeader } from '@/components/AppHeader';

function HomePage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <QuoteWizard />
      </main>
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-mi-navy)] text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/motherson-logo-white.svg" alt="Motherson Innovations" className="h-6 w-auto opacity-90" />
          <p className="text-xs text-white/70">
            Copyright © Samvardhana Motherson Group. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={(
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin"
            element={(
              <ProtectedRoute roles={['ADMIN']}>
                <AdminPanel />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
