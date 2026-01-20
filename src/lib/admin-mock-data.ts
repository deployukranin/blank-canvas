/**
 * Admin Mock Data
 * Simulated data for admin panel - will be replaced with real database queries
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

// Mock Admin Users
export const mockAdminUsers: AdminUser[] = [
  {
    id: '0',
    email: 'ceo@whisperscape.com',
    username: 'CEO',
    isVIP: true,
    isAdmin: true,
    isCEO: true,
    createdAt: '2024-01-01',
    lastLogin: '2024-01-17',
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: '1',
    email: 'admin@whisperscape.com',
    username: 'Admin',
    isVIP: true,
    isAdmin: true,
    isCEO: false,
    createdAt: '2024-01-01',
    lastLogin: '2024-01-17',
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: '2',
    email: 'luna@email.com',
    username: 'Luna',
    isVIP: true,
    isAdmin: false,
    isCEO: false,
    createdAt: '2024-01-05',
    lastLogin: '2024-01-16',
    totalOrders: 5,
    totalSpent: 149.50,
  },
  {
    id: '3',
    email: 'carlos@email.com',
    username: 'Carlos M.',
    isVIP: false,
    isAdmin: false,
    isCEO: false,
    createdAt: '2024-01-10',
    lastLogin: '2024-01-15',
    totalOrders: 2,
    totalSpent: 44.90,
  },
  {
    id: '4',
    email: 'ana@email.com',
    username: 'Ana B.',
    isVIP: true,
    isAdmin: false,
    isCEO: false,
    createdAt: '2024-01-08',
    lastLogin: '2024-01-17',
    totalOrders: 8,
    totalSpent: 289.20,
  },
  {
    id: '5',
    email: 'pedro@email.com',
    username: 'Pedro',
    isVIP: false,
    isAdmin: false,
    isCEO: false,
    createdAt: '2024-01-12',
    lastLogin: '2024-01-14',
    totalOrders: 1,
    totalSpent: 29.90,
  },
];

// Mock Admin Orders (apenas vídeos e áudios personalizados)
export const mockAdminOrders: AdminOrder[] = [
  {
    id: 'ORD-001',
    userId: '2',
    userName: 'Luna',
    userEmail: 'luna@email.com',
    type: 'video',
    productName: 'Vídeo Personalizado - Roleplay',
    price: 69.90,
    status: 'pending',
    createdAt: '2024-01-17T10:30:00',
    details: 'Roleplay de loja de cristais, mencionar o nome Luna várias vezes',
  },
  {
    id: 'ORD-002',
    userId: '4',
    userName: 'Ana B.',
    userEmail: 'ana@email.com',
    type: 'audio',
    productName: 'Áudio Personalizado - Afirmações',
    price: 34.90,
    status: 'processing',
    createdAt: '2024-01-16T15:45:00',
    details: 'Afirmações para ansiedade, voz suave',
  },
  {
    id: 'ORD-003',
    userId: '3',
    userName: 'Carlos M.',
    userEmail: 'carlos@email.com',
    type: 'video',
    productName: 'Vídeo Personalizado - ASMR Clássico',
    price: 49.90,
    status: 'completed',
    createdAt: '2024-01-15T09:00:00',
    details: 'ASMR relaxante com sons de natureza',
  },
  {
    id: 'ORD-004',
    userId: '5',
    userName: 'Pedro',
    userEmail: 'pedro@email.com',
    type: 'audio',
    productName: 'Áudio Personalizado - Meditação',
    price: 39.90,
    status: 'pending',
    createdAt: '2024-01-17T08:00:00',
    details: 'Meditação guiada para dormir',
  },
];

// Mock Admin Reports
export const mockAdminReports: AdminReport[] = [
  {
    id: 'RPT-001',
    contentType: 'idea',
    contentId: '3',
    contentTitle: 'Tapping em diferentes texturas de madeira',
    reporterName: 'Usuário Anônimo',
    reason: 'Conteúdo duplicado',
    status: 'pending',
    createdAt: '2024-01-17T11:00:00',
  },
  {
    id: 'RPT-002',
    contentType: 'idea',
    contentId: '5',
    contentTitle: 'Unboxing de produtos de skincare',
    reporterName: 'Carlos M.',
    reason: 'Propaganda não autorizada',
    status: 'reviewed',
    createdAt: '2024-01-16T14:30:00',
  },
];

// Mock Stats
export const mockAdminStats: AdminStats = {
  totalUsers: 1247,
  totalVIP: 89,
  totalOrders: 342,
  revenue: 8456.80,
  pendingOrders: 2,
  pendingReports: 1,
  newUsersToday: 12,
  ideasCount: 156,
};
