import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Auth required" }, 401);
    const token = auth.replace("Bearer ", "");
    const anon = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: claims, error: ce } = await anon.auth.getClaims(token);
    if (ce || !claims?.claims) return json({ error: "Invalid session" }, 401);
    const userId = claims.claims.sub as string;

    const { store_id } = await req.json().catch(() => ({}));
    if (!store_id) return json({ error: "store_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SRK);

    // Resolve affiliate row
    const { data: aff } = await admin
      .from("store_affiliates")
      .select("id, status")
      .eq("user_id", userId)
      .eq("store_id", store_id)
      .maybeSingle();
    if (!aff) return json({ error: "Not an affiliate" }, 404);
    if (aff.status !== "active") return json({ error: "Affiliate is banned" }, 403);

    // Load store config (min payout)
    const { data: cfg } = await admin
      .from("app_configurations")
      .select("config_value")
      .eq("store_id", store_id)
      .eq("config_key", "affiliate_config")
      .maybeSingle();
    const minPayout = Number((cfg?.config_value as any)?.min_payout_cents ?? 0) || 0;

    // Sum available commissions not yet attached to a payout
    const { data: rows } = await admin
      .from("affiliate_commissions")
      .select("id, commission_cents")
      .eq("affiliate_id", aff.id)
      .eq("status", "available")
      .is("payout_id", null);
    const list = rows || [];
    const available = list.reduce((s, r) => s + (r.commission_cents || 0), 0);
    if (available <= 0) return json({ error: "No commissions available" }, 400);
    if (available < minPayout) return json({ error: `Below minimum (${minPayout} cents)` }, 400);

    // Block if there is already a requested payout open
    const { count: openCount } = await admin
      .from("affiliate_payouts")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", aff.id)
      .eq("status", "requested");
    if ((openCount || 0) > 0) return json({ error: "You already have a pending payout request" }, 400);

    const { data: payout, error: pErr } = await admin
      .from("affiliate_payouts")
      .insert({ store_id, affiliate_id: aff.id, amount_cents: available, status: "requested" })
      .select()
      .single();
    if (pErr) return json({ error: "Failed to create payout" }, 500);

    await admin
      .from("affiliate_commissions")
      .update({ payout_id: payout.id })
      .in("id", list.map((r) => r.id));

    return json({ success: true, payout_id: payout.id, amount_cents: available });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, 500);
  }
});
