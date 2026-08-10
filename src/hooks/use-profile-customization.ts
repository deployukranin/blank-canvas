import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { PROFILE_UPDATED_EVENT, notifyProfileUpdated } from '@/lib/profile-events';

export interface ProfileCustomization {
  banner_url: string | null;
  avatar_url: string | null;
  display_name: string | null;
  pronouns: string | null;
  status_text: string | null;
}

const EMPTY: ProfileCustomization = {
  banner_url: null,
  avatar_url: null,
  display_name: null,
  pronouns: null,
  status_text: null,
};

export const MAX_PROFILE_MEDIA_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Module-level cache keyed by user+store so the avatar survives route changes
const customizationCache = new Map<string, ProfileCustomization>();
const CUSTOMIZATION_CACHE_PREFIX = 'tinglebox:profile-customization:';

const readCachedCustomization = (key: string): ProfileCustomization | null => {
  const memoryValue = customizationCache.get(key);
  if (memoryValue) return memoryValue;
  try {
    const stored = localStorage.getItem(`${CUSTOMIZATION_CACHE_PREFIX}${key}`);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as ProfileCustomization;
    customizationCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
};

const cacheCustomization = (key: string, value: ProfileCustomization) => {
  customizationCache.set(key, value);
  try {
    localStorage.setItem(`${CUSTOMIZATION_CACHE_PREFIX}${key}`, JSON.stringify(value));
  } catch { /* storage may be unavailable */ }
};

export const useProfileCustomization = () => {
  const { session } = useAuth();
  const { store } = useTenant();
  const userId = session?.user?.id ?? null;
  const storeId = store?.id ?? null;
  const cacheKey = userId && storeId ? `${userId}:${storeId}` : null;

  const [customization, setCustomization] = useState<ProfileCustomization>(
    () => (cacheKey ? readCachedCustomization(cacheKey) : null) ?? EMPTY
  );
  const [isLoading, setIsLoading] = useState(() => !(cacheKey && readCachedCustomization(cacheKey)));
  const [isSaving, setIsSaving] = useState(false);
  const cachedCustomization = cacheKey ? readCachedCustomization(cacheKey) : null;
  const resolvedCustomization = cachedCustomization ?? customization;

  const refresh = useCallback(async () => {
    if (!userId || !storeId) {
      setCustomization(EMPTY);
      setIsLoading(false);
      return;
    }
    const key = `${userId}:${storeId}`;
    const { data } = await supabase
      .from('profile_customizations')
      .select('banner_url, avatar_url, display_name, pronouns, status_text')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .maybeSingle();
    const next = (data as ProfileCustomization) || EMPTY;
    cacheCustomization(key, next);
    setCustomization(next);
    setIsLoading(false);
  }, [userId, storeId]);


  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleProfileUpdated = () => void refresh();
    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, [refresh]);

  const save = useCallback(
    async (patch: Partial<ProfileCustomization>) => {
      if (!userId || !storeId) throw new Error('not_ready');
      setIsSaving(true);
      try {
        const next = { ...customization, ...patch };
        const { error } = await supabase
          .from('profile_customizations')
          .upsert({ user_id: userId, store_id: storeId, ...next }, { onConflict: 'user_id,store_id' });
        if (error) throw error;
        cacheCustomization(`${userId}:${storeId}`, next);
        setCustomization(next);

        notifyProfileUpdated();
        return next;
      } finally {
        setIsSaving(false);
      }
    },
    [customization, userId, storeId]
  );

  const uploadMedia = useCallback(
    async (file: File, kind: 'banner' | 'avatar') => {
      if (!userId || !storeId) throw new Error('not_ready');
      if (!ALLOWED_TYPES.includes(file.type)) throw new Error('invalid_type');
      if (file.size > MAX_PROFILE_MEDIA_BYTES) throw new Error('too_large');

      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `profiles/${storeId}/${userId}/${kind}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from('banners').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;

      const { data } = supabase.storage.from('banners').getPublicUrl(path);
      return data.publicUrl;
    },
    [userId, storeId]
  );

  return {
    customization: resolvedCustomization,
    isLoading: isLoading && !cachedCustomization,
    isSaving,
    save,
    uploadMedia,
    refresh,
    storeId,
  };
};
