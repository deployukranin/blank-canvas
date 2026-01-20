import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Influencer {
  id: string;
  name: string;
  split_percentage: number;
  is_active: boolean;
}

interface UseInfluencersReturn {
  influencers: Influencer[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInfluencers(): UseInfluencersReturn {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfluencers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('influencers')
        .select('id, name, split_percentage, is_active')
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        console.error('Erro ao buscar influencers:', fetchError);
        setError('Erro ao carregar influencers');
        return;
      }

      setInfluencers(data || []);
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro ao carregar influencers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfluencers();
  }, [fetchInfluencers]);

  return {
    influencers,
    isLoading,
    error,
    refetch: fetchInfluencers,
  };
}
