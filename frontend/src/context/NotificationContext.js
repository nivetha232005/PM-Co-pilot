// src/context/NotificationContext.js
// Polls for notifications every 30s; provides bell count + dropdown data

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const POLL_INTERVAL = 30_000; // 30 seconds

export function NotificationProvider({ children }) {
  const { user, authFetch }            = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res  = await authFetch(`${API}/api/notifications?limit=20`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (_) {}
  }, [user, authFetch]);

  // Poll on login, stop on logout
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      clearInterval(intervalRef.current);
      return;
    }
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    await authFetch(`${API}/api/notifications/${id}`, { method: 'PUT' });
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [authFetch]);

  const markAllAsRead = useCallback(async () => {
    await authFetch(`${API}/api/notifications/read-all`, { method: 'PUT' });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, [authFetch]);

  // Push a local toast (for instant feedback without waiting for next poll)
  const pushToast = useCallback((message, type = 'update') => {
    const toast = { _id: `local-${Date.now()}`, message, type, isRead: false, createdAt: new Date().toISOString(), local: true };
    setNotifications(prev => [toast, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, pushToast, refresh: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
