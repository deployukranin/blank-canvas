import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PixKeyItem {
  id: string;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  merchantName: string;
  merchantState: string;
  merchantCity: string;
  isActive: boolean;
}

/** Legacy single-key format for backwards compat */
export interface PixConfig {
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  merchantName: string;
  merchantState: string;
  merchantCity: string;
}

export interface PixMultiConfig {
  keys: PixKeyItem[];
}

function migrateFromLegacy(raw: any): PixMultiConfig {
  if (!raw) return { keys: [] };
  // Already multi-key format
  if (Array.isArray(raw?.keys)) return { keys: raw.keys };
  // Legacy single-key
  if (raw?.pixKey) {
    return {
      keys: [{
        id: crypto.randomUUID(),
        pixKey: raw.pixKey,
        pixKeyType: raw.pixKeyType || 'cpf',
        merchantName: raw.merchantName || '',
        merchantState: raw.merchantState || '',
        merchantCity: raw.merchantCity || '',
        isActive: true,
      }],
    };
  }
  return { keys: [] };
}

export function usePixConfig() {
  const [multiConfig, setMultiConfig] = useState<PixMultiConfig>({ keys: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Derived: active key as legacy PixConfig (for checkout compatibility)
  const activeKey = multiConfig.keys?.find(k => k.isActive);
  const config: PixConfig = activeKey
    ? { pixKey: activeKey.pixKey, pixKeyType: activeKey.pixKeyType, merchantName: activeKey.merchantName, merchantState: activeKey.merchantState, merchantCity: activeKey.merchantCity }
    : { pixKey: '', pixKeyType: 'cpf', merchantName: '', merchantState: '', merchantCity: '' };

  const fetchConfig = async () => {
    try {
      const { data } = await supabase
        .from('app_configurations')
        .select('config_value')
        .eq('config_key', 'pix_config')
        .maybeSingle();

      if (data?.config_value) {
        setMultiConfig(migrateFromLegacy(data.config_value));
      }
    } catch (err) {
      console.error('Error fetching PIX config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMultiConfig = async (newMulti: PixMultiConfig) => {
    const { error } = await supabase
      .from('app_configurations')
      .upsert(
        {
          config_key: 'pix_config',
          config_value: newMulti as unknown as Record<string, unknown>,
        } as any,
        { onConflict: 'config_key' }
      );
    if (error) throw error;
    setMultiConfig(newMulti);
  };

  // Legacy compat
  const saveConfig = async (newConfig: PixConfig) => {
    const existing = { ...multiConfig };
    const activeIdx = existing.keys.findIndex(k => k.isActive);
    if (activeIdx >= 0) {
      existing.keys[activeIdx] = { ...existing.keys[activeIdx], ...newConfig };
    } else {
      existing.keys.push({ id: crypto.randomUUID(), ...newConfig, isActive: true });
    }
    await saveMultiConfig(existing);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return { config, multiConfig, isLoading, saveConfig, saveMultiConfig, refetch: fetchConfig };
}
