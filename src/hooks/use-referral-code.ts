import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'pending_referral';

export interface PendingReferral {
  code: string;
  referrer_store_id: string;
  referrer_store_name: string;
  capturedAt: number;
}

/**
 * Captures `?ref=CODE` from URL, validates it, and persists in sessionStorage
 * until the user completes signup. Returns the captured referral (if any).
 */
export function useReferralCapture() {
  const [params] = useSearchParams();
  const [pending, setPending] = useState<PendingReferral | null>(() => readPendingReferral());

  useEffect(() => {
    const code = (params.get('ref') || '').trim().toUpperCase();
    if (!code || code.length !== 6) return;
    if (pending?.code === code) return;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('referral-validate', {
          body: null,
          method: 'GET' as any,
        });
        // Edge functions invoke doesn't support query strings cleanly; fall back to fetch
        let resp: any = data;
        if (error || !resp) {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/referral-validate?code=${encodeURIComponent(code)}`;
          const r = await fetch(url, {
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          });
          resp = await r.json().catch(() => null);
        }
        if (resp?.valid) {
          const next: PendingReferral = {
            code,
            referrer_store_id: resp.referrer_store_id,
            referrer_store_name: resp.referrer_store_name,
            capturedAt: Date.now(),
          };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          setPending(next);
        }
      } catch (e) {
        console.warn('referral validate failed', e);
      }
    })();
  }, [params, pending?.code]);

  return pending;
}

export function readPendingReferral(): PendingReferral | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingReferral;
  } catch {
    return null;
  }
}

export function clearPendingReferral() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}
