// Public endpoint: record a conversion (signup) attributed to a tracker link.
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

const VALID_TYPES = new Set(["store_signup", "client_signup"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim().toLowerCase();
    const type = String(body.type || "").trim();
    if (!code) return json({ ok: false, error: "missing code" }, 400);
    if (!VALID_TYPES.has(type)) return json({ ok: false, error: "invalid type" }, 400);

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
        subject_id: body.subject_id || null,
        store_id: body.store_id || null,
        email: body.email ? String(body.email).slice(0, 255) : null,
        name: body.name ? String(body.name).slice(0, 255) : null,
      }),
    });

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
