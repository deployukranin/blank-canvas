import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HandleMap {
  [userId: string]: string | null;
}

/**
 * Hook to fetch handles for multiple users at once
 * Returns a map of userId -> handle (or null if not set)
 */
export const useUserHandles = (userIds: string[]) => {
  const [handles, setHandles] = useState<HandleMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userIds.length) {
      setIsLoading(false);
      return;
    }

    const fetchHandles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, handle')
          .in('id', userIds);

        if (error) throw error;

        const handleMap: HandleMap = {};
        data?.forEach((profile) => {
          handleMap[profile.id] = profile.handle;
        });

        setHandles(handleMap);
      } catch (error) {
        console.error('Error fetching user handles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHandles();
  }, [JSON.stringify(userIds)]);

  return { handles, isLoading };
};

/**
 * Get display name with @ prefix
 * Prefers handle, falls back to username
 */
export const getDisplayHandle = (
  userId: string,
  username: string,
  handles: HandleMap,
  showAt: boolean = true
): string => {
  const handle = handles[userId];
  const displayName = handle || username;
  return showAt ? `@${displayName}` : displayName;
};
