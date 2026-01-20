/**
 * Push Notifications System
 * Handles real-time push notifications using Service Workers
 */

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

export type NotificationType = 
  | 'new_content'
  | 'comment_on_idea'
  | 'vote_on_idea'
  | 'level_up'
  | 'new_badge'
  | 'order_update'
  | 'promotion';

// Check if push notifications are supported
export const isPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

// Get current notification permission
export const getNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

// Register service worker for push notifications
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    
    console.log('[Push] Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('[Push] Service Worker registration failed:', error);
    return null;
  }
};

// Get or wait for service worker registration
export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) return null;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch {
    return null;
  }
};

// Send a local push notification (for testing and local events)
export const sendLocalNotification = async (
  type: NotificationType,
  data: PushNotificationData
): Promise<boolean> => {
  const permission = getNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('[Push] Notification permission not granted');
    return false;
  }
  
  try {
    const registration = await getServiceWorkerRegistration();
    
    if (registration) {
      // Use service worker for notification
      const notificationOptions: NotificationOptions & { 
        vibrate?: number[]; 
        actions?: Array<{ action: string; title: string; icon?: string }>;
        requireInteraction?: boolean;
      } = {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-192.png',
        tag: data.tag || type,
        data: {
          url: data.url || '/',
          type,
          ...data.data,
        },
        requireInteraction: type === 'order_update',
        vibrate: [200, 100, 200],
        silent: false,
      };
      
      // Add actions if provided (for service worker notifications)
      if (data.actions && data.actions.length > 0) {
        notificationOptions.actions = data.actions;
      }
      
      await registration.showNotification(data.title, notificationOptions);
      
      console.log('[Push] Notification sent via Service Worker');
      return true;
    } else {
      // Fallback to regular notification
      new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        tag: data.tag || type,
        data: {
          url: data.url || '/',
          type,
          ...data.data,
        },
      });
      
      console.log('[Push] Notification sent via Notification API');
      return true;
    }
  } catch (error) {
    console.error('[Push] Failed to send notification:', error);
    return false;
  }
};

// Queue notification if permission not granted (will show when granted)
const PENDING_NOTIFICATIONS_KEY = 'pending_push_notifications';

export const queueNotification = (type: NotificationType, data: PushNotificationData): void => {
  const pending = getPendingNotifications();
  pending.push({ type, data, queuedAt: new Date().toISOString() });
  localStorage.setItem(PENDING_NOTIFICATIONS_KEY, JSON.stringify(pending.slice(-20)));
};

export const getPendingNotifications = (): Array<{ type: NotificationType; data: PushNotificationData; queuedAt: string }> => {
  const stored = localStorage.getItem(PENDING_NOTIFICATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

export const clearPendingNotifications = (): void => {
  localStorage.removeItem(PENDING_NOTIFICATIONS_KEY);
};

export const processPendingNotifications = async (): Promise<void> => {
  const pending = getPendingNotifications();
  
  for (const notification of pending) {
    await sendLocalNotification(notification.type, notification.data);
  }
  
  clearPendingNotifications();
};

// Notification creators for different event types
export const notifyNewContent = async (title: string, contentType: string): Promise<boolean> => {
  const data: PushNotificationData = {
    title: `Novo ${contentType}! 🎉`,
    body: title,
    url: contentType === 'vídeo' ? '/videos' : contentType === 'áudio' ? '/audios' : '/',
    tag: `new_content_${Date.now()}`,
  };
  
  return sendLocalNotification('new_content', data);
};

export const notifyCommentOnIdea = async (
  ideaTitle: string, 
  commenterUsername: string
): Promise<boolean> => {
  const data: PushNotificationData = {
    title: 'Novo comentário 💬',
    body: `@${commenterUsername} comentou na sua ideia: "${ideaTitle}"`,
    url: '/comunidade',
    tag: `comment_${Date.now()}`,
  };
  
  return sendLocalNotification('comment_on_idea', data);
};

export const notifyVoteOnIdea = async (
  ideaTitle: string,
  voterUsername: string
): Promise<boolean> => {
  const data: PushNotificationData = {
    title: 'Novo voto! 👍',
    body: `@${voterUsername} votou na sua ideia: "${ideaTitle}"`,
    url: '/comunidade',
    tag: `vote_${Date.now()}`,
  };
  
  return sendLocalNotification('vote_on_idea', data);
};

export const notifyLevelUp = async (
  newLevel: number,
  levelTitle: string
): Promise<boolean> => {
  const data: PushNotificationData = {
    title: 'Subiu de nível! 🎉',
    body: `Você alcançou o nível ${newLevel}: ${levelTitle}!`,
    url: '/perfil',
    tag: `levelup_${newLevel}`,
  };
  
  return sendLocalNotification('level_up', data);
};

export const notifyNewBadge = async (
  badgeName: string,
  badgeIcon: string
): Promise<boolean> => {
  const data: PushNotificationData = {
    title: 'Nova conquista! 🏆',
    body: `Você desbloqueou: ${badgeIcon} ${badgeName}`,
    url: '/perfil',
    tag: `badge_${badgeName}`,
  };
  
  return sendLocalNotification('new_badge', data);
};

export const notifyOrderUpdate = async (
  orderId: string,
  status: string,
  message: string
): Promise<boolean> => {
  const data: PushNotificationData = {
    title: `Pedido ${status} 📦`,
    body: message,
    url: '/meus-pedidos',
    tag: `order_${orderId}`,
    actions: [
      { action: 'view', title: 'Ver pedido' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };
  
  return sendLocalNotification('order_update', data);
};
