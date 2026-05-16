// Public endpoint: validate an affiliate code for a given store
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    const storeId = (url.searchParams.get("store_id") || "").trim();
    if (!code || code.length !== 6 || !storeId) return json({ valid: false });

    const sUrl = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const r = await fetch(
      `${sUrl}/rest/v1/store_affiliates?store_id=eq.${encodeURIComponent(storeId)}&code=eq.${encodeURIComponent(code)}&status=eq.active&select=id,user_id&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!r.ok) return json({ valid: false });
    const rows = await r.json() as Array<{ id: string; user_id: string }>;
    if (!rows.length) return json({ valid: false });

    // Optionally fetch the affiliate's display name
    const pr = await fetch(
      `${sUrl}/rest/v1/profiles?user_id=eq.${encodeURIComponent(rows[0].user_id)}&select=display_name,handle&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    const prof = pr.ok ? (await pr.json())[0] : null;
    return json({
      valid: true,
      affiliate_id: rows[0].id,
      affiliate_name: prof?.display_name || prof?.handle || "Afiliado",
    });
  } catch {
    return json({ valid: false });
  }
});
