import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeCurrency, type DisplayCurrency } from '@/lib/currency';

/**
 * Returns the currency configured by the creator in the admin panel
 * (payment_config.currency). This is the single source of truth for
 * every price shown and charged in the store.
 */
export const useStoreCurrency = (storeId?: string | null): DisplayCurrency => {
  const [currency, setCurrency] = useState<DisplayCurrency>('BRL');

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('app_configurations')
        .select('config_value')
        .eq('config_key', 'payment_config')
        .eq('store_id', storeId)
        .maybeSingle();
      if (!active) return;
      const value = (data?.config_value as { currency?: string } | null)?.currency;
      setCurrency(normalizeCurrency(value));
    })();
    return () => { active = false; };
  }, [storeId]);

  return currency;
};
