import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { usePersistentConfig } from '@/hooks/use-persistent-config';
import { defaultContentSettings, type ContentSettings } from '@/pages/admin/AdminConfiguracoes';

export interface VideoIdea {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: 'active' | 'pending' | 'reported' | 'removed';
  user_id: string | null;
  created_at: string;
  hasVoted?: boolean;
  authorName?: string;
}

export const useVideoIdeas = () => {
  const { user, isAuthenticated } = useAuth();
  const { store } = useTenant();
  const { config: contentSettings } = usePersistentConfig<ContentSettings>({
    configKey: 'content_settings',
    defaultValue: defaultContentSettings,
    storeId: store?.id ?? null,
  });
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch ideas
      const { data: ideasData, error: ideasError } = await supabase
        .from('video_ideas')
        .select('*')
        .eq('status', 'active')
        .order('votes', { ascending: false });

      if (ideasError) throw ideasError;

      // Fetch user's votes if authenticated
      let userVotes: string[] = [];
      if (isAuthenticated && user?.id) {
        const { data: votesData } = await supabase
          .from('video_idea_votes')
          .select('idea_id')
          .eq('user_id', user.id);

        userVotes = (votesData || []).map(v => v.idea_id);
      }

      // Map ideas with vote status
      const mappedIdeas: VideoIdea[] = (ideasData || []).map(idea => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        votes: idea.votes,
        status: idea.status as 'active' | 'reported' | 'removed',
        user_id: idea.user_id,
        created_at: idea.created_at,
        hasVoted: userVotes.includes(idea.id),
        authorName: 'Usuário', // In a real app, join with profiles
      }));

      setIdeas(mappedIdeas);
    } catch (err) {
      console.error('Error fetching ideas:', err);
      setError('Erro ao carregar ideias');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const toggleVote = useCallback(async (ideaId: string) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Faça login para votar' };
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('toggle_idea_vote', {
        p_idea_id: ideaId,
      });

      if (rpcError) throw rpcError;

      const result = data as { success: boolean; voted: boolean; votes: number; error?: string };

      if (result.success) {
        // Update local state
        setIdeas(prev =>
          prev.map(idea =>
            idea.id === ideaId
              ? { ...idea, votes: result.votes, hasVoted: result.voted }
              : idea
          )
        );
        return { success: true, voted: result.voted };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error toggling vote:', err);
      return { success: false, error: 'Erro ao votar' };
    }
  }, [isAuthenticated]);

  const submitIdea = useCallback(async (title: string, description: string) => {
    if (!isAuthenticated || !user?.id) {
      return { success: false, error: 'Faça login para enviar ideias' };
    }

    try {
      const { data, error: insertError } = await supabase
        .from('video_ideas')
        .insert({
          title,
          description,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to local state
      const newIdea: VideoIdea = {
        id: data.id,
        title: data.title,
        description: data.description,
        votes: 0,
        status: 'active',
        user_id: data.user_id,
        created_at: data.created_at,
        hasVoted: false,
        authorName: user.username || 'Você',
      };

      setIdeas(prev => [newIdea, ...prev]);

      return { success: true, idea: newIdea };
    } catch (err) {
      console.error('Error submitting idea:', err);
      return { success: false, error: 'Erro ao enviar ideia' };
    }
  }, [isAuthenticated, user?.id, user?.username]);

  const reportIdea = useCallback(async (ideaId: string, reason: string) => {
    console.log('[Report] Idea reported:', { ideaId, reason });
    // For now, just log - in a real app, this would create a report record
    return { success: true };
  }, []);

  return {
    ideas,
    isLoading,
    error,
    toggleVote,
    submitIdea,
    reportIdea,
    refetch: fetchIdeas,
  };
};
