// Partner-only dashboard: returns stores assigned to caller and aggregated metrics
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sb(path: string, init: RequestInit = {}) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const token = auth.replace("Bearer ", "");

    // Validate token via auth/v1/user
    const ur = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
    });
    if (!ur.ok) return json({ error: "Unauthorized" }, 401);
    const me = await ur.json();
    const userId = me?.id;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    // Verify partner role
    const rr = await sb(
      `/rest/v1/user_roles?user_id=eq.${userId}&role=eq.partner&select=role&limit=1`,
    );
    if (!rr.ok || !Array.isArray(rr.data) || rr.data.length === 0) {
      return json({ error: "Forbidden" }, 403);
    }

    // Stores assigned
    const sr = await sb(
      `/rest/v1/stores?partner_id=eq.${userId}&select=id,name,slug,status,plan_type,created_at`,
    );
    if (!sr.ok) return json({ error: "Falha ao listar lojas" }, 500);
    const stores = (sr.data as Array<{ id: string; name: string; slug: string; status: string; plan_type: string; created_at: string }>) || [];

    let totalRevenue = 0;
    let totalActiveSubs = 0;
    const storeMetrics: Record<string, { revenue_cents: number; active_subs: number }> = {};

    if (stores.length) {
      const ids = stores.map((s) => s.id).join(",");
      const subs = await sb(
        `/rest/v1/vip_subscriptions?store_id=in.(${ids})&status=eq.active&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=store_id,price_cents`,
      );
      if (subs.ok) {
        for (const s of subs.data as Array<{ store_id: string; price_cents: number }>) {
          const m = storeMetrics[s.store_id] ||= { revenue_cents: 0, active_subs: 0 };
          m.revenue_cents += s.price_cents || 0;
          m.active_subs += 1;
          totalRevenue += s.price_cents || 0;
          totalActiveSubs += 1;
        }
      }
    }

    return json({
      stores: stores.map((s) => ({
        ...s,
        revenue_cents: storeMetrics[s.id]?.revenue_cents || 0,
        active_subs: storeMetrics[s.id]?.active_subs || 0,
      })),
      summary: {
        store_count: stores.length,
        total_revenue_cents: totalRevenue,
        total_active_subs: totalActiveSubs,
      },
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
