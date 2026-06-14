import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAuthConfig, login as apiLogin, getMe } from '@/lib/api';
import {
  AuthConfig,
  AuthUser,
  StoredAuth,
  clearStoredAuth,
  loadStoredAuth,
  saveStoredAuth,
} from '@/lib/auth';

interface AuthContextValue {
  user: AuthUser | null;
  authConfig: AuthConfig | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const config = await getAuthConfig();
      setAuthConfig(config);

      const stored = loadStoredAuth();
      if (!stored) {
        setUser(null);
        return;
      }

      try {
        const me = await getMe();
        setUser(me.user);
        saveStoredAuth({ ...stored, user: me.user });
      } catch {
        clearStoredAuth();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    const stored: StoredAuth = {
      user: result.user,
      tokens: result.tokens,
      authMode: result.authMode,
    };
    saveStoredAuth(stored);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      authConfig,
      loading,
      login,
      logout,
      isAdmin: user?.role === 'ADMIN',
    }),
    [user, authConfig, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
