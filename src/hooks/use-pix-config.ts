import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PixConfig {
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  merchantName: string;
  merchantState: string;
  merchantCity: string;
}

const DEFAULT_CONFIG: PixConfig = {
  pixKey: '',
  pixKeyType: 'cpf',
  merchantName: '',
  merchantCity: '',
};

export function usePixConfig() {
  const [config, setConfig] = useState<PixConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const { data } = await supabase
        .from('app_configurations')
        .select('config_value')
        .eq('config_key', 'pix_config')
        .maybeSingle();

      if (data?.config_value) {
        setConfig(data.config_value as unknown as PixConfig);
      }
    } catch (err) {
      console.error('Error fetching PIX config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (newConfig: PixConfig) => {
    const { error } = await supabase
      .from('app_configurations')
      .upsert(
        {
          config_key: 'pix_config',
          config_value: newConfig as unknown as Record<string, unknown>,
        } as any,
        { onConflict: 'config_key' }
      );

    if (error) throw error;
    setConfig(newConfig);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return { config, isLoading, saveConfig, refetch: fetchConfig };
}
