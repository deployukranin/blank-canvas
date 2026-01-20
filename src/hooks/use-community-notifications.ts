import { useState, useEffect, useCallback } from 'react';
import { 
  getCommunityNotifications, 
  addCommunityNotification, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadCount,
  clearAllNotifications,
  type CommunityNotification 
} from '@/lib/community-notifications';

export const useCommunityNotifications = () => {
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    setNotifications(getCommunityNotifications());
    setUnreadCount(getUnreadCount());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addNotification = useCallback((notification: Omit<CommunityNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif = addCommunityNotification(notification);
    refresh();
    return newNotif;
  }, [refresh]);

  const markAsRead = useCallback((id: string) => {
    markNotificationAsRead(id);
    refresh();
  }, [refresh]);

  const markAllAsRead = useCallback(() => {
    markAllNotificationsAsRead();
    refresh();
  }, [refresh]);

  const clearAll = useCallback(() => {
    clearAllNotifications();
    refresh();
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh,
  };
};
