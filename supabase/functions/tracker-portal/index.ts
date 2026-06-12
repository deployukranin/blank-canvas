// Tracker portal: returns data isolated to ONE tracker, scoped by the set of
// store_ids attributed to that tracker through tracker_conversions (the signup
// defines attribution). Read-only. Session-authenticated (JWT).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const rest = (path: string) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
  }).then((r) => r.json());

async function userEmail(uid: string): Promise<string | null> {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u?.email || null;
  } catch {
    return null;
  }
}

async function emailsFor(uids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const unique = [...new Set(uids.filter(Boolean))].slice(0, 800);
  // Resolve in small concurrent batches to stay fast and bounded.
  for (let i = 0; i < unique.length; i += 20) {
    const batch = unique.slice(i, i + 20);
    const results = await Promise.all(batch.map((id) => userEmail(id)));
    batch.forEach((id, idx) => { if (results[idx]) out[id] = results[idx]!; });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const ur = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: ANON_KEY },
    });
    if (!ur.ok) return json({ error: "Unauthorized" }, 401);
    const me = await ur.json();
    const uid = me?.id;
    if (!uid) return json({ error: "Unauthorized" }, 401);

    // Resolve the tracker owned by this user
    const trackers = (await rest(
      `trackers?owner_user_id=eq.${encodeURIComponent(uid)}&select=id,name&limit=1`,
    )) as Array<{ id: string; name: string }>;
    if (!trackers.length) return json({ error: "Not a tracker" }, 403);
    const tid = trackers[0].id;

    // Compute attributed store_ids from conversions (signup defines attribution)
    const convs = (await rest(
      `tracker_conversions?tracker_id=eq.${tid}&select=store_id&limit=20000`,
    )) as Array<{ store_id: string | null }>;
    const storeIds = [...new Set(convs.map((c) => c.store_id).filter(Boolean))] as string[];

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const section = (body.section || "tenants") as string;

    if (!storeIds.length) {
      // Empty universe → empty results for every section
      const empty: Record<string, unknown> = {
        tenants: { tenants: [] },
        clients: { stores: [] },
        partners: { partners: [] },
        referrals: { commissions: [], summary: { sum_cents: {}, count: {} } },
        ranking: { stores: [] },
        support: { tickets: [] },
      };
      return json({ ok: true, tracker: trackers[0], ...((empty[section] as object) || {}) });
    }

    const inList = `in.(${storeIds.join(",")})`;

    // ----------------------------- TENANTS -----------------------------
    if (section === "tenants") {
      const tenants = await rest(
        `stores?id=${inList}&select=id,name,slug,status,plan_type,plan_expires_at,suspended_at,created_at,description&order=created_at.desc`,
      );
      return json({ ok: true, tracker: trackers[0], tenants });
    }

    // ----------------------------- CLIENTS -----------------------------
    if (section === "clients") {
      const stores = (await rest(
        `stores?id=${inList}&select=id,name,slug,status,plan_type,created_by`,
      )) as Array<any>;
      const memberships = (await rest(
        `store_users?store_id=${inList}&select=user_id,store_id,created_at,banned_at&order=created_at.desc&limit=20000`,
      )) as Array<any>;
      const emails = await emailsFor([
        ...memberships.map((m) => m.user_id),
        ...stores.map((s) => s.created_by),
      ]);
      const byStore = new Map<string, any[]>();
      for (const m of memberships) {
        const arr = byStore.get(m.store_id) || [];
        arr.push({
          user_id: m.user_id,
          email: emails[m.user_id] || "(desconhecido)",
          joined_at: m.created_at,
          banned: !!m.banned_at,
        });
        byStore.set(m.store_id, arr);
      }
      const out = stores.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        status: s.status,
        plan_type: s.plan_type,
        owner_email: s.created_by ? emails[s.created_by] || null : null,
        client_count: (byStore.get(s.id) || []).length,
        clients: byStore.get(s.id) || [],
      }));
      return json({ ok: true, tracker: trackers[0], stores: out });
    }

    // ----------------------------- PARTNERS -----------------------------
    if (section === "partners") {
      const stores = (await rest(
        `stores?id=${inList}&partner_id=not.is.null&select=id,name,slug,status,plan_type,partner_id`,
      )) as Array<any>;
      const emails = await emailsFor(stores.map((s) => s.partner_id));
      // Group by partner
      const groups = new Map<string, any>();
      for (const s of stores) {
        const g = groups.get(s.partner_id) || {
          partner_id: s.partner_id,
          email: emails[s.partner_id] || null,
          stores: [],
        };
        g.stores.push({ id: s.id, name: s.name, slug: s.slug, status: s.status, plan_type: s.plan_type });
        groups.set(s.partner_id, g);
      }
      return json({ ok: true, tracker: trackers[0], partners: [...groups.values()] });
    }

    // ----------------------------- REFERRALS -----------------------------
    if (section === "referrals") {
      const commissions = (await rest(
        `referral_commissions?referred_store_id=${inList}&select=*&order=created_at.desc&limit=2000`,
      )) as Array<any>;
      const refStoreIds = [...new Set(commissions.flatMap((c) => [c.referrer_store_id, c.referred_store_id]).filter(Boolean))];
      let storeMap: Record<string, any> = {};
      if (refStoreIds.length) {
        const sr = (await rest(`stores?id=in.(${refStoreIds.join(",")})&select=id,name,slug,plan_type,status,created_by`)) as Array<any>;
        for (const s of sr) storeMap[s.id] = s;
      }
      const sum: Record<string, number> = { pending: 0, available: 0, paid: 0, cancelled: 0 };
      const count: Record<string, number> = { pending: 0, available: 0, paid: 0, cancelled: 0 };
      for (const c of commissions) {
        if (sum[c.status] !== undefined) { sum[c.status] += c.commission_cents; count[c.status] += 1; }
      }
      const out = commissions.map((c) => ({
        ...c,
        referrer: storeMap[c.referrer_store_id] || null,
        referred: storeMap[c.referred_store_id] || null,
      }));
      return json({ ok: true, tracker: trackers[0], commissions: out, summary: { sum_cents: sum, count } });
    }

    // ----------------------------- RANKING -----------------------------
    if (section === "ranking") {
      const stores = (await rest(
        `stores?id=${inList}&select=id,name,slug,status`,
      )) as Array<any>;
      const members = (await rest(
        `store_users?store_id=${inList}&select=store_id&limit=50000`,
      )) as Array<any>;
      const orders = (await rest(
        `custom_orders?store_id=${inList}&select=store_id,amount_cents,status&limit=50000`,
      )) as Array<any>;
      const paid = orders.filter((o) => o.status === "paid" || o.status === "completed");
      const ranked = stores.map((s) => {
        const userCount = members.filter((m) => m.store_id === s.id).length;
        const revenue = paid.filter((o) => o.store_id === s.id).reduce((a, o) => a + (o.amount_cents || 0), 0) / 100;
        return { ...s, userCount, revenue };
      });
      ranked.sort((a, b) => (b.userCount * 10 + b.revenue) - (a.userCount * 10 + a.revenue));
      return json({ ok: true, tracker: trackers[0], stores: ranked });
    }

    // ----------------------------- SUPPORT -----------------------------
    if (section === "support") {
      const tickets = (await rest(
        `support_tickets?store_id=${inList}&select=*&order=updated_at.desc&limit=2000`,
      )) as Array<any>;
      const sIds = [...new Set(tickets.map((t) => t.store_id).filter(Boolean))];
      let storeMap: Record<string, any> = {};
      if (sIds.length) {
        const sr = (await rest(`stores?id=in.(${sIds.join(",")})&select=id,name,slug`)) as Array<any>;
        for (const s of sr) storeMap[s.id] = s;
      }
      const out = tickets.map((t) => ({
        ...t,
        store_name: t.store_name || storeMap[t.store_id]?.name || null,
      }));
      return json({ ok: true, tracker: trackers[0], tickets: out });
    }

    return json({ error: "Unknown section" }, 400);
  } catch (err) {
    return json({ ok: false, error: (err as Error).message }, 500);
  }
});
