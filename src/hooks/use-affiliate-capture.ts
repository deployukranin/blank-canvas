import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Stored {
  code: string;
  storeId: string;
  expiresAt: number;
}

const keyFor = (storeId: string) => `aff_${storeId}`;

/**
 * Reads ?aff=CODE from URL, validates against the current store, and persists
 * in localStorage scoped to the store id. Returns the active affiliate code,
 * or null. TTL is set when validating using store's affiliate_config.cookie_days
 * (fallback 30 days).
 */
export function useAffiliateCapture(storeId: string | null | undefined) {
  const [params] = useSearchParams();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    // Load existing
    try {
      const raw = localStorage.getItem(keyFor(storeId));
      if (raw) {
        const parsed = JSON.parse(raw) as Stored;
        if (parsed.expiresAt > Date.now()) setCode(parsed.code);
        else localStorage.removeItem(keyFor(storeId));
      }
    } catch { /* noop */ }

    const incoming = (params.get('aff') || '').trim().toUpperCase();
    if (!incoming || incoming.length !== 6) return;

    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-validate?code=${encodeURIComponent(incoming)}&store_id=${encodeURIComponent(storeId)}`;
        const r = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const resp = await r.json().catch(() => null);
        if (!resp?.valid) return;

        // Read cookie_days from public config
        const { data } = await supabase
          .from('app_configurations')
          .select('config_value')
          .eq('store_id', storeId)
          .eq('config_key', 'affiliate_config')
          .maybeSingle();
        const days = Math.max(1, Number((data?.config_value as any)?.cookie_days) || 30);
        const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
        const stored: Stored = { code: incoming, storeId, expiresAt };
        localStorage.setItem(keyFor(storeId), JSON.stringify(stored));
        setCode(incoming);
      } catch { /* noop */ }
    })();
  }, [storeId, params]);

  return code;
}

export function getAffiliateCode(storeId: string | null | undefined): string | null {
  if (!storeId) return null;
  try {
    const raw = localStorage.getItem(keyFor(storeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(keyFor(storeId));
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
}
