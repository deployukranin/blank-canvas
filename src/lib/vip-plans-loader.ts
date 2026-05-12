/**
 * Load VIP plans strictly scoped to a store_id.
 * 
 * Contract:
 * - Never queries app_configurations without a store_id filter.
 * - Never falls back to global (store_id IS NULL) config.
 * - When the store has no record, returns the local default plans
 *   as a visual placeholder only.
 */

import { supabase } from '@/integrations/supabase/client';
import { defaultVipConfig, type VipPlan } from '@/lib/vip-config';

export interface LoadVipPlansResult {
  plans: VipPlan[];
  source: 'store' | 'defaults' | 'none';
}

export async function loadVipPlansForStore(
  storeId: string | null | undefined,
  client: typeof supabase = supabase,
): Promise<LoadVipPlansResult> {
  if (!storeId) {
    return { plans: [], source: 'none' };
  }

  const { data } = await client
    .from('app_configurations')
    .select('config_value')
    .eq('config_key', 'vip_config')
    .eq('store_id', storeId)
    .maybeSingle();

  const storePlans = (data?.config_value as any)?.plans as VipPlan[] | undefined;

  if (storePlans && storePlans.length > 0) {
    return { plans: storePlans, source: 'store' };
  }

  return { plans: defaultVipConfig.plans, source: 'defaults' };
}
