import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { loadConfig } from '@/lib/config-storage';
import {
  DEFAULT_GAMIFICATION_CONFIG,
  buildReputationSummary,
  type GamificationConfig,
  type ReputationCounts,
  type ReputationSummary,
} from '@/lib/gamification';

export interface LeaderboardEntry {
  userId: string;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  level: number;
  title: string;
  icon: string;
}

const mergeConfig = (raw: Partial<GamificationConfig> | null): GamificationConfig => ({
  ...DEFAULT_GAMIFICATION_CONFIG,
  ...(raw || {}),
  points: { ...DEFAULT_GAMIFICATION_CONFIG.points, ...(raw?.points || {}) },
  levels: raw?.levels?.length ? raw.levels : DEFAULT_GAMIFICATION_CONFIG.levels,
  badges: raw?.badges?.length ? raw.badges : DEFAULT_GAMIFICATION_CONFIG.badges,
});

/** Loads the store's gamification configuration (levels, badges, rewards). */
export const useGamificationConfig = (storeIdOverride?: string | null) => {
  const { store } = useTenant();
  const storeId = storeIdOverride ?? store?.id ?? null;
  const [config, setConfig] = useState<GamificationConfig>(DEFAULT_GAMIFICATION_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!storeId) {
      setConfig(DEFAULT_GAMIFICATION_CONFIG);
      setIsLoading(false);
      return;
    }
    try {
      const raw = await loadConfig<Partial<GamificationConfig>>('gamification_config', storeId);
      setConfig(mergeConfig(raw));
    } catch {
      setConfig(DEFAULT_GAMIFICATION_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { config, isLoading, storeId, refresh };
};

/** DB-backed reputation for the current (or given) user in the current store. */
export const useReputation = (userIdOverride?: string | null) => {
  const { session } = useAuth();
  const { config, storeId, isLoading: configLoading } = useGamificationConfig();
  const userId = userIdOverride ?? session?.user?.id ?? null;

  const [totalPoints, setTotalPoints] = useState(0);
  const [counts, setCounts] = useState<ReputationCounts>({});
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!storeId || !userId) {
      setTotalPoints(0);
      setCounts({});
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.rpc('get_user_reputation', {
        p_store_id: storeId,
        p_user_id: userId,
      });
      if (error) throw error;
      const payload = (data || {}) as { total_points?: number; counts?: ReputationCounts };
      setTotalPoints(payload.total_points || 0);
      setCounts(payload.counts || {});
    } catch {
      setTotalPoints(0);
      setCounts({});
    } finally {
      setIsLoading(false);
    }
  }, [storeId, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Daily participation bonus (once per UTC day, enforced server side)
  useEffect(() => {
    if (!storeId || !session?.user?.id || userIdOverride) return;
    supabase
      .rpc('claim_daily_reputation', { p_store_id: storeId })
      .then(() => refresh())
      .then(undefined, () => undefined);
  }, [storeId, session?.user?.id, userIdOverride, refresh]);

  const reputation: ReputationSummary = useMemo(
    () => buildReputationSummary(userId, totalPoints, counts, config),
    [userId, totalPoints, counts, config]
  );

  return {
    reputation,
    config,
    storeId,
    isLoading: isLoading || configLoading,
    refresh,
    hasReward: (reward: string) => reputation.rewards.includes(reward as never),
  };
};

/** Store leaderboard, ordered by total points. */
export const useLeaderboard = (limit = 10) => {
  const { config, storeId } = useGamificationConfig();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!storeId) {
      setEntries([]);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.rpc('get_store_leaderboard', {
        p_store_id: storeId,
        p_limit: limit,
      });
      if (error) throw error;
      const rows = (data || []) as {
        user_id: string;
        handle: string | null;
        display_name: string | null;
        avatar_url: string | null;
        total_points: number;
      }[];
      setEntries(
        rows.map((row) => {
          const summary = buildReputationSummary(row.user_id, Number(row.total_points) || 0, {}, config);
          return {
            userId: row.user_id,
            handle: row.handle,
            displayName: row.display_name,
            avatarUrl: row.avatar_url,
            totalPoints: Number(row.total_points) || 0,
            level: summary.level,
            title: summary.title,
            icon: summary.icon,
          };
        })
      );
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [storeId, limit, config]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entries, isLoading, refresh };
};

/** Map handle -> level info, used to render level badges next to community authors. */
export const useReputationByHandle = () => {
  const { entries } = useLeaderboard(100);
  return useMemo(() => {
    const map = new Map<string, { level: number; title: string; icon: string; totalPoints: number }>();
    entries.forEach((e) => {
      if (e.handle) map.set(e.handle.toLowerCase(), { level: e.level, title: e.title, icon: e.icon, totalPoints: e.totalPoints });
    });
    return map;
  }, [entries]);
};
