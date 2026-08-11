import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeCurrency, type DisplayCurrency } from '@/lib/currency';

/**
 * Returns the currency configured by the creator in the admin panel
 * (payment_config.currency). This is the single source of truth for
 * every price shown and charged in the store — the interface language
 * never changes it.
 *
 * Uses a public RPC so guests and clients of the store (who cannot read
 * the raw payment_config row) still see the correct currency.
 */
export const useStoreCurrency = (storeId?: string | null): DisplayCurrency => {
  const [currency, setCurrency] = useState<DisplayCurrency>('BRL');

  useEffect(() => {
    if (!storeId) return;
    let active = true;

    const fetchCurrency = async () => {
      const { data, error } = await supabase.rpc('get_store_currency', { p_store_id: storeId });
      if (!active) return;
      if (!error && data) {
        setCurrency(normalizeCurrency(data as string));
        return;
      }
      // Fallback for admins/members that can read the config directly
      const { data: conf } = await supabase
        .from('app_configurations')
        .select('config_value')
        .eq('config_key', 'payment_config')
        .eq('store_id', storeId)
        .maybeSingle();
      if (!active) return;
      const value = (conf?.config_value as { currency?: string } | null)?.currency;
      setCurrency(normalizeCurrency(value));
    };

    fetchCurrency();

    const onChanged = () => { fetchCurrency(); };
    window.addEventListener('store-currency-changed', onChanged);
    return () => {
      active = false;
      window.removeEventListener('store-currency-changed', onChanged);
    };
  }, [storeId]);

  return currency;
};
