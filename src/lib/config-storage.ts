/**
 * Configuration Storage - Persists app configurations to Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type ConfigKey = 
  | 'video_config' 
  | 'vip_config' 
  | 'white_label_config';

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
 * Save configuration to database
 */
export const saveConfig = async <T>(
  key: ConfigKey, 
  value: T
): Promise<boolean> => {
  try {
    // Check if exists first
    const { data: existing } = await supabase
      .from('app_configurations')
      .select('id')
      .eq('config_key', key)
      .maybeSingle();

    let error;
    if (existing) {
      // Update existing
      const result = await supabase
        .from('app_configurations')
        .update({ 
          config_value: value as Json,
          updated_at: new Date().toISOString()
        })
        .eq('config_key', key);
      error = result.error;
    } else {
      // Insert new
      const result = await supabase
        .from('app_configurations')
        .insert({ 
          config_key: key, 
          config_value: value as Json
        });
      error = result.error;
    }

    if (error) {
      console.error(`Error saving config ${key}:`, error);
      return false;
    }

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
