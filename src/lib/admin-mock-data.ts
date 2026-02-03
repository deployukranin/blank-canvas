/**
 * Admin Type Definitions
 * Interfaces for admin panel data structures
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

// Empty arrays for backward compatibility (no mock data)
export const mockAdminUsers: AdminUser[] = [];
export const mockAdminOrders: AdminOrder[] = [];
export const mockAdminReports: AdminReport[] = [];

// Empty stats for backward compatibility
export const mockAdminStats: AdminStats = {
  totalUsers: 0,
  totalVIP: 0,
  totalOrders: 0,
  revenue: 0,
  pendingOrders: 0,
  pendingReports: 0,
  newUsersToday: 0,
  ideasCount: 0,
};
