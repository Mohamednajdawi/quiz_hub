'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type AppNotificationType = 'quiz' | 'flashcards' | 'essay' | 'info';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: AppNotificationType;
  createdAt: string;
  read: boolean;
  href?: string;
  meta?: Record<string, unknown>;
}

export type NotificationInput = Omit<AppNotification, 'id' | 'createdAt' | 'read'> & {
  id?: string;
  createdAt?: string;
  read?: boolean;
};

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: NotificationInput) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

const MAX_NOTIFICATIONS = 30;

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  const storageKey = useMemo(() => (user?.id ? `quizhub_notifications_${user.id}` : null), [user?.id]);

  // Hydrate notifications when user changes
  useEffect(() => {
    if (!storageKey) {
      setNotifications([]);
      setHasHydrated(false);
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as AppNotification[];
        setNotifications(parsed);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.warn('Failed to parse stored notifications', error);
      setNotifications([]);
    } finally {
      setHasHydrated(true);
    }
  }, [storageKey]);

  // Persist notifications after hydration
  useEffect(() => {
    if (!storageKey || !hasHydrated) {
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.warn('Failed to persist notifications', error);
    }
  }, [notifications, storageKey, hasHydrated]);

  const addNotification = useCallback(
    (payload: NotificationInput) => {
      setNotifications((prev) => {
        const next: AppNotification[] = [
          {
            id: payload.id ?? generateId(),
            createdAt: payload.createdAt ?? new Date().toISOString(),
            read: payload.read ?? false,
            ...payload,
          },
          ...prev,
        ].slice(0, MAX_NOTIFICATIONS);
        return next;
      });
    },
    []
  );

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearNotifications,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

