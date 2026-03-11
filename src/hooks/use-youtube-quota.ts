import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface QuotaUsage {
  totalToday: number;
  history: Array<{ date: string; units: number }>;
}

export function useYouTubeQuota() {
  return useQuery({
    queryKey: ['youtube-quota'],
    queryFn: async (): Promise<QuotaUsage> => {
      // Get today's start in UTC
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      // Get last 7 days of usage
      const weekAgo = new Date(todayStart);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('youtube_api_usage')
        .select('units_used, created_at')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Aggregate by day
      const dailyMap = new Map<string, number>();
      let totalToday = 0;
      const todayStr = todayStart.toISOString().split('T')[0];

      for (const row of data ?? []) {
        const date = row.created_at.split('T')[0];
        dailyMap.set(date, (dailyMap.get(date) ?? 0) + row.units_used);
        if (date === todayStr) {
          totalToday += row.units_used;
        }
      }

      const history = Array.from(dailyMap.entries()).map(([date, units]) => ({ date, units }));

      return { totalToday, history };
    },
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });
}
