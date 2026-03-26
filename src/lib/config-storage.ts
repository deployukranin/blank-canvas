/**
 * Configuration Storage - Persists app configurations to Supabase
 * Supports per-store configs via store_id
 */

import { supabase } from '@/integrations/supabase/client';

export type ConfigKey = 
  | 'video_config' 
  | 'vip_config' 
  | 'white_label_config'
  | 'global_default_categories';

/**
 * Load configuration from database.
 * If storeId is provided, loads store-specific config.
 * Otherwise loads global config (store_id IS NULL).
 */
export const loadConfig = async <T>(key: ConfigKey, storeId?: string | null): Promise<T | null> => {
  try {
    let query = supabase
      .from('app_configurations')
      .select('config_value')
      .eq('config_key', key);

    if (storeId) {
      query = query.eq('store_id', storeId);
    } else {
      query = query.is('store_id', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error(`Error loading config ${key}:`, error);
      return null;
    }

    return data?.config_value as T | null;
  } catch (err) {
    console.error(`Exception loading config ${key}:`, err);
    return null;
  }
};

/**
 * Save configuration to database via edge function.
 * Includes store_id if provided for tenant-scoped configs.
 */
export const saveConfig = async <T>(
  key: ConfigKey, 
  value: T,
  storeId?: string | null
): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.debug(`Skipping save for ${key}: user not authenticated`);
      return false;
    }

    const { data, error } = await supabase.functions.invoke('save-app-config', {
      body: {
        config_key: key,
        config_value: value,
        ...(storeId ? { store_id: storeId } : {}),
      },
    });

    if (error) {
      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        console.debug(`Config ${key} not saved: user lacks admin permissions`);
        return false;
      }
      console.error(`Error saving config ${key}:`, error);
      return false;
    }

    if (!data?.success) {
      if (data?.error?.includes('Acesso negado') || data?.error?.includes('permissão')) {
        console.debug(`Config ${key} not saved: ${data.error}`);
        return false;
      }
      console.error(`Failed to save config ${key}:`, data?.error);
      return false;
    }

    console.log(`Config ${key} saved successfully`);
    return true;
  } catch (err) {
    console.error(`Exception saving config ${key}:`, err);
    return false;
  }
};

/**
 * Migrate localStorage config to database (one-time migration)
 */
export const migrateLocalStorageToDb = async <T>(
  localStorageKey: string,
  dbKey: ConfigKey,
  defaultValue: T
): Promise<void> => {
  const existing = await loadConfig<T>(dbKey);
  if (existing) {
    localStorage.removeItem(localStorageKey);
    return;
  }

  const localData = localStorage.getItem(localStorageKey);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      const merged = { ...defaultValue, ...parsed };
      const saved = await saveConfig(dbKey, merged);
      if (saved) {
        localStorage.removeItem(localStorageKey);
        console.log(`Migrated ${localStorageKey} to database`);
      }
    } catch (err) {
      console.error(`Error migrating ${localStorageKey}:`, err);
    }
  }
};
