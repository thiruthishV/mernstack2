import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../api/client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const res = await notificationAPI.getMyNotifications();
      // Backend returns { notifications: [...], unreadCount: number }
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data?.notifications || []);
      const count = typeof res.data?.unreadCount === 'number'
        ? res.data.unreadCount
        : list.filter((n) => !n.isRead).length;

      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // Auto refresh notifications every 30 seconds
    const interval = setInterval(() => {
      if (user) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, user]);

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) => {
        const safe = Array.isArray(prev) ? prev : [];
        const next = safe.map((n) => (n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(next.filter((n) => !n.isRead).length);
        return next;
      });
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => {
        const safe = Array.isArray(prev) ? prev : [];
        return safe.map((n) => ({ ...n, isRead: true }));
      });
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  return (
    <NotificationContext.Provider
      value={{
        notifications: safeNotifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
