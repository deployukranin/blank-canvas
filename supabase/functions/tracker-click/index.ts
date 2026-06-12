// Public endpoint: record a click for a tracker link and return its destination.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim().toLowerCase();
    const visitorId = body.visitor_id ? String(body.visitor_id).slice(0, 64) : null;
    if (!code) return json({ ok: false, error: "missing code" }, 400);

    const linkRes = await rest(
      `tracker_links?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=id,tracker_id,destination&limit=1`,
    );
    const links = (await linkRes.json()) as Array<{ id: string; tracker_id: string; destination: string }>;
    if (!links.length) return json({ ok: false, error: "not found" }, 404);
    const link = links[0];

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const ipHash = ip ? await hashIp(ip) : null;

    await rest("tracker_clicks", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        link_id: link.id,
        tracker_id: link.tracker_id,
        visitor_id: visitorId,
        referrer: body.referrer ? String(body.referrer).slice(0, 500) : null,
        user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
        ip_hash: ipHash,
      }),
    });

    return json({ ok: true, code, destination: link.destination || "/" });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
