import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  handle_set_at: string | null;
}

export const useProfile = () => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();

    // Subscribe to realtime updates (unique channel per hook instance to avoid
    // "cannot add postgres_changes callbacks after subscribe()" crashes when the
    // hook is mounted in several components at once).
    const channel = supabase
      .channel(`profile-changes-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAuthenticated]);

  return { profile, isLoading, refetch: () => setIsLoading(true) };
};
