import React, { createContext, useContext, useState, useEffect } from 'react';
import { getNotifications, markNotificationRead } from '../api/client';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  const fetchNotifs = async () => {
    try {
      const token = localStorage.getItem('sh_token');
      if (!token) return;
      const res = await getNotifications();
      setNotifications(res.data || []);
    } catch {}
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const markRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifs, markRead, showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-warmgray-900 text-white px-5 py-3.5 rounded-2xl shadow-warm-xl border border-warmgray-700 animate-bounce">
          <span>🔔</span>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
