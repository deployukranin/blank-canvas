import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const GUEST_ID_KEY = 'asmr-guest-id';

function getOrCreateGuestId(): string {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest_${crypto.randomUUID()}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

export interface WatchHistoryEntry {
  id: string;
  video_id: string;
  last_position_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  updated_at: string;
}

// Hook to get continue watching entry (most recent incomplete video)
export function useContinueWatching() {
  const { user, isAuthenticated } = useAuth();
  const [entry, setEntry] = useState<WatchHistoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const guestId = useMemo(() => {
    if (isAuthenticated && user?.id) return null;
    return getOrCreateGuestId();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        let query = supabase
          .from('video_watch_history')
          .select('id, video_id, last_position_seconds, duration_seconds, completed, updated_at')
          .eq('completed', false)
          .gt('last_position_seconds', 10) // At least 10 seconds watched
          .order('updated_at', { ascending: false })
          .limit(1);

        if (user?.id) {
          query = query.eq('user_id', user.id);
        } else if (guestId) {
          query = query.eq('guest_id', guestId);
        } else {
          setIsLoading(false);
          return;
        }

        const { data, error } = await query.maybeSingle();

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
  }, [user?.id, guestId]);

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
  const { user, isAuthenticated } = useAuth();
  const lastSaveRef = useRef<number>(0);
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guestId = useMemo(() => {
    if (isAuthenticated && user?.id) return null;
    return getOrCreateGuestId();
  }, [isAuthenticated, user?.id]);

  const saveProgress = useCallback(
    async (positionSeconds: number, durationSeconds?: number) => {
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
        if (user?.id) {
          await supabase
            .from('video_watch_history')
            .upsert(
              {
                video_id: videoId,
                user_id: user.id,
                last_position_seconds: position,
                duration_seconds: duration,
                completed,
              },
              { onConflict: 'video_id,user_id' }
            );
        } else if (guestId) {
          await supabase
            .from('video_watch_history')
            .upsert(
              {
                video_id: videoId,
                guest_id: guestId,
                last_position_seconds: position,
                duration_seconds: duration,
                completed,
              },
              { onConflict: 'video_id,guest_id' }
            );
        }
      } catch (err) {
        console.error('Error saving watch progress:', err);
      }
    },
    [videoId, user?.id, guestId]
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
  const { user, isAuthenticated } = useAuth();
  const [position, setPosition] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const guestId = useMemo(() => {
    if (isAuthenticated && user?.id) return null;
    return getOrCreateGuestId();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        let query = supabase
          .from('video_watch_history')
          .select('last_position_seconds, duration_seconds, completed')
          .eq('video_id', videoId);

        if (user?.id) {
          query = query.eq('user_id', user.id);
        } else if (guestId) {
          query = query.eq('guest_id', guestId);
        } else {
          setIsLoading(false);
          return;
        }

        const { data, error } = await query.maybeSingle();

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
  }, [videoId, user?.id, guestId]);

  return { position, isLoading };
}
