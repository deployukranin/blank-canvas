import { devLog } from '@/lib/logger';
/**
 * Configuration Storage - Persists app configurations to Supabase
 * Supports per-store configs via store_id
 */

import { supabase } from '@/integrations/supabase/client';

export type ConfigKey = 
  | 'video_config' 
  | 'vip_config' 
  | 'white_label_config'
  | 'global_default_categories'
  | 'payment_config'
  | 'social_links'
  | 'platform_settings'
  | 'platform_plans'
  | 'content_settings';

const CONFIG_ADMIN_ROLES = ['admin', 'creator', 'ceo', 'super_admin'] as const;
const PLATFORM_ADMIN_ROLES = ['ceo', 'super_admin'] as const;
const PLATFORM_ONLY_KEYS = new Set<ConfigKey>(['platform_settings', 'platform_plans']);
const GLOBAL_CONFIG_KEYS = PLATFORM_ONLY_KEYS;
const permissionCache = new Map<string, { canSave: boolean; isPlatformAdmin: boolean }>();

const getConfigPermissions = async (userId: string): Promise<{ canSave: boolean; isPlatformAdmin: boolean }> => {
  const cached = permissionCache.get(userId);
  if (cached !== undefined) return cached;

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.debug('Skipping config save: could not verify admin permissions', error.message);
    const denied = { canSave: false, isPlatformAdmin: false };
    permissionCache.set(userId, denied);
    return denied;
  }

  const roles = data?.map((r) => r.role) || [];
  const permissions = {
    canSave: roles.some((role) => CONFIG_ADMIN_ROLES.includes(role as any)),
    isPlatformAdmin: roles.some((role) => PLATFORM_ADMIN_ROLES.includes(role as any)),
  };
  permissionCache.set(userId, permissions);
  return permissions;
};

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
    if (!storeId && !GLOBAL_CONFIG_KEYS.has(key)) {
      console.debug(`Skipping save for ${key}: store-scoped config requires storeId`);
      return false;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.debug(`Skipping save for ${key}: user not authenticated`);
      return false;
    }

    const permissions = await getConfigPermissions(session.user.id);
    if (!permissions.canSave) {
      console.debug(`Skipping save for ${key}: administrative permissions required`);
      return false;
    }

    if (!storeId && !permissions.isPlatformAdmin) {
      console.debug(`Skipping save for ${key}: global config requires platform admin permissions`);
      return false;
    }

    if (PLATFORM_ONLY_KEYS.has(key) && !permissions.isPlatformAdmin) {
      console.debug(`Skipping save for ${key}: platform admin permissions required`);
      return false;
    }

    let data: any = null;
    let error: any = null;
    try {
      const res = await supabase.functions.invoke('save-app-config', {
        body: {
          config_key: key,
          config_value: value,
          ...(storeId ? { store_id: storeId } : {}),
        },
      });
      data = res.data;
      error = res.error;
    } catch (invokeErr) {
      console.debug(`Config ${key} not saved (invoke threw):`, invokeErr);
      return false;
    }

    // Try to extract body from FunctionsHttpError when present
    if (error && typeof (error as any).context?.json === 'function') {
      try { data = await (error as any).context.json(); } catch {}
    }

    const errMsg = (data?.error || error?.message || '') as string;
    const isPermissionDenied =
      errMsg.includes('Acesso negado') ||
      errMsg.includes('permissão') ||
      errMsg.includes('permissões') ||
      errMsg.includes('403') ||
      errMsg.includes('401') ||
      errMsg.includes('Forbidden') ||
      errMsg.includes('Autenticação') ||
      errMsg.includes('Token inválido');

    if (error || !data?.success) {
      if (isPermissionDenied) {
        console.debug(`Config ${key} not saved: ${errMsg || 'permission denied'}`);
        return false;
      }
      console.error(`Failed to save config ${key}:`, errMsg || error || data);
      return false;
    }

    devLog(`Config ${key} saved successfully`);
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
  defaultValue: T,
  storeId?: string | null
): Promise<void> => {
  if (!storeId && !GLOBAL_CONFIG_KEYS.has(dbKey)) {
    return;
  }

  const existing = await loadConfig<T>(dbKey, storeId);
  if (existing) {
    localStorage.removeItem(localStorageKey);
    return;
  }

  const localData = localStorage.getItem(localStorageKey);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      const merged = { ...defaultValue, ...parsed };
      const saved = await saveConfig(dbKey, merged, storeId);
      if (saved) {
        localStorage.removeItem(localStorageKey);
        devLog(`Migrated ${localStorageKey} to database`);
      }
    } catch (err) {
      console.error(`Error migrating ${localStorageKey}:`, err);
    }
  }
};
