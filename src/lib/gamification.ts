/**
 * Gamification (reputation, levels, badges, rewards) — store scoped.
 * Config lives in app_configurations.gamification_config, points live in reputation_events.
 */

export type ReputationEventType =
  | 'idea_created'
  | 'vote_received'
  | 'vote_given'
  | 'comment_given'
  | 'order_paid'
  | 'daily_login';

export const REPUTATION_EVENTS: ReputationEventType[] = [
  'idea_created',
  'vote_received',
  'vote_given',
  'comment_given',
  'order_paid',
  'daily_login',
];

export type RewardId =
  | 'animated_banner'
  | 'animated_avatar'
  | 'profile_frame'
  | 'chat_badge'
  | 'custom_discount'
  | 'vip_content';

export const REWARD_OPTIONS: { id: RewardId; labelKey: string; fallback: string }[] = [
  { id: 'animated_banner', labelKey: 'gamification.rewards.animatedBanner', fallback: 'Animated banner (GIF)' },
  { id: 'animated_avatar', labelKey: 'gamification.rewards.animatedAvatar', fallback: 'Animated avatar (GIF)' },
  { id: 'profile_frame', labelKey: 'gamification.rewards.profileFrame', fallback: 'Profile frame / ranking highlight' },
  { id: 'chat_badge', labelKey: 'gamification.rewards.chatBadge', fallback: 'Badge in community chat' },
  { id: 'custom_discount', labelKey: 'gamification.rewards.customDiscount', fallback: 'Discount on customs' },
  { id: 'vip_content', labelKey: 'gamification.rewards.vipContent', fallback: 'Extra VIP content' },
];

export interface GamificationLevel {
  level: number;
  minPoints: number;
  title: string;
  icon: string;
  rewards: RewardId[];
}

export type BadgeConditionType = 'points' | 'level' | 'ideas' | 'votes_received' | 'comments' | 'orders';

export interface GamificationBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  condition: { type: BadgeConditionType; value: number };
}

export interface GamificationConfig {
  enabled: boolean;
  points: Record<ReputationEventType, number>;
  levels: GamificationLevel[];
  badges: GamificationBadge[];
}

export const DEFAULT_GAMIFICATION_CONFIG: GamificationConfig = {
  enabled: true,
  points: {
    idea_created: 25,
    vote_received: 10,
    vote_given: 2,
    comment_given: 5,
    order_paid: 50,
    daily_login: 3,
  },
  levels: [
    { level: 1, minPoints: 0, title: 'Novato', icon: '🌱', rewards: [] },
    { level: 2, minPoints: 50, title: 'Iniciante', icon: '🌿', rewards: [] },
    { level: 3, minPoints: 150, title: 'Participante', icon: '⭐', rewards: ['chat_badge'] },
    { level: 4, minPoints: 350, title: 'Colaborador', icon: '✨', rewards: ['chat_badge', 'profile_frame'] },
    { level: 5, minPoints: 600, title: 'Contribuidor', icon: '🔥', rewards: ['chat_badge', 'profile_frame', 'animated_avatar'] },
    { level: 6, minPoints: 1000, title: 'Expert', icon: '💫', rewards: ['chat_badge', 'profile_frame', 'animated_avatar', 'animated_banner'] },
    { level: 7, minPoints: 1500, title: 'Mestre', icon: '👑', rewards: ['chat_badge', 'profile_frame', 'animated_avatar', 'animated_banner'] },
    { level: 8, minPoints: 2500, title: 'Lenda', icon: '🏆', rewards: ['chat_badge', 'profile_frame', 'animated_avatar', 'animated_banner', 'custom_discount'] },
    { level: 9, minPoints: 4000, title: 'Elite', icon: '💎', rewards: ['chat_badge', 'profile_frame', 'animated_avatar', 'animated_banner', 'custom_discount', 'vip_content'] },
    { level: 10, minPoints: 6000, title: 'Supremo', icon: '🌟', rewards: ['chat_badge', 'profile_frame', 'animated_avatar', 'animated_banner', 'custom_discount', 'vip_content'] },
  ],
  badges: [
    { id: 'first_idea', name: 'Primeira Ideia', description: 'Criou sua primeira ideia', icon: '💡', enabled: true, condition: { type: 'ideas', value: 1 } },
    { id: 'first_comment', name: 'Primeiro Comentário', description: 'Fez seu primeiro comentário', icon: '💬', enabled: true, condition: { type: 'comments', value: 1 } },
    { id: 'popular_idea', name: 'Ideia Popular', description: 'Recebeu 10 votos', icon: '🔥', enabled: true, condition: { type: 'votes_received', value: 10 } },
    { id: 'active_commenter', name: 'Comentarista Ativo', description: 'Fez 25 comentários', icon: '📢', enabled: true, condition: { type: 'comments', value: 25 } },
    { id: 'idea_machine', name: 'Fábrica de Ideias', description: 'Criou 10 ideias', icon: '🏭', enabled: true, condition: { type: 'ideas', value: 10 } },
    { id: 'supporter', name: 'Apoiador', description: 'Comprou um custom', icon: '🤝', enabled: true, condition: { type: 'orders', value: 1 } },
    { id: 'community_star', name: 'Estrela da Comunidade', description: 'Alcançou o nível 5', icon: '⭐', enabled: true, condition: { type: 'level', value: 5 } },
    { id: 'legend', name: 'Lendário', description: 'Alcançou o nível 8', icon: '👑', enabled: true, condition: { type: 'level', value: 8 } },
  ],
};

