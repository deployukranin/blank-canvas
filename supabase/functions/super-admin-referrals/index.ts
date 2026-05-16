// Super-admin only: manage referral commissions
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
    const sUrl = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const token = auth.replace("Bearer ", "");

    const ur = await fetch(`${sUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
    });
    if (!ur.ok) return json({ error: "Unauthorized" }, 401);
    const me = await ur.json();
    const userId = me?.id;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const rr = await sb(`/rest/v1/user_roles?user_id=eq.${userId}&role=eq.super_admin&select=role&limit=1`);
    if (!rr.ok || !Array.isArray(rr.data) || rr.data.length === 0) return json({ error: "Forbidden" }, 403);

    // Move eligible pending→available before responding (lightweight refresh)
    await sb(`/rest/v1/rpc/mark_eligible_commissions`, { method: "POST", body: "{}" });

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = (body.action || "list") as string;

    if (action === "list") {
      const status = body.status as string | undefined;
      const filter = status ? `&status=eq.${status}` : "";
      const r = await sb(
        `/rest/v1/referral_commissions?select=*${filter}&order=created_at.desc&limit=500`,
      );
      if (!r.ok) return json({ error: "Failed to list" }, 500);
      const rows = (r.data as Array<any>) || [];
      const storeIds = [...new Set(rows.flatMap((x) => [x.referrer_store_id, x.referred_store_id]))];
      let stores: Record<string, any> = {};
      if (storeIds.length) {
        const sr = await sb(
          `/rest/v1/stores?id=in.(${storeIds.join(",")})&select=id,name,slug,created_by,plan_type,status`,
        );
        if (sr.ok) for (const s of sr.data as Array<any>) stores[s.id] = s;
      }
      // Lookup creator emails via auth.admin
      const userIds = [...new Set(Object.values(stores).map((s: any) => s.created_by).filter(Boolean))];
      const emails: Record<string, string> = {};
      for (const uid of userIds) {
        const er = await fetch(`${sUrl}/auth/v1/admin/users/${uid}`, {
          headers: {
            apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
          },
        });
        if (er.ok) { const u = await er.json(); if (u?.email) emails[uid] = u.email; }
      }
      return json({
        commissions: rows.map((c) => ({
          ...c,
          referrer: stores[c.referrer_store_id]
            ? { ...stores[c.referrer_store_id], email: emails[stores[c.referrer_store_id].created_by] || null }
            : null,
          referred: stores[c.referred_store_id]
            ? { ...stores[c.referred_store_id], email: emails[stores[c.referred_store_id].created_by] || null }
            : null,
        })),
      });
    }

    if (action === "by_referrer") {
      // All commissions
      const cr = await sb(`/rest/v1/referral_commissions?select=*&order=created_at.desc&limit=2000`);
      if (!cr.ok) return json({ error: "Failed" }, 500);
      const commissions = (cr.data as Array<any>) || [];

      // All referred stores (even those without commissions yet)
      const rs = await sb(`/rest/v1/stores?referred_by_store_id=not.is.null&select=id,name,slug,plan_type,status,created_at,referred_by_store_id,created_by&order=created_at.desc&limit=2000`);
      if (!rs.ok) return json({ error: "Failed" }, 500);
      const referredStores = (rs.data as Array<any>) || [];

      const referrerIds = [...new Set([
        ...commissions.map((c) => c.referrer_store_id),
        ...referredStores.map((s) => s.referred_by_store_id),
      ].filter(Boolean))];

      let referrers: Record<string, any> = {};
      if (referrerIds.length) {
        const sr = await sb(`/rest/v1/stores?id=in.(${referrerIds.join(",")})&select=id,name,slug,created_by`);
        if (sr.ok) for (const s of sr.data as Array<any>) referrers[s.id] = s;
      }

      const userIds = [...new Set([
        ...Object.values(referrers).map((s: any) => s.created_by),
        ...referredStores.map((s) => s.created_by),
      ].filter(Boolean))];
      const emails: Record<string, string> = {};
      for (const uid of userIds) {
        const er = await fetch(`${sUrl}/auth/v1/admin/users/${uid}`, {
          headers: {
            apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
          },
        });
        if (er.ok) { const u = await er.json(); if (u?.email) emails[uid] = u.email; }
      }

      // Group: referrerId -> { referrer, signups[], commissions[] , totals }
      const groups: Record<string, any> = {};
      const ensure = (rid: string) => {
        if (!groups[rid]) {
          const r = referrers[rid];
          groups[rid] = {
            referrer_id: rid,
            referrer: r ? { ...r, email: emails[r.created_by] || null } : null,
            signups: [],
            commissions: [],
            totals: { pending: 0, available: 0, paid: 0, cancelled: 0, signups: 0 },
          };
        }
        return groups[rid];
      };

      for (const s of referredStores) {
        const g = ensure(s.referred_by_store_id);
        g.signups.push({ ...s, email: emails[s.created_by] || null });
        g.totals.signups += 1;
      }
      for (const c of commissions) {
        const g = ensure(c.referrer_store_id);
        g.commissions.push(c);
        (g.totals as any)[c.status] += c.commission_cents;
      }

      const list = Object.values(groups).sort((a: any, b: any) =>
        (b.totals.available + b.totals.pending) - (a.totals.available + a.totals.pending) || b.totals.signups - a.totals.signups
      );
      return json({ groups: list });
    }

    if (action === "summary") {
      const r = await sb(`/rest/v1/referral_commissions?select=status,commission_cents`);
      if (!r.ok) return json({ error: "Failed" }, 500);
      const rows = (r.data as Array<{ status: string; commission_cents: number }>) || [];
      const sum = { pending: 0, available: 0, paid: 0, cancelled: 0 };
      const count = { pending: 0, available: 0, paid: 0, cancelled: 0 };
      for (const r of rows) {
        (sum as any)[r.status] += r.commission_cents;
        (count as any)[r.status] += 1;
      }
      return json({ sum_cents: sum, count });
    }

    if (action === "mark_paid") {
      const id = body.id as string;
      const note = (body.payment_note || "") as string;
      if (!id) return json({ error: "id required" }, 400);
      const r = await sb(`/rest/v1/referral_commissions?id=eq.${id}&status=eq.available`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status: "paid", paid_at: new Date().toISOString(), paid_by_user_id: userId, payment_note: note }),
      });
      if (!r.ok || !Array.isArray(r.data) || r.data.length === 0) return json({ error: "Not found or not available" }, 400);
      return json({ success: true });
    }

    if (action === "cancel") {
      const id = body.id as string;
      const reason = (body.cancel_reason || "") as string;
      if (!id) return json({ error: "id required" }, 400);
      const r = await sb(`/rest/v1/referral_commissions?id=eq.${id}&status=in.(pending,available)`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status: "cancelled", cancel_reason: reason }),
      });
      if (!r.ok || !Array.isArray(r.data) || r.data.length === 0) return json({ error: "Not found" }, 400);
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
