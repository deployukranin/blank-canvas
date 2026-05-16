// Public endpoint: validate a referral code and return referrer store name
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    if (!code || code.length !== 6) return json({ valid: false });

    const sUrl = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const r = await fetch(
      `${sUrl}/rest/v1/stores?referral_code=eq.${encodeURIComponent(code)}&select=id,name,slug&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!r.ok) return json({ valid: false });
    const rows = (await r.json()) as Array<{ id: string; name: string; slug: string }>;
    if (!rows.length) return json({ valid: false });
    return json({ valid: true, referrer_store_id: rows[0].id, referrer_store_name: rows[0].name, referrer_store_slug: rows[0].slug });
  } catch {
    return json({ valid: false });
  }
});
