import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  processPendingNotifications,
  sendLocalNotification,
  notifyCommentOnIdea,
  notifyVoteOnIdea,
  notifyLevelUp,
  notifyNewBadge,
  notifyNewContent,
  notifyOrderUpdate,
  type NotificationType,
  type PushNotificationData,
} from '@/lib/push-notifications';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isRegistered: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  sendNotification: (type: NotificationType, data: PushNotificationData) => Promise<boolean>;
  notifyComment: (ideaTitle: string, commenterUsername: string) => Promise<boolean>;
  notifyVote: (ideaTitle: string, voterUsername: string) => Promise<boolean>;
  notifyLevelUp: (newLevel: number, levelTitle: string) => Promise<boolean>;
  notifyBadge: (badgeName: string, badgeIcon: string) => Promise<boolean>;
  notifyContent: (title: string, contentType: string) => Promise<boolean>;
  notifyOrder: (orderId: string, status: string, message: string) => Promise<boolean>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [isSupported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRegistered, setIsRegistered] = useState(false);

  // Initialize on mount
  useEffect(() => {
    if (!isSupported) return;

    // Get current permission
    setPermission(getNotificationPermission());

    // Register service worker
    registerServiceWorker().then(registration => {
      if (registration) {
        setIsRegistered(true);
        
        // Process any pending notifications if permission was previously granted
        if (getNotificationPermission() === 'granted') {
          processPendingNotifications();
        }
      }
    });
  }, [isSupported]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';

    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);

    // If granted, process pending notifications and register SW
    if (newPermission === 'granted') {
      await processPendingNotifications();
      
      if (!isRegistered) {
        const registration = await registerServiceWorker();
        if (registration) {
          setIsRegistered(true);
        }
      }
    }

    return newPermission;
  }, [isSupported, isRegistered]);

  // Generic send notification
  const sendNotification = useCallback(async (
    type: NotificationType, 
    data: PushNotificationData
  ): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') return false;
    return sendLocalNotification(type, data);
  }, [isSupported, permission]);

  // Convenience methods
  const notifyComment = useCallback(async (
    ideaTitle: string, 
    commenterUsername: string
  ): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') return false;
    return notifyCommentOnIdea(ideaTitle, commenterUsername);
  }, [isSupported, permission]);

  const notifyVote = useCallback(async (
    ideaTitle: string, 
    voterUsername: string
  ): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') return false;
    return notifyVoteOnIdea(ideaTitle, voterUsername);
  }, [isSupported, permission]);

  const handleNotifyLevelUp = useCallback(async (
    newLevel: number, 
    levelTitle: string
  ): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') return false;
    return notifyLevelUp(newLevel, levelTitle);
  }, [isSupported, permission]);

  const handleNotifyBadge = useCallback(async (
    badgeName: string, 
    badgeIcon: string
  ): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') return false;
    return notifyNewBadge(badgeName, badgeIcon);
  }, [isSupported, permission]);

  const notifyContent = useCallback(async (
    title: string, 
    contentType: string
  ): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') return false;
    return notifyNewContent(title, contentType);
  }, [isSupported, permission]);

  const notifyOrder = useCallback(async (
    orderId: string, 
    status: string, 
    message: string
  ): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') return false;
    return notifyOrderUpdate(orderId, status, message);
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    isRegistered,
    requestPermission,
    sendNotification,
    notifyComment,
    notifyVote,
    notifyLevelUp: handleNotifyLevelUp,
    notifyBadge: handleNotifyBadge,
    notifyContent,
    notifyOrder,
  };
};
