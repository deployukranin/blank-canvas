/**
 * Type Definitions for Application Data
 * Data arrays have been removed for production - use database queries instead
 */

export interface VideoIdea {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: 'active' | 'removed' | 'reported';
  authorName: string;
  createdAt: string;
  hasVoted?: boolean;
}

export interface DigitalSubscription {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  features: string[];
  popular?: boolean;
}

export interface VIPBenefit {
  icon: string;
  title: string;
  description: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
}

export interface FeedPost {
  id: string;
  type: 'announcement' | 'news' | 'exclusive';
  title: string;
  content: string;
  createdAt: string;
  isPinned?: boolean;
  authorUsername: string;
  authorAvatar?: string;
  authorId?: string;
}

export interface ForumComment {
  id: string;
  ideaId: string;
  content: string;
  authorUsername: string;
  authorAvatar?: string;
  authorId?: string;
  createdAt: string;
}

export interface ForumIdea {
  id: string;
  title: string;
  description: string;
  votes: number;
  authorUsername: string;
  authorAvatar?: string;
  authorId?: string;
  createdAt: string;
  commentsCount: number;
  comments?: ForumComment[];
}

// VIP Benefits - keeping this as it's static configuration
export const mockVIPBenefits: VIPBenefit[] = [
  {
    icon: '👑',
    title: 'Cargo VIP no Discord',
    description: 'Destaque-se com um cargo exclusivo e acesso a canais especiais',
  },
  {
    icon: '🎬',
    title: 'Vídeos Antecipados',
    description: 'Assista aos vídeos 24h antes de todo mundo',
  },
  {
    icon: '💬',
    title: 'Chat Exclusivo',
    description: 'Acesso ao chat VIP para conversar diretamente comigo',
  },
  {
    icon: '🎁',
    title: 'Sorteios Mensais',
    description: 'Participe de sorteios exclusivos todos os meses',
  },
  {
    icon: '🎧',
    title: 'Áudios Exclusivos',
    description: 'Conteúdo de áudio ASMR só para membros VIP',
  },
  {
    icon: '📝',
    title: 'Prioridade em Sugestões',
    description: 'Suas ideias de vídeo têm prioridade na produção',
  },
];

// Custom Video Categories - keeping as static configuration
export const mockVideoCategories: CustomCategory[] = [
  {
    id: 'relaxation',
    name: 'Relaxamento',
    description: 'Vídeos focados em relaxamento profundo e sono',
    icon: '😌',
    basePrice: 49.90,
  },
  {
    id: 'personalized-name',
    name: 'Nome Personalizado',
    description: 'Vídeo sussurrando seu nome de forma especial',
    icon: '💫',
    basePrice: 39.90,
  },
  {
    id: 'roleplay',
    name: 'Roleplay',
    description: 'Situações imersivas e personagens',
    icon: '🎭',
    basePrice: 69.90,
  },
  {
    id: 'triggers',
    name: 'Triggers Específicos',
    description: 'Seus triggers favoritos compilados',
    icon: '✨',
    basePrice: 44.90,
  },
];

// Custom Audio Categories - keeping as static configuration
export const mockAudioCategories: CustomCategory[] = [
  {
    id: 'whispers',
    name: 'Sussurros',
    description: 'Áudio de sussurros personalizados',
    icon: '🤫',
    basePrice: 29.90,
  },
  {
    id: 'affirmations',
    name: 'Afirmações',
    description: 'Afirmações positivas personalizadas',
    icon: '💝',
    basePrice: 34.90,
  },
  {
    id: 'sleep',
    name: 'Para Dormir',
    description: 'Áudios longos para ajudar no sono',
    icon: '🌙',
    basePrice: 39.90,
  },
  {
    id: 'sounds',
    name: 'Sons Específicos',
    description: 'Tapping, scratching, crinkling, etc.',
    icon: '🎵',
    basePrice: 24.90,
  },
];
