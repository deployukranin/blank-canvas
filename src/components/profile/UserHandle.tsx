import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserHandleProps {
  userId?: string;
  username?: string;
  className?: string;
  showAt?: boolean;
}

/**
 * Component that displays the user's @ handle from the profiles table
 * Falls back to username if handle is not set
 */
export const UserHandle = ({ userId, username, className = '', showAt = true }: UserHandleProps) => {
  const [handle, setHandle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchHandle = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('handle')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data?.handle) {
          setHandle(data.handle);
        }
      } catch (error) {
        console.error('Error fetching user handle:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHandle();
  }, [userId]);

  const displayName = handle || username || 'usuário';
  const prefix = showAt ? '@' : '';

  if (isLoading && userId) {
    return <span className={className}>{prefix}{username || '...'}</span>;
  }

  return <span className={className}>{prefix}{displayName}</span>;
};
