import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WatchHistoryEntry {
  id: string;
  video_id: string;
  last_position_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  updated_at: string;
}

function useOwnerColumns() {
  const { user, session, isAnonymous } = useAuth();
  const authId = user?.id || session?.user?.id || null;

  const ownerColumn = useMemo(() => {
    if (user?.id) return 'user_id' as const;
    if (isAnonymous && session?.user?.id) return 'guest_id' as const;
    return null;
  }, [user?.id, isAnonymous, session?.user?.id]);

  return { authId, ownerColumn };
}

// Hook to get continue watching entry (most recent incomplete video)
export function useContinueWatching() {
  const { authId, ownerColumn } = useOwnerColumns();
  const [entry, setEntry] = useState<WatchHistoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        if (!ownerColumn || !authId) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('video_watch_history')
          .select('id, video_id, last_position_seconds, duration_seconds, completed, updated_at')
          .eq('completed', false)
          .gt('last_position_seconds', 10) // At least 10 seconds watched
          .eq(ownerColumn, authId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data && isMounted) {
          // Don't show if watched more than 95%
          if (data.duration_seconds && data.last_position_seconds / data.duration_seconds > 0.95) {
            setEntry(null);
          } else {
            setEntry(data as WatchHistoryEntry);
          }
        } else if (isMounted) {
          setEntry(null);
        }
      } catch (err) {
        console.error('Error loading continue watching:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [authId, ownerColumn]);

  const dismiss = useCallback(async () => {
    if (!entry) return;

    // Mark as completed to hide it
    try {
      await supabase
        .from('video_watch_history')
        .update({ completed: true })
        .eq('id', entry.id);

      setEntry(null);
    } catch (err) {
      console.error('Error dismissing continue watching:', err);
    }
  }, [entry]);

  return { entry, isLoading, dismiss };
}

// Hook to save watch progress for a specific video
export function useWatchProgress(videoId: string) {
  const { authId, ownerColumn } = useOwnerColumns();
  const lastSaveRef = useRef<number>(0);
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveProgress = useCallback(
    async (positionSeconds: number, durationSeconds?: number) => {
      if (!ownerColumn || !authId) return;

      const now = Date.now();
      
      // Debounce: save at most every 5 seconds
      if (now - lastSaveRef.current < 5000) {
        // Schedule a delayed save
        if (pendingSaveRef.current) {
          clearTimeout(pendingSaveRef.current);
        }
        pendingSaveRef.current = setTimeout(() => {
          saveProgress(positionSeconds, durationSeconds);
        }, 5000 - (now - lastSaveRef.current));
        return;
      }

      lastSaveRef.current = now;

      const position = Math.floor(positionSeconds);
      const duration = durationSeconds ? Math.floor(durationSeconds) : null;
      const completed = duration ? position / duration > 0.95 : false;

      try {
        const row = ownerColumn === 'user_id'
          ? {
              video_id: videoId,
              user_id: authId,
              last_position_seconds: position,
              duration_seconds: duration,
              completed,
            }
          : {
              video_id: videoId,
              guest_id: authId,
              last_position_seconds: position,
              duration_seconds: duration,
              completed,
            };

        const conflict = ownerColumn === 'user_id' ? 'video_id,user_id' : 'video_id,guest_id';

        await supabase
          .from('video_watch_history')
          .upsert(row as any, { onConflict: conflict });
      } catch (err) {
        console.error('Error saving watch progress:', err);
      }
    },
    [videoId, authId, ownerColumn]
  );

  // Cleanup pending saves on unmount
  useEffect(() => {
    return () => {
      if (pendingSaveRef.current) {
        clearTimeout(pendingSaveRef.current);
      }
    };
  }, []);

  return { saveProgress };
}

// Hook to get saved position for a video
export function useSavedPosition(videoId: string) {
  const { authId, ownerColumn } = useOwnerColumns();
  const [position, setPosition] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        if (!ownerColumn || !authId) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('video_watch_history')
          .select('last_position_seconds, duration_seconds, completed')
          .eq('video_id', videoId)
          .eq(ownerColumn, authId)
          .maybeSingle();

        if (!error && data && isMounted) {
          // Don't resume if completed or near the end
          if (data.completed) {
            setPosition(null);
          } else if (data.duration_seconds && data.last_position_seconds / data.duration_seconds > 0.95) {
            setPosition(null);
          } else if (data.last_position_seconds > 10) {
            setPosition(data.last_position_seconds);
          } else {
            setPosition(null);
          }
        } else if (isMounted) {
          setPosition(null);
        }
      } catch (err) {
        console.error('Error loading saved position:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [videoId, authId, ownerColumn]);

  return { position, isLoading };
}
