/**
 * Mock Data for MVP
 * This data will be replaced with real database queries in the future
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
  authorId?: string; // For real users with handles
}

export interface ForumComment {
  id: string;
  ideaId: string;
  content: string;
  authorUsername: string;
  authorAvatar?: string;
  authorId?: string; // For real users with handles
  createdAt: string;
}

export interface ForumIdea {
  id: string;
  title: string;
  description: string;
  votes: number;
  authorUsername: string;
  authorAvatar?: string;
  authorId?: string; // For real users with handles
  createdAt: string;
  commentsCount: number;
  comments?: ForumComment[];
}

// Mock Video Ideas
export const mockVideoIdeas: VideoIdea[] = [
  {
    id: '1',
    title: 'ASMR chuva na janela com digitação suave',
    description: 'Um vídeo relaxante combinando sons de chuva batendo na janela com digitação suave no teclado. Perfeito para estudar ou dormir.',
    votes: 47,
    status: 'active',
    authorName: 'Luna',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Roleplay: Bibliotecária organizando livros',
    description: 'ASMR de roleplay com sons de páginas virando, sussurros e organização de livros antigos.',
    votes: 32,
    status: 'active',
    authorName: 'Carlos M.',
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    title: 'Tapping em diferentes texturas de madeira',
    description: 'Explorar diferentes tipos de madeira com tapping suave - carvalho, pinho, bambu, etc.',
    votes: 28,
    status: 'active',
    authorName: 'Ana B.',
    createdAt: '2024-01-13',
  },
  {
    id: '4',
    title: 'ASMR de desenho com lápis de cor',
    description: 'Som relaxante de lápis de cor desenhando em papel texturizado, com sussurros explicando o desenho.',
    votes: 41,
    status: 'active',
    authorName: 'Pedro',
    createdAt: '2024-01-12',
  },
  {
    id: '5',
    title: 'Unboxing de produtos de skincare (sussurrado)',
    description: 'ASMR de unboxing com muitos crinkles, tapping em embalagens e sussurros sobre cada produto.',
    votes: 19,
    status: 'active',
    authorName: 'Mariana',
    createdAt: '2024-01-11',
  },
];

// Mock Digital Subscriptions
export const mockSubscriptions: DigitalSubscription[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    description: 'Acesso completo ao catálogo de filmes e séries',
    price: 29.90,
    originalPrice: 55.90,
    image: '/placeholder.svg',
    features: ['Catálogo completo', '4 telas simultâneas', 'Qualidade 4K', 'Downloads ilimitados'],
    popular: true,
  },
  {
    id: 'spotify',
    name: 'Spotify Premium',
    description: 'Músicas e podcasts sem anúncios',
    price: 14.90,
    originalPrice: 21.90,
    image: '/placeholder.svg',
    features: ['Sem anúncios', 'Downloads offline', 'Qualidade máxima', 'Spotify Connect'],
  },
  {
    id: 'youtube',
    name: 'YouTube Premium',
    description: 'Vídeos sem anúncios + YouTube Music',
    price: 19.90,
    originalPrice: 29.99,
    image: '/placeholder.svg',
    features: ['Sem anúncios', 'YouTube Music', 'Downloads', 'Reprodução em segundo plano'],
  },
  {
    id: 'disney',
    name: 'Disney+',
    description: 'Disney, Marvel, Star Wars e muito mais',
    price: 24.90,
    originalPrice: 43.90,
    image: '/placeholder.svg',
    features: ['Catálogo completo', 'Originais exclusivos', '4 telas', 'Downloads'],
  },
  {
    id: 'hbo',
    name: 'Max (HBO)',
    description: 'Séries premiadas e filmes exclusivos',
    price: 27.90,
    originalPrice: 49.90,
    image: '/placeholder.svg',
    features: ['HBO Originals', 'Warner Bros', 'Discovery+', 'Qualidade 4K'],
  },
  {
    id: 'prime',
    name: 'Amazon Prime',
    description: 'Prime Video + benefícios Amazon',
    price: 12.90,
    originalPrice: 19.90,
    image: '/placeholder.svg',
    features: ['Prime Video', 'Frete grátis', 'Prime Gaming', 'Prime Reading'],
  },
];

// Mock VIP Benefits
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

// Mock Custom Video Categories
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

// Mock Custom Audio Categories
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

// Mock Feed Posts (Avisos)
export const mockFeedPosts: FeedPost[] = [
  {
    id: '1',
    type: 'announcement',
    title: '🎉 Novo horário de lives!',
    content: 'A partir de agora, nossas lives serão toda sexta-feira às 21h! Marquem na agenda e venham relaxar comigo.',
    createdAt: '2024-01-16T18:00:00',
    isPinned: true,
    authorUsername: 'luna_asmr',
    authorAvatar: '🌙',
  },
  {
    id: '2',
    type: 'news',
    title: 'Novo microfone chegou! 🎙️',
    content: 'Finalmente chegou o microfone novo que vocês tanto pediram. Os próximos vídeos vão ter uma qualidade de áudio incrível. Mal posso esperar para vocês ouvirem!',
    createdAt: '2024-01-15T14:30:00',
    authorUsername: 'luna_asmr',
    authorAvatar: '🌙',
  },
  {
    id: '3',
    type: 'exclusive',
    title: '✨ Prévia do vídeo de amanhã',
    content: 'Para os VIPs: o vídeo de amanhã vai ser um roleplay de loja de cristais! Vocês vão amar os sons das pedras.',
    createdAt: '2024-01-14T20:00:00',
    authorUsername: 'luna_asmr',
    authorAvatar: '🌙',
  },
  {
    id: '4',
    type: 'news',
    title: 'Obrigada por 100k! 💜',
    content: 'Não tenho palavras para agradecer o carinho de vocês. 100 mil inscritos é um sonho realizado. Vem conteúdo especial por aí!',
    createdAt: '2024-01-13T16:00:00',
    authorUsername: 'luna_asmr',
    authorAvatar: '🌙',
  },
];

// Mock Forum Ideas (Ideias da comunidade)
export const mockForumIdeas: ForumIdea[] = [
  {
    id: '1',
    title: 'ASMR chuva na janela com digitação suave',
    description: 'Um vídeo relaxante combinando sons de chuva batendo na janela com digitação suave no teclado. Perfeito para estudar ou dormir.',
    votes: 47,
    authorUsername: 'relaxed_user',
    authorAvatar: '😴',
    createdAt: '2024-01-15T10:00:00',
    commentsCount: 2,
    comments: [
      {
        id: 'c1',
        ideaId: '1',
        content: 'Adorei essa ideia! Chuva + digitação seria perfeito para estudar.',
        authorUsername: 'study_lover',
        authorAvatar: '📖',
        createdAt: '2024-01-15T12:00:00',
      },
      {
        id: 'c2',
        ideaId: '1',
        content: 'Apoio total! Combina muito bem esses dois sons.',
        authorUsername: 'sleepy_head',
        authorAvatar: '😪',
        createdAt: '2024-01-15T14:30:00',
      },
    ],
  },
  {
    id: '2',
    title: 'Roleplay: Bibliotecária organizando livros',
    description: 'ASMR de roleplay com sons de páginas virando, sussurros e organização de livros antigos.',
    votes: 32,
    authorUsername: 'book_lover',
    authorAvatar: '📚',
    createdAt: '2024-01-14T15:30:00',
    commentsCount: 1,
    comments: [
      {
        id: 'c3',
        ideaId: '2',
        content: 'Biblioteca é meu cenário favorito de ASMR!',
        authorUsername: 'quiet_reader',
        authorAvatar: '🤫',
        createdAt: '2024-01-14T18:00:00',
      },
    ],
  },
  {
    id: '3',
    title: 'Tapping em diferentes texturas de madeira',
    description: 'Explorar diferentes tipos de madeira com tapping suave - carvalho, pinho, bambu, etc.',
    votes: 28,
    authorUsername: 'tingle_fan',
    authorAvatar: '✨',
    createdAt: '2024-01-13T20:00:00',
    commentsCount: 0,
    comments: [],
  },
  {
    id: '4',
    title: 'ASMR de desenho com lápis de cor',
    description: 'Som relaxante de lápis de cor desenhando em papel texturizado, com sussurros explicando o desenho.',
    votes: 41,
    authorUsername: 'art_whisper',
    authorAvatar: '🎨',
    createdAt: '2024-01-12T18:45:00',
    commentsCount: 1,
    comments: [
      {
        id: 'c4',
        ideaId: '4',
        content: 'Seria incrível ver o desenho sendo feito enquanto ouve os sons!',
        authorUsername: 'creative_soul',
        authorAvatar: '🎨',
        createdAt: '2024-01-12T20:00:00',
      },
    ],
  },
];
