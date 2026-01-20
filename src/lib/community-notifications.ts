/**
 * Community Notifications System
 * Manages notifications for comments on ideas
 */

export interface CommunityNotification {
  id: string;
  type: 'comment' | 'vote' | 'reply';
  ideaId: string;
  ideaTitle: string;
  fromUsername: string;
  fromAvatar?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = 'community_notifications';

export const getCommunityNotifications = (): CommunityNotification[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

export const addCommunityNotification = (notification: Omit<CommunityNotification, 'id' | 'createdAt' | 'read'>): CommunityNotification => {
  const notifications = getCommunityNotifications();
  const newNotification: CommunityNotification = {
    ...notification,
    id: `notif-${Date.now()}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  
  notifications.unshift(newNotification);
  
  // Keep only last 50 notifications
  const trimmed = notifications.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  
  return newNotification;
};

export const markNotificationAsRead = (notificationId: string): void => {
  const notifications = getCommunityNotifications();
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const markAllNotificationsAsRead = (): void => {
  const notifications = getCommunityNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getUnreadCount = (): number => {
  const notifications = getCommunityNotifications();
  return notifications.filter(n => !n.read).length;
};

export const clearAllNotifications = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
