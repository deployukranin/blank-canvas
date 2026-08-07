import { supabase } from '@/integrations/supabase/client';

export interface StorageQuota {
  plan_type: string;
  is_trial: boolean;
  used_bytes: number;
  limit_bytes: number;
  unlimited: boolean;
}

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes < 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
};

export const fetchStorageQuota = async (storeId?: string | null): Promise<StorageQuota | null> => {
  if (!storeId) return null;
  const { data, error } = await supabase.rpc('get_store_storage_quota', { p_store_id: storeId });
  if (error || !data) return null;
  const q = data as unknown as Partial<StorageQuota> & { error?: string };
  if (q.error) return null;
  return {
    plan_type: q.plan_type || 'trial',
    is_trial: !!q.is_trial,
    used_bytes: Number(q.used_bytes || 0),
    limit_bytes: Number(q.limit_bytes || 0),
    unlimited: !!q.unlimited,
  };
};

/** Returns true when the additional bytes still fit in the store quota. */
export const fitsInQuota = (quota: StorageQuota | null, extraBytes: number): boolean => {
  if (!quota || quota.unlimited || quota.limit_bytes <= 0) return true;
  return quota.used_bytes + extraBytes <= quota.limit_bytes;
};
