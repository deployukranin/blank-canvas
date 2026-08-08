import { useLeaderboard, useReputation } from '@/hooks/use-gamification';
import type { ReputationSummary } from '@/lib/gamification';

/**
 * Compatibility hook: reputation is now stored in the database (reputation_events)
 * and awarded by server-side triggers. `addPoints` only refreshes the local view.
 */
export const useUserReputation = (_username?: string | null) => {
  const { reputation, isLoading, refresh, config } = useReputation();
  const { entries: leaderboard, refresh: refreshLeaderboard } = useLeaderboard(15);

  const addPoints = () => {
    void refresh();
    void refreshLeaderboard();
  };

  return {
    reputation: reputation as ReputationSummary,
    leaderboard,
    config,
    isLoading,
    addPoints,
    refreshReputation: refresh,
    refreshLeaderboard,
  };
};
