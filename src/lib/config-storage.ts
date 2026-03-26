/**
 * Configuration Storage - Persists app configurations to Supabase
 * 
 * Uses edge function for saving (bypasses RLS with service role)
 */

import { supabase } from '@/integrations/supabase/client';

export type ConfigKey = 
  | 'video_config' 
  | 'vip_config' 
  | 'white_label_config'
  | 'global_default_categories';

/**
 * Load configuration from database
 */
export const loadConfig = async <T>(key: ConfigKey): Promise<T | null> => {
  try {
    const { data, error } = await supabase
      .from('app_configurations')
      .select('config_value')
      .eq('config_key', key)
      .maybeSingle();

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
 * Save configuration to database via edge function
 * This bypasses RLS by using service role in the edge function
 * REQUIRES: User must be logged in with admin/ceo role
 */
export const saveConfig = async <T>(
  key: ConfigKey, 
  value: T
): Promise<boolean> => {
  try {
    // Check if user is authenticated before calling edge function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Silently skip saving if not logged in - this is expected behavior
      // Configs will be loaded from DB on next visit
      console.debug(`Skipping save for ${key}: user not authenticated`);
      return false;
    }

    // Call edge function to save config (auth required)
    const { data, error } = await supabase.functions.invoke('save-app-config', {
      body: {
        config_key: key,
        config_value: value,
      },
    });

    if (error) {
      // Don't log as error if it's just permission denied (user isn't admin)
      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        console.debug(`Config ${key} not saved: user lacks admin permissions`);
        return false;
      }
      console.error(`Error saving config ${key}:`, error);
      return false;
    }

    if (!data?.success) {
      // Handle specific errors gracefully
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
  // Check if already migrated
  const existing = await loadConfig<T>(dbKey);
  if (existing) {
    // Already in DB, just clear localStorage
    localStorage.removeItem(localStorageKey);
    return;
  }

  // Try to get from localStorage
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
