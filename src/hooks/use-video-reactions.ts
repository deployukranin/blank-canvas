import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ReactionType = 'relaxante' | 'dormi' | 'arrepios' | 'favorito';

export interface VideoReaction {
  id: string;
  video_id: string;
  user_id: string | null;
  guest_id: string | null;
  reaction_type: ReactionType;
  created_at: string;
}

const GUEST_ID_KEY = 'asmr-guest-id';

function getOrCreateGuestId(): string {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest_${crypto.randomUUID()}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

export function useVideoReactions(videoId: string) {
  const { user, isAuthenticated } = useAuth();
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const guestId = useMemo(() => {
    if (isAuthenticated && user?.id) return null;
    return getOrCreateGuestId();
  }, [isAuthenticated, user?.id]);

  // Load user's current reaction
  useEffect(() => {
    let isMounted = true;

    const loadReaction = async () => {
      setIsLoading(true);
      
      try {
        let query = supabase
          .from('video_reactions')
          .select('reaction_type')
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
          setUserReaction(data.reaction_type as ReactionType);
        } else if (isMounted) {
          setUserReaction(null);
        }
      } catch (err) {
        console.error('Error loading reaction:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReaction();

    return () => {
      isMounted = false;
    };
  }, [videoId, user?.id, guestId]);

  const setReaction = useCallback(async (reactionType: ReactionType) => {
    if (isSaving) return;
    
    // If same reaction, remove it
    if (userReaction === reactionType) {
      return removeReaction();
    }

    setIsSaving(true);
    const previousReaction = userReaction;
    setUserReaction(reactionType); // Optimistic update

    try {
      if (user?.id) {
        // Upsert for authenticated user
        const { error } = await supabase
          .from('video_reactions')
          .upsert(
            {
              video_id: videoId,
              user_id: user.id,
              reaction_type: reactionType,
            },
            {
              onConflict: 'video_id,user_id',
            }
          );

        if (error) throw error;
      } else if (guestId) {
        // Upsert for guest
        const { error } = await supabase
          .from('video_reactions')
          .upsert(
            {
              video_id: videoId,
              guest_id: guestId,
              reaction_type: reactionType,
            },
            {
              onConflict: 'video_id,guest_id',
            }
          );

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error saving reaction:', err);
      setUserReaction(previousReaction); // Rollback
    } finally {
      setIsSaving(false);
    }
  }, [videoId, user?.id, guestId, userReaction, isSaving]);

  const removeReaction = useCallback(async () => {
    if (isSaving || !userReaction) return;

    setIsSaving(true);
    const previousReaction = userReaction;
    setUserReaction(null); // Optimistic update

    try {
      let query = supabase
        .from('video_reactions')
        .delete()
        .eq('video_id', videoId);

      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else if (guestId) {
        query = query.eq('guest_id', guestId);
      }

      const { error } = await query;
      if (error) throw error;
    } catch (err) {
      console.error('Error removing reaction:', err);
      setUserReaction(previousReaction); // Rollback
    } finally {
      setIsSaving(false);
    }
  }, [videoId, user?.id, guestId, userReaction, isSaving]);

  return {
    userReaction,
    isLoading,
    isSaving,
    setReaction,
    removeReaction,
  };
}

// Hook to get reaction stats for a video (for admin/analytics)
export function useVideoReactionStats(videoId: string) {
  const [stats, setStats] = useState<Record<ReactionType, number>>({
    relaxante: 0,
    dormi: 0,
    arrepios: 0,
    favorito: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('video_reactions')
          .select('reaction_type')
          .eq('video_id', videoId);

        if (!error && data && isMounted) {
          const counts: Record<ReactionType, number> = {
            relaxante: 0,
            dormi: 0,
            arrepios: 0,
            favorito: 0,
          };

          data.forEach((r) => {
            const type = r.reaction_type as ReactionType;
            if (type in counts) {
              counts[type]++;
            }
          });

          setStats(counts);
        }
      } catch (err) {
        console.error('Error loading reaction stats:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  return { stats, isLoading };
}
