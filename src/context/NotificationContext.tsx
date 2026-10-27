import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { wsBus } from '../services/storageEngine';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  addToast: (title: string, message: string, type?: AppNotification['type']) => void;
  activeToast: { title: string; message: string; type: AppNotification['type'] } | null;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('smart_cafeteria_notifications');
    return saved ? JSON.parse(saved) : [
      {
        id: 'notif-1',
        title: 'Welcome to Smart Cafeteria',
        message: 'Pre-order freshly prepared meals and track preparation stages in real time!',
        type: 'system',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [activeToast, setActiveToast] = useState<{ title: string; message: string; type: AppNotification['type'] } | null>(null);

  useEffect(() => {
    localStorage.setItem('smart_cafeteria_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Subscribe to real-time WebSocket events from storageEngine
  useEffect(() => {
    const unsubNewOrder = wsBus.subscribe('NEW_ORDER', (order: any) => {
      addToast(
        '🔔 Incoming Kitchen Order',
        `New Order #${order.orderNumber} placed by ${order.customerName} ($${order.totalAmount}).`,
        'order'
      );
    });

    const unsubStatus = wsBus.subscribe('ORDER_STATUS_CHANGED', (data: any) => {
      const statusTitle = data.newStatus.replace('_', ' ').toUpperCase();
      addToast(
        `Order Update: ${statusTitle}`,
        `Order #${data.orderNumber} status changed to ${data.newStatus.replace('_', ' ')}.`,
        'order'
      );
    });

    const unsubLowStock = wsBus.subscribe('LOW_STOCK_ALERT', (alerts: any[]) => {
      if (alerts && alerts.length > 0) {
        addToast(
          '⚠️ Low Stock Alert',
          `${alerts[0].name} has dropped to ${alerts[0].currentStock} ${alerts[0].unit} (Below min ${alerts[0].minimumThreshold}).`,
          'inventory'
        );
      }
    });

    return () => {
      unsubNewOrder();
      unsubStatus();
      unsubLowStock();
    };
  }, []);

  const addToast = (title: string, message: string, type: AppNotification['type'] = 'order') => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast({ title, message, type });

    // Auto dismiss toast after 5s
    setTimeout(() => {
      setActiveToast(current => (current?.title === title ? null : current));
    }, 5000);
  };

  const dismissToast = () => setActiveToast(null);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearAll,
      addToast,
      activeToast,
      dismissToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};
