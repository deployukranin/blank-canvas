/**
 * User Reputation & Levels System
 * Tracks user activity and calculates reputation based on:
 * - Votes received on ideas
 * - Comments made
 * - Ideas created
 * - Community participation
 */

export interface UserReputation {
  username: string;
  level: number;
  title: string;
  totalPoints: number;
  votesReceived: number;
  commentsGiven: number;
  ideasCreated: number;
  daysActive: number;
  badges: Badge[];
  nextLevelPoints: number;
  progressPercent: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface ReputationActivity {
  type: 'vote_received' | 'comment_given' | 'idea_created' | 'daily_login';
  points: number;
  timestamp: string;
  relatedId?: string;
}

// Points configuration
const POINTS_CONFIG = {
  vote_received: 10,      // Someone voted on your idea
  comment_given: 5,       // You commented on an idea
  idea_created: 25,       // You created a new idea
  daily_login: 3,         // Daily participation bonus
};

// Level thresholds and titles
const LEVELS = [
  { level: 1, minPoints: 0, title: 'Novato', icon: '🌱' },
  { level: 2, minPoints: 50, title: 'Iniciante', icon: '🌿' },
  { level: 3, minPoints: 150, title: 'Participante', icon: '⭐' },
  { level: 4, minPoints: 350, title: 'Colaborador', icon: '✨' },
  { level: 5, minPoints: 600, title: 'Contribuidor', icon: '🔥' },
  { level: 6, minPoints: 1000, title: 'Expert', icon: '💫' },
  { level: 7, minPoints: 1500, title: 'Mestre', icon: '👑' },
  { level: 8, minPoints: 2500, title: 'Lenda', icon: '🏆' },
  { level: 9, minPoints: 4000, title: 'Elite', icon: '💎' },
  { level: 10, minPoints: 6000, title: 'Supremo', icon: '🌟' },
];

// Available badges
const BADGES: Badge[] = [
  { id: 'first_idea', name: 'Primeira Ideia', description: 'Criou sua primeira ideia', icon: '💡' },
  { id: 'first_comment', name: 'Primeiro Comentário', description: 'Fez seu primeiro comentário', icon: '💬' },
  { id: 'popular_idea', name: 'Ideia Popular', description: 'Uma ideia sua recebeu 10+ votos', icon: '🔥' },
  { id: 'active_commenter', name: 'Comentarista Ativo', description: 'Fez 25+ comentários', icon: '📢' },
  { id: 'idea_machine', name: 'Fábrica de Ideias', description: 'Criou 10+ ideias', icon: '🏭' },
  { id: 'week_streak', name: 'Semana Ativa', description: '7 dias consecutivos de participação', icon: '📅' },
  { id: 'community_star', name: 'Estrela da Comunidade', description: 'Alcançou nível 5+', icon: '⭐' },
  { id: 'legend', name: 'Lendário', description: 'Alcançou nível 8+', icon: '👑' },
];

const STORAGE_KEY = 'user_reputation_data';
const ACTIVITY_KEY = 'user_reputation_activities';

// Get stored reputation data
export const getReputationData = (): Record<string, UserReputation> => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
};

