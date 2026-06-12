import { supabase } from "@/integrations/supabase/client";

const ATTR_KEY = "tb_track";
const VISITOR_KEY = "tb_visitor";
const ATTR_TTL_DAYS = 30;

interface Attribution {
  code: string;
  ts: number;
}

export function getVisitorId(): string {
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, v);
    }
    return v;
  } catch {
    return "anon";
  }
}

export function setAttribution(code: string) {
  try {
    const data: Attribution = { code, ts: Date.now() };
    localStorage.setItem(ATTR_KEY, JSON.stringify(data));
    document.cookie = `${ATTR_KEY}=${encodeURIComponent(code)};path=/;max-age=${ATTR_TTL_DAYS * 86400}`;
  } catch {
    /* ignore */
  }
}

export function getAttributionCode(): string | null {
  // 1. explicit ?t= param wins
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("t");
    if (fromUrl) return fromUrl.toLowerCase();
  } catch {
    /* ignore */
  }
  // 2. stored attribution within TTL
  try {
    const raw = localStorage.getItem(ATTR_KEY);
    if (raw) {
      const data = JSON.parse(raw) as Attribution;
      if (Date.now() - data.ts < ATTR_TTL_DAYS * 86400 * 1000) return data.code;
    }
  } catch {
    /* ignore */
  }
  // 3. cookie fallback
  try {
    const m = document.cookie.match(/(?:^|;\s*)tb_track=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  } catch {
    /* ignore */
  }
  return null;
}

export function clearAttribution() {
  try {
    localStorage.removeItem(ATTR_KEY);
    document.cookie = `${ATTR_KEY}=;path=/;max-age=0`;
  } catch {
    /* ignore */
  }
}

/**
 * Fire a conversion to the tracking system. Safe no-op when no attribution exists.
 */
export async function trackConversion(opts: {
  type: "store_signup" | "client_signup";
  subjectId?: string | null;
  storeId?: string | null;
  email?: string | null;
  name?: string | null;
}) {
  const code = getAttributionCode();
  if (!code) return;
  try {
    await supabase.functions.invoke("tracker-convert", {
      body: {
        code,
        type: opts.type,
        subject_id: opts.subjectId ?? null,
        store_id: opts.storeId ?? null,
        email: opts.email ?? null,
        name: opts.name ?? null,
      },
    });
    clearAttribution();
  } catch {
    /* tracking must never block signup */
  }
}
