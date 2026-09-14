'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { adminApi, clearSession, getStoredUser, getToken, setSession } from './admin-api';
import type { User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (...roles: User['role'][]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Show the cached user immediately, then confirm the token is still valid.
    const cached = getStoredUser();
    if (cached) setUser(cached);
    if (!getToken()) {
      setLoading(false);
      return;
    }
    adminApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { access_token, user: me } = await adminApi.login(email, password);
      setSession(access_token, me);
      setUser(me);
      router.push('/admin');
    },
    [router],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.push('/admin/login');
  }, [router]);

  const can = useCallback(
    (...roles: User['role'][]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  const value = useMemo(() => ({ user, loading, login, logout, can }), [user, loading, login, logout, can]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
