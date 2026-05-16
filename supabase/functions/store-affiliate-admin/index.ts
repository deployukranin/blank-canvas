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

    const body = await req.json().catch(() => ({}));
    const { action, store_id } = body as { action?: string; store_id?: string };
    if (!action || !store_id) return json({ error: "Missing action/store_id" }, 400);

    const admin = createClient(SUPABASE_URL, SRK);

    // AuthZ: caller must own store, be store_admin, or super_admin
    const [{ data: store }, { data: roles }, { data: sAdm }] = await Promise.all([
      admin.from("stores").select("id, created_by").eq("id", store_id).maybeSingle(),
      admin.from("user_roles").select("role").eq("user_id", userId),
      admin.from("store_admins").select("id").eq("store_id", store_id).eq("user_id", userId).maybeSingle(),
    ]);
    if (!store) return json({ error: "Store not found" }, 404);
    const isSuper = (roles || []).some((r: any) => r.role === "super_admin");
    const isOwner = store.created_by === userId || !!sAdm;
    if (!isOwner && !isSuper) return json({ error: "Forbidden" }, 403);

    switch (action) {
      case "get_config": {
        const { data } = await admin.from("app_configurations")
          .select("config_value")
          .eq("store_id", store_id).eq("config_key", "affiliate_config").maybeSingle();
        return json({ config: data?.config_value || null });
      }
      case "update_config": {
        const cfg = body.config || {};
        // Sanitize
        const safe = {
          enabled: !!cfg.enabled,
          commission_percent: Math.max(0, Math.min(90, parseInt(cfg.commission_percent) || 0)),
          cookie_days: Math.max(1, Math.min(365, parseInt(cfg.cookie_days) || 30)),
          holding_days: Math.max(0, Math.min(180, parseInt(cfg.holding_days) || 14)),
          min_payout_cents: Math.max(0, parseInt(cfg.min_payout_cents) || 0),
          rules_md: String(cfg.rules_md || "").substring(0, 4000),
        };
        const { error } = await admin.from("app_configurations").upsert(
          { store_id, config_key: "affiliate_config", config_value: safe },
          { onConflict: "store_id,config_key" },
        );
        if (error) return json({ error: error.message }, 500);
        return json({ success: true, config: safe });
      }
      case "list_affiliates": {
        const { data: affs } = await admin
          .from("store_affiliates")
          .select("id, user_id, code, status, created_at")
          .eq("store_id", store_id)
          .order("created_at", { ascending: false });
        const userIds = (affs || []).map((a) => a.user_id);
        const { data: profs } = userIds.length
          ? await admin.from("profiles").select("user_id, display_name, handle").in("user_id", userIds)
          : { data: [] as any[] };
        const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
        // Aggregate totals
        const { data: sums } = await admin
          .from("affiliate_commissions")
          .select("affiliate_id, status, commission_cents")
          .eq("store_id", store_id);
        const totals = new Map<string, Record<string, number>>();
        for (const s of sums || []) {
          const t = totals.get(s.affiliate_id) || {};
          t[s.status] = (t[s.status] || 0) + (s.commission_cents || 0);
          totals.set(s.affiliate_id, t);
        }
        return json({
          items: (affs || []).map((a) => ({
            ...a,
            display_name: (profMap.get(a.user_id) as any)?.display_name || (profMap.get(a.user_id) as any)?.handle || null,
            totals: totals.get(a.id) || {},
          })),
        });
      }
      case "list_commissions": {
        const status = body.status as string | undefined;
        let q = admin.from("affiliate_commissions")
          .select("*").eq("store_id", store_id)
          .order("created_at", { ascending: false }).limit(500);
        if (status) q = q.eq("status", status);
        const { data } = await q;
        return json({ items: data || [] });
      }
      case "list_payouts": {
        const { data } = await admin.from("affiliate_payouts")
          .select("*, store_affiliates(code, user_id)")
          .eq("store_id", store_id).order("requested_at", { ascending: false });
        return json({ items: data || [] });
      }
      case "mark_payout_paid": {
        const { payout_id, note } = body;
        if (!payout_id) return json({ error: "payout_id required" }, 400);
        const { data: p } = await admin.from("affiliate_payouts")
          .select("id, status").eq("id", payout_id).eq("store_id", store_id).maybeSingle();
        if (!p) return json({ error: "Payout not found" }, 404);
        if (p.status !== "requested") return json({ error: "Already processed" }, 400);
        const now = new Date().toISOString();
        const { error: e1 } = await admin.from("affiliate_payouts").update({
          status: "paid", paid_at: now, paid_by_user_id: userId, note: String(note || "").substring(0, 1000),
        }).eq("id", payout_id);
        if (e1) return json({ error: e1.message }, 500);
        await admin.from("affiliate_commissions").update({
          status: "paid", paid_at: now, paid_by_user_id: userId, payment_note: String(note || "").substring(0, 1000),
        }).eq("payout_id", payout_id);
        return json({ success: true });
      }
      case "reject_payout": {
        const { payout_id, reason } = body;
        if (!payout_id) return json({ error: "payout_id required" }, 400);
        const { error: e1 } = await admin.from("affiliate_payouts").update({
          status: "rejected", reject_reason: String(reason || "").substring(0, 500),
        }).eq("id", payout_id).eq("store_id", store_id);
        if (e1) return json({ error: e1.message }, 500);
        // Detach commissions back to available
        await admin.from("affiliate_commissions").update({ payout_id: null }).eq("payout_id", payout_id);
        return json({ success: true });
      }
      case "cancel_commission": {
        const { commission_id, reason } = body;
        if (!commission_id) return json({ error: "commission_id required" }, 400);
        const { error: e1 } = await admin.from("affiliate_commissions").update({
          status: "cancelled", cancel_reason: String(reason || "").substring(0, 500),
        }).eq("id", commission_id).eq("store_id", store_id).in("status", ["pending", "available"]);
        if (e1) return json({ error: e1.message }, 500);
        return json({ success: true });
      }
      case "ban_affiliate": {
        const { affiliate_id, ban } = body;
        if (!affiliate_id) return json({ error: "affiliate_id required" }, 400);
        const { error } = await admin.from("store_affiliates")
          .update({ status: ban ? "banned" : "active" })
          .eq("id", affiliate_id).eq("store_id", store_id);
        if (error) return json({ error: error.message }, 500);
        return json({ success: true });
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: "Internal error" }, 500);
  }
});
