// Public endpoint: record a conversion (signup) attributed to a tracker link.
// Hardened: rate-limited per IP+code, and when possible derives subject_id/email
// from the caller's JWT to prevent forged attribution.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const rest = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip + "|tinglebox-salt");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

async function rateLimit(identifier: string, endpoint: string, max: number, minutes: number) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_rate_limit`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: max,
      p_window_minutes: minutes,
    }),
  });
  if (!r.ok) return { allowed: true };
  return (await r.json()) as { allowed: boolean };
}

const VALID_TYPES = new Set(["store_signup", "client_signup"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim().toLowerCase();
    const type = String(body.type || "").trim();
    if (!code) return json({ ok: false, error: "missing code" }, 400);
    if (!VALID_TYPES.has(type)) return json({ ok: false, error: "invalid type" }, 400);

    // Rate limit: max 10 conversions/hour per IP+code. Legitimate signups happen
    // once per person; anything above is scripted attribution fraud.
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const ipHash = ip ? await hashIp(ip) : "anon";
    const rl = await rateLimit(ipHash, `tracker-convert:${code}`, 10, 60);
    if (!rl.allowed) return json({ ok: false, error: "rate_limited" }, 429);

    // Try to derive the real user from the caller's JWT. When present, we IGNORE
    // any client-supplied subject_id/email/name and use verified values instead —
    // this closes the attribution-fraud vector where an attacker POSTs arbitrary
    // conversions with someone else's email.
    let verifiedSubjectId: string | null = null;
    let verifiedEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const jwt = authHeader.replace("Bearer ", "");
      try {
        const ur = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { apikey: ANON_KEY, Authorization: `Bearer ${jwt}` },
        });
        if (ur.ok) {
          const u = await ur.json();
          if (u?.id) {
            verifiedSubjectId = u.id;
            verifiedEmail = u.email || null;
          }
        }
      } catch { /* ignore, fall through to unauthenticated path */ }
    }

    const linkRes = await rest(
      `tracker_links?code=eq.${encodeURIComponent(code)}&select=id,tracker_id&limit=1`,
    );
    const links = (await linkRes.json()) as Array<{ id: string; tracker_id: string }>;
    if (!links.length) return json({ ok: false, error: "not found" }, 404);
    const link = links[0];

    await rest("tracker_conversions", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        link_id: link.id,
        tracker_id: link.tracker_id,
        type,
        subject_id: verifiedSubjectId ?? (body.subject_id || null),
        store_id: body.store_id || null,
        email: verifiedEmail ?? (body.email ? String(body.email).slice(0, 255) : null),
        name: body.name ? String(body.name).slice(0, 255) : null,
      }),
    });

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
