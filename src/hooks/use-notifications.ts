import { useState, useEffect, useCallback } from 'react';
import { getPendingNotifications, markNotificationSent } from '@/lib/order-store';

export type NotificationPermission = 'default' | 'granted' | 'denied';

interface UseNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  checkPendingNotifications: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator;

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission as NotificationPermission);
    }
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      return result as NotificationPermission;
    } catch {
      return 'denied';
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;

    // Try to use service worker first
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          ...options,
        });
      }).catch(() => {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/icon-192.png',
          ...options,
        });
      });
    } else {
      new Notification(title, {
        icon: '/icon-192.png',
        ...options,
      });
    }
  }, [isSupported, permission]);

  const checkPendingNotifications = useCallback(() => {
    if (permission !== 'granted') return;

    const pending = getPendingNotifications();
    pending.forEach(notification => {
      sendNotification(notification.title, {
        body: notification.body,
        tag: notification.orderId,
        data: { orderId: notification.orderId, type: notification.type },
      });
      markNotificationSent(notification.orderId);
    });
  }, [permission, sendNotification]);

  // Check for pending notifications on mount and permission change
  useEffect(() => {
    if (permission === 'granted') {
      checkPendingNotifications();
    }
  }, [permission, checkPendingNotifications]);

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    checkPendingNotifications,
  };
};

// Hook to manage notification preferences
export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    orderUpdates: true,
    newContent: true,
    promotions: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem('notification_preferences');
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const updatePreferences = (updates: Partial<typeof preferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    localStorage.setItem('notification_preferences', JSON.stringify(newPrefs));
  };

  return { preferences, updatePreferences };
};
