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

export function useVideoReactions(videoId: string) {
  const { user, session, isAnonymous } = useAuth();
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const authId = user?.id || session?.user?.id || null;

  const ownerColumn = useMemo(() => {
    if (user?.id) return 'user_id' as const;
    if (isAnonymous && session?.user?.id) return 'guest_id' as const;
    return null;
  }, [user?.id, isAnonymous, session?.user?.id]);

  // Load user's current reaction
  useEffect(() => {
    let isMounted = true;

    const loadReaction = async () => {
      setIsLoading(true);
      
      try {
        if (!ownerColumn || !authId) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('video_reactions')
          .select('reaction_type')
          .eq('video_id', videoId)
          .eq(ownerColumn, authId)
          .maybeSingle();

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
  }, [videoId, authId, ownerColumn]);

  const setReaction = useCallback(async (reactionType: ReactionType) => {
    if (isSaving || !ownerColumn || !authId) return;
    
    // If same reaction, remove it
    if (userReaction === reactionType) {
      return removeReaction();
    }

    setIsSaving(true);
    const previousReaction = userReaction;
    setUserReaction(reactionType); // Optimistic update

    try {
      const row = ownerColumn === 'user_id'
        ? { video_id: videoId, user_id: authId, reaction_type: reactionType }
        : { video_id: videoId, guest_id: authId, reaction_type: reactionType };

      const conflict = ownerColumn === 'user_id' ? 'video_id,user_id' : 'video_id,guest_id';

      const { error } = await supabase
        .from('video_reactions')
        .upsert(row as any, { onConflict: conflict });


      if (error) throw error;
    } catch (err) {
      console.error('Error saving reaction:', err);
      setUserReaction(previousReaction); // Rollback
    } finally {
      setIsSaving(false);
    }
  }, [videoId, authId, ownerColumn, userReaction, isSaving]);

  const removeReaction = useCallback(async () => {
    if (isSaving || !userReaction || !ownerColumn || !authId) return;

    setIsSaving(true);
    const previousReaction = userReaction;
    setUserReaction(null); // Optimistic update

    try {
      const { error } = await supabase
        .from('video_reactions')
        .delete()
        .eq('video_id', videoId)
        .eq(ownerColumn, authId);

      if (error) throw error;
    } catch (err) {
      console.error('Error removing reaction:', err);
      setUserReaction(previousReaction); // Rollback
    } finally {
      setIsSaving(false);
    }
  }, [videoId, authId, ownerColumn, userReaction, isSaving]);

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
          .rpc('get_video_reaction_counts', { p_video_id: videoId });

        if (!error && data && isMounted) {
          const counts: Record<ReactionType, number> = {
            relaxante: 0,
            dormi: 0,
            arrepios: 0,
            favorito: 0,
          };

          (data as Array<{ reaction_type: string; count: number }>).forEach((r) => {
            const type = r.reaction_type as ReactionType;
            if (type in counts) {
              counts[type] = Number(r.count);
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
