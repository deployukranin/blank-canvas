/**
 * Order Store - Local storage management for user orders
 * In the future, this will sync with the database
 */

export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered';

export interface VideoOrder {
  id: string;
  type: 'video';
  category: string;
  categoryName: string;
  categoryIcon?: string;
  duration: number;
  durationLabel: string;
  price: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  videoUrl?: string;
  personalization: {
    name: string;
    triggers?: string;
    script?: string;
    observations?: string;
  };
}

export interface AudioOrder {
  id: string;
  type: 'audio';
  category: string;
  price: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  audioUrl?: string;
  personalization: {
    name: string;
    preferences?: string;
  };
}

export type Order = VideoOrder | AudioOrder;

const ORDERS_KEY = 'user_orders';
const NOTIFICATION_QUEUE_KEY = 'notification_queue';

// Get all orders
export const getOrders = (): Order[] => {
  const stored = localStorage.getItem(ORDERS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

// Save orders
export const saveOrders = (orders: Order[]): void => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

// Add a new order
export const addOrder = <T extends Order>(order: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T => {
  const orders = getOrders();
  const newOrder = {
    ...order,
    id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as T;
  
  orders.unshift(newOrder);
  saveOrders(orders);
  
  return newOrder;
};

// Update order status
export const updateOrderStatus = (orderId: string, status: OrderStatus, extras?: Record<string, unknown>): Order | null => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  
  if (index === -1) return null;
  
  const currentOrder = orders[index];
  
  if (currentOrder.type === 'video') {
    orders[index] = {
      ...currentOrder,
      ...extras,
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'delivered' && { deliveredAt: new Date().toISOString() }),
    } as VideoOrder;
  } else {
    orders[index] = {
      ...currentOrder,
      ...extras,
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'delivered' && { deliveredAt: new Date().toISOString() }),
    } as AudioOrder;
  }
  
  saveOrders(orders);
  
  // If status changed to 'ready', queue notification
  if (status === 'ready') {
    queueNotification({
      orderId,
      type: orders[index].type,
      title: orders[index].type === 'video' ? 'Seu vídeo está pronto! 🎉' : 'Seu áudio está pronto! 🎉',
      body: `O pedido ${orderId} foi concluído e está disponível para você.`,
    });
  }
  
  return orders[index];
};

// Get order by ID
export const getOrderById = (orderId: string): Order | undefined => {
  return getOrders().find(o => o.id === orderId);
};

// Get orders by status
export const getOrdersByStatus = (status: OrderStatus): Order[] => {
  return getOrders().filter(o => o.status === status);
};

// Get pending orders count
export const getPendingOrdersCount = (): number => {
  return getOrders().filter(o => o.status !== 'delivered').length;
};

// Notification queue
interface QueuedNotification {
  orderId: string;
  type: 'video' | 'audio';
  title: string;
  body: string;
  timestamp: string;
  sent: boolean;
}

export const queueNotification = (notification: Omit<QueuedNotification, 'timestamp' | 'sent'>): void => {
  const queue = getNotificationQueue();
  queue.push({
    ...notification,
    timestamp: new Date().toISOString(),
    sent: false,
  });
  localStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(queue));
};

export const getNotificationQueue = (): QueuedNotification[] => {
  const stored = localStorage.getItem(NOTIFICATION_QUEUE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const markNotificationSent = (orderId: string): void => {
  const queue = getNotificationQueue();
  const updated = queue.map(n => 
    n.orderId === orderId ? { ...n, sent: true } : n
  );
  localStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(updated));
};

export const getPendingNotifications = (): QueuedNotification[] => {
  return getNotificationQueue().filter(n => !n.sent);
};

// Status labels for display
export const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    in_production: 'Em Produção',
    ready: 'Pronto',
    delivered: 'Entregue',
  };
  return labels[status];
};

export const getStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    pending: 'text-yellow-500 bg-yellow-500/10',
    confirmed: 'text-blue-500 bg-blue-500/10',
    in_production: 'text-purple-500 bg-purple-500/10',
    ready: 'text-green-500 bg-green-500/10',
    delivered: 'text-muted-foreground bg-muted/10',
  };
  return colors[status];
};

// Deliver video to order
export const deliverVideo = (orderId: string, videoUrl: string): Order | null => {
  return updateOrderStatus(orderId, 'ready', { videoUrl });
};
