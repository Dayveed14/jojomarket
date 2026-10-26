import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, refreshSession, registerSessionListener, setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready

  useEffect(() => {
    registerSessionListener((u) => setUser(u));
    // Restore the session from the httpOnly refresh cookie on page load.
    refreshSession().finally(() => setStatus('ready'));
  }, []);

  const applySession = useCallback(({ user: u, accessToken }) => {
    setAccessToken(accessToken);
    setUser(u);
    return u;
  }, []);

  const login = useCallback(async (credentials) => applySession(await authApi.login(credentials)), [applySession]);
  const register = useCallback(async (details) => applySession(await authApi.register(details)), [applySession]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* session may already be gone */ }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, status, isAuthenticated: Boolean(user), login, register, logout, applySession }),
    [user, status, login, register, logout, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export const homeFor = (user) => (user?.role === 'operator' ? '/admin' : '/app');
