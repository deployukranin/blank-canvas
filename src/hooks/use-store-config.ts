import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface StoreVisualConfig {
  storeName?: string;
  storeDescription?: string;
  logoUrl?: string;
  bannerImages?: string[];
  colors?: {
    primary: string;
    accent: string;
    background: string;
  };
}

const defaultStoreConfig: StoreVisualConfig = {
  storeName: '',
  storeDescription: '',
  logoUrl: '',
  bannerImages: [],
  colors: {
    primary: '270 70% 60%',
    accent: '280 60% 70%',
    background: '260 30% 6%',
  },
};

export function useStoreConfig(storeId: string | null | undefined) {
  const [config, setConfig] = useState<StoreVisualConfig>(defaultStoreConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('app_configurations')
        .select('config_key, config_value')
        .eq('store_id', storeId)
        .eq('config_key', 'store_visual');

      if (!error && data && data.length > 0) {
        const raw = data[0].config_value as Record<string, unknown>;
        setConfig({
          ...defaultStoreConfig,
          ...raw,
          colors: {
            ...defaultStoreConfig.colors!,
            ...(raw.colors as Record<string, string> | undefined),
          },
        });
      } else {
        setConfig(defaultStoreConfig);
      }
      setIsLoading(false);
    };

    load();
  }, [storeId]);

  const saveConfig = useCallback(
    async (newConfig: StoreVisualConfig) => {
      if (!storeId) return;

      const { data: existing } = await supabase
        .from('app_configurations')
        .select('id')
        .eq('store_id', storeId)
        .eq('config_key', 'store_visual')
        .single();

      const payload = {
        config_key: 'store_visual',
        config_value: newConfig as unknown as Json,
        store_id: storeId,
      };

      if (existing) {
        await supabase
          .from('app_configurations')
          .update({ config_value: payload.config_value, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('app_configurations').insert(payload);
      }

      setConfig(newConfig);
    },
    [storeId],
  );

  return { config, isLoading, saveConfig, defaultConfig: defaultStoreConfig };
}
