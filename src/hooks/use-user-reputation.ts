import { useState, useEffect, useCallback } from 'react';
import {
  getUserReputation,
  addReputationPoints,
  getLeaderboard,
  getAllBadges,
  getAllLevels,
  type UserReputation,
  type Badge,
  type ReputationActivity,
} from '@/lib/user-reputation';
import { usePushNotifications } from './use-push-notifications';
import { useToast } from './use-toast';

interface UseUserReputationReturn {
  reputation: UserReputation | null;
  leaderboard: UserReputation[];
  allBadges: Badge[];
  allLevels: ReturnType<typeof getAllLevels>;
  isLoading: boolean;
  addPoints: (type: ReputationActivity['type'], relatedId?: string) => void;
  refreshReputation: () => void;
  refreshLeaderboard: () => void;
}

export const useUserReputation = (username?: string): UseUserReputationReturn => {
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserReputation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { notifyLevelUp, notifyBadge } = usePushNotifications();
  const { toast } = useToast();

  // Fetch reputation data
  const refreshReputation = useCallback(() => {
    if (!username) {
      setReputation(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = getUserReputation(username);
      setReputation(data);
    } catch (error) {
      console.error('Error fetching reputation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  // Fetch leaderboard
  const refreshLeaderboard = useCallback(() => {
    try {
      const data = getLeaderboard(10);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, []);

  // Initialize
  useEffect(() => {
    refreshReputation();
    refreshLeaderboard();
  }, [refreshReputation, refreshLeaderboard]);

  // Add points
  const addPoints = useCallback((type: ReputationActivity['type'], relatedId?: string) => {
    if (!username) return;

    const result = addReputationPoints(username, type, relatedId);

    // Show toast for points
    toast({
      title: `+${result.newPoints} pontos!`,
      description: type === 'vote_received' 
        ? 'Alguém votou na sua ideia'
        : type === 'comment_given'
        ? 'Você comentou em uma ideia'
        : type === 'idea_created'
        ? 'Você criou uma nova ideia'
        : 'Bônus de participação diária',
      duration: 3000,
    });

    // Handle level up
    if (result.levelUp) {
      const updatedReputation = getUserReputation(username);
      
      toast({
        title: '🎉 Subiu de nível!',
        description: `Você alcançou o nível ${updatedReputation.level}: ${updatedReputation.title}!`,
        duration: 5000,
      });

      notifyLevelUp(updatedReputation.level, updatedReputation.title);
    }

    // Handle new badges
    for (const badge of result.newBadges) {
      toast({
        title: `🏆 Nova conquista!`,
        description: `${badge.icon} ${badge.name} - ${badge.description}`,
        duration: 5000,
      });

      notifyBadge(badge.name, badge.icon);
    }

    // Refresh data
    refreshReputation();
    refreshLeaderboard();
  }, [username, toast, notifyLevelUp, notifyBadge, refreshReputation, refreshLeaderboard]);

  return {
    reputation,
    leaderboard,
    allBadges: getAllBadges(),
    allLevels: getAllLevels(),
    isLoading,
    addPoints,
    refreshReputation,
    refreshLeaderboard,
  };
};
