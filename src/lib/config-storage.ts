/**
 * Configuration Storage - Persists app configurations to Supabase
 * 
 * Uses edge function for saving (bypasses RLS for admin users)
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { clearAdminSession, getAdminToken } from '@/lib/admin-session';

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
 * Save configuration to database via edge function
 * This bypasses RLS by using service role in the edge function
 */
export const saveConfig = async <T>(
  key: ConfigKey, 
  value: T
): Promise<boolean> => {
  try {
    // Get admin token if available
    const adminToken = getAdminToken();
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (adminToken) {
      headers['x-admin-token'] = adminToken;
    }

    // Call edge function to save config
    const { data, error } = await supabase.functions.invoke('save-app-config', {
      body: {
        config_key: key,
        config_value: value,
      },
      headers,
    });

    if (error) {
      // If the admin token is invalid/expired, stop retry loops by clearing it.
      const status = (error as unknown as { status?: number }).status;
      if (status === 401) {
        clearAdminSession();
      }
      console.error(`Error saving config ${key}:`, error);
      return false;
    }

    if (!data?.success) {
      if (data?.error === 'Não autorizado') {
        clearAdminSession();
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