// Save reputation data
const saveReputationData = (data: Record<string, UserReputation>): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Get activity log
export const getActivityLog = (username: string): ReputationActivity[] => {
  const stored = localStorage.getItem(`${ACTIVITY_KEY}_${username}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

// Save activity log
const saveActivityLog = (username: string, activities: ReputationActivity[]): void => {
  localStorage.setItem(`${ACTIVITY_KEY}_${username}`, JSON.stringify(activities.slice(-100)));
};

// Calculate level from points
const calculateLevel = (points: number): { level: number; title: string; icon: string; nextLevelPoints: number; progressPercent: number } => {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];
  
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }
  
  const pointsInLevel = points - currentLevel.minPoints;
  const pointsNeeded = nextLevel.minPoints - currentLevel.minPoints;
  const progressPercent = currentLevel.level === 10 ? 100 : Math.min(100, (pointsInLevel / pointsNeeded) * 100);
  
  return {
    level: currentLevel.level,
    title: currentLevel.title,
    icon: currentLevel.icon,
    nextLevelPoints: nextLevel.minPoints,
    progressPercent,
  };
};

// Initialize or get user reputation
export const getUserReputation = (username: string): UserReputation => {
  const allData = getReputationData();
  
  if (allData[username]) {
    // Recalculate level in case config changed
    const levelInfo = calculateLevel(allData[username].totalPoints);
    return {
      ...allData[username],
      ...levelInfo,
    };
  }
  
  // Create new user reputation
  const newReputation: UserReputation = {
    username,
    level: 1,
    title: LEVELS[0].title,
    totalPoints: 0,
    votesReceived: 0,
    commentsGiven: 0,
    ideasCreated: 0,
    daysActive: 1,
    badges: [],
    nextLevelPoints: LEVELS[1].minPoints,
    progressPercent: 0,
  };
  
  allData[username] = newReputation;
  saveReputationData(allData);
  
  return newReputation;
};

// Add points and activity
export const addReputationPoints = (
  username: string, 
  type: ReputationActivity['type'],
  relatedId?: string
): { newPoints: number; levelUp: boolean; newBadges: Badge[] } => {
  const allData = getReputationData();
  let reputation = allData[username] || getUserReputation(username);
  
  const points = POINTS_CONFIG[type];
  const oldLevel = reputation.level;
  
  // Update points and counters
  reputation.totalPoints += points;
  
  switch (type) {
    case 'vote_received':
      reputation.votesReceived++;
      break;
    case 'comment_given':
      reputation.commentsGiven++;
      break;
    case 'idea_created':
      reputation.ideasCreated++;
      break;
    case 'daily_login':
      reputation.daysActive++;
      break;
  }
  
  // Recalculate level
  const levelInfo = calculateLevel(reputation.totalPoints);
  reputation = { ...reputation, ...levelInfo };
  
  // Check for new badges
  const newBadges: Badge[] = [];
  const existingBadgeIds = reputation.badges.map(b => b.id);
  
  // Badge checks
  if (reputation.ideasCreated >= 1 && !existingBadgeIds.includes('first_idea')) {
    const badge = { ...BADGES.find(b => b.id === 'first_idea')!, unlockedAt: new Date().toISOString() };
    reputation.badges.push(badge);
    newBadges.push(badge);
  }
  
  if (reputation.commentsGiven >= 1 && !existingBadgeIds.includes('first_comment')) {
    const badge = { ...BADGES.find(b => b.id === 'first_comment')!, unlockedAt: new Date().toISOString() };
    reputation.badges.push(badge);
    newBadges.push(badge);
  }
  
  if (reputation.votesReceived >= 10 && !existingBadgeIds.includes('popular_idea')) {
    const badge = { ...BADGES.find(b => b.id === 'popular_idea')!, unlockedAt: new Date().toISOString() };
    reputation.badges.push(badge);
    newBadges.push(badge);
  }
  
  if (reputation.commentsGiven >= 25 && !existingBadgeIds.includes('active_commenter')) {
    const badge = { ...BADGES.find(b => b.id === 'active_commenter')!, unlockedAt: new Date().toISOString() };
    reputation.badges.push(badge);
    newBadges.push(badge);
  }
  
  if (reputation.ideasCreated >= 10 && !existingBadgeIds.includes('idea_machine')) {
    const badge = { ...BADGES.find(b => b.id === 'idea_machine')!, unlockedAt: new Date().toISOString() };
    reputation.badges.push(badge);
    newBadges.push(badge);
  }
  
  if (reputation.level >= 5 && !existingBadgeIds.includes('community_star')) {
    const badge = { ...BADGES.find(b => b.id === 'community_star')!, unlockedAt: new Date().toISOString() };
    reputation.badges.push(badge);
    newBadges.push(badge);
  }
  
  if (reputation.level >= 8 && !existingBadgeIds.includes('legend')) {
    const badge = { ...BADGES.find(b => b.id === 'legend')!, unlockedAt: new Date().toISOString() };
    reputation.badges.push(badge);
    newBadges.push(badge);
  }
  
  // Save updated reputation
  allData[username] = reputation;
  saveReputationData(allData);
  
  // Save activity
  const activities = getActivityLog(username);
  activities.push({
    type,
    points,
    timestamp: new Date().toISOString(),
    relatedId,
  });
  saveActivityLog(username, activities);
  
  return {
    newPoints: points,
    levelUp: reputation.level > oldLevel,
    newBadges,
  };
};

// Get leaderboard
export const getLeaderboard = (limit = 10): UserReputation[] => {
  const allData = getReputationData();
  return Object.values(allData)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, limit);
};

// Get all badges (for display)
export const getAllBadges = (): Badge[] => BADGES;

// Get all levels (for display)
export const getAllLevels = (): typeof LEVELS => LEVELS;

// Get level info by level number
export const getLevelInfo = (level: number) => LEVELS.find(l => l.level === level) || LEVELS[0];
