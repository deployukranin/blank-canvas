import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PROFILE_UPDATED_EVENT } from '@/lib/profile-events';

export interface Profile {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  handle_set_at: string | null;
}

// Module-level cache so the profile survives route changes (shells remount per page)
const profileCache = new Map<string, Profile>();

export const useProfile = () => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(() =>
    user?.id ? profileCache.get(user.id) ?? null : null
  );
  const [isLoading, setIsLoading] = useState(() => !(user?.id && profileCache.has(user.id)));


  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // Keep showing the cached profile while revalidating in the background
    if (!profileCache.has(user.id)) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) profileCache.set(user.id, data as Profile);
      else profileCache.delete(user.id);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);


  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    void fetchProfile();

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
            profileCache.set(user.id, payload.new as Profile);
            setProfile(payload.new as Profile);
          }
        }

      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAuthenticated, fetchProfile]);

  useEffect(() => {
    const refresh = () => void fetchProfile();
    window.addEventListener(PROFILE_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, refresh);
  }, [fetchProfile]);

  return { profile, isLoading, refetch: fetchProfile };
};
