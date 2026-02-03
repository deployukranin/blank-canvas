/**
 * Admin Type Definitions
 * Data arrays have been removed for production - use database queries instead
 */

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  isVIP: boolean;
  isAdmin: boolean;
  isCEO: boolean;
  createdAt: string;
  lastLogin: string;
  totalOrders: number;
  totalSpent: number;
}

export interface AdminOrder {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'video' | 'audio';
  productName: string;
  price: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  details?: string;
  videoUrl?: string;
}

export interface AdminReport {
  id: string;
  contentType: 'idea' | 'user' | 'comment';
  contentId: string;
  contentTitle: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalVIP: number;
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
  pendingReports: number;
  newUsersToday: number;
  ideasCount: number;
}
