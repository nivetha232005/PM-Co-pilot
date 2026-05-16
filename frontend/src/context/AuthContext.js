// src/context/AuthContext.js
// Manages auth state: Google login, JWT storage, user object

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('pm_token'));
  const [loading, setLoading] = useState(true);

  // ── On mount: validate stored token ────────────────────────────────────────
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUser(data.user))
      .catch(() => { localStorage.removeItem('pm_token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  // ── Called by GoogleLogin onSuccess ────────────────────────────────────────
  const loginWithGoogle = useCallback(async (credentialResponse) => {
    const res  = await fetch(`${API}/api/auth/google/token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ credential: credentialResponse.credential }),
    });
    if (!res.ok) throw new Error('Google login failed');
    const data = await res.json();
    localStorage.setItem('pm_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pm_token');
    setToken(null);
    setUser(null);
  }, []);

  // ── Authenticated fetch helper (auto-attaches Bearer token) ───────────────
  const authFetch = useCallback((url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