export interface ReputationCounts {
  idea_created?: number;
  vote_received?: number;
  vote_given?: number;
  comment_given?: number;
  order_paid?: number;
  daily_login?: number;
}

export interface ReputationSummary {
  userId: string | null;
  totalPoints: number;
  counts: ReputationCounts;
  level: number;
  title: string;
  icon: string;
  nextLevelPoints: number | null;
  progressPercent: number;
  badges: GamificationBadge[];
  rewards: RewardId[];
  ideasCreated: number;
  votesReceived: number;
  commentsGiven: number;
  ordersPaid: number;
}

const sortedLevels = (config: GamificationConfig) =>
  [...(config.levels || [])].sort((a, b) => a.minPoints - b.minPoints);

export const resolveLevel = (points: number, config: GamificationConfig) => {
  const levels = sortedLevels(config);
  if (levels.length === 0) {
    return { current: { level: 1, minPoints: 0, title: 'Novato', icon: '🌱', rewards: [] as RewardId[] }, next: null };
  }
  let current = levels[0];
  let next: GamificationLevel | null = levels[1] || null;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].minPoints) {
      current = levels[i];
      next = levels[i + 1] || null;
      break;
    }
  }
  return { current, next };
};

export const buildReputationSummary = (
  userId: string | null,
  totalPoints: number,
  counts: ReputationCounts,
  config: GamificationConfig
): ReputationSummary => {
  const { current, next } = resolveLevel(totalPoints, config);
  const pointsInLevel = totalPoints - current.minPoints;
  const pointsNeeded = next ? next.minPoints - current.minPoints : 0;
  const progressPercent = next ? Math.min(100, Math.max(0, (pointsInLevel / Math.max(1, pointsNeeded)) * 100)) : 100;

  const ideasCreated = counts.idea_created || 0;
  const votesReceived = counts.vote_received || 0;
  const commentsGiven = counts.comment_given || 0;
  const ordersPaid = counts.order_paid || 0;

  const badges = (config.badges || []).filter((badge) => {
    if (!badge.enabled) return false;
    const { type, value } = badge.condition || { type: 'points', value: 0 };
    switch (type) {
      case 'points': return totalPoints >= value;
      case 'level': return current.level >= value;
      case 'ideas': return ideasCreated >= value;
      case 'votes_received': return votesReceived >= value;
      case 'comments': return commentsGiven >= value;
      case 'orders': return ordersPaid >= value;
      default: return false;
    }
  });

  // Rewards accumulate from all levels reached
  const rewards = Array.from(
    new Set(
      sortedLevels(config)
        .filter((l) => l.level <= current.level)
        .flatMap((l) => l.rewards || [])
    )
  ) as RewardId[];

  return {
    userId,
    totalPoints,
    counts,
    level: current.level,
    title: current.title,
    icon: current.icon,
    nextLevelPoints: next ? next.minPoints : null,
    progressPercent,
    badges,
    rewards,
    ideasCreated,
    votesReceived,
    commentsGiven,
    ordersPaid,
  };
};
