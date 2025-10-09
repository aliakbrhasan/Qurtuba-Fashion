import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppNotification, notifications as notificationsBus } from '@/services/notifications.service';

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  add: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & Partial<Pick<AppNotification, 'read'>>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  remove: (id: string) => void;
  clear: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    const listener = (n: AppNotification) => {
      setItems((prev) => [n, ...prev]);
    };
    notificationsBus.on(listener);
    return () => notificationsBus.off(listener);
  }, []);

  const add: NotificationsContextValue['add'] = useCallback((n) => {
    const created = notificationsBus.emit(n);
    setItems((prev) => [created, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const value = useMemo<NotificationsContextValue>(() => ({
    notifications: items,
    unreadCount,
    add,
    markAsRead,
    markAllAsRead,
    remove,
    clear,
  }), [items, unreadCount, add, markAsRead, markAllAsRead, remove, clear]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}


