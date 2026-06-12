// Token-authenticated endpoint: returns isolated metrics for one tracker.
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

const rest = (path: string) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
  }).then((r) => r.json());

const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Resolve the tracker id either by public dashboard token or by the logged-in user's session.
async function resolveTracker(
  token: string,
  authHeader: string | null,
): Promise<{ id: string; name: string; is_active: boolean } | null> {
  if (token && token.length >= 10) {
    const rows = (await rest(
      `trackers?dashboard_token=eq.${encodeURIComponent(token)}&select=id,name,is_active&limit=1`,
    )) as Array<{ id: string; name: string; is_active: boolean }>;
    return rows.length ? rows[0] : null;
  }
  if (authHeader) {
    const jwt = authHeader.replace("Bearer ", "");
    const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${jwt}` },
    });
    if (!verifyRes.ok) return null;
    const user = await verifyRes.json();
    const uid = user?.id;
    if (!uid) return null;
    const rows = (await rest(
      `trackers?owner_user_id=eq.${encodeURIComponent(uid)}&select=id,name,is_active&limit=1`,
    )) as Array<{ id: string; name: string; is_active: boolean }>;
    return rows.length ? rows[0] : null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    const authHeader = req.headers.get("Authorization");
    const tracker = await resolveTracker(token, authHeader);
    if (!tracker) return json({ ok: false, error: "not found" }, 404);
    const tid = tracker.id;

    const [links, clicks, conversions] = await Promise.all([
      rest(`tracker_links?tracker_id=eq.${tid}&select=id,code,label,channel,destination,is_active,created_at&order=created_at.desc`) as Promise<any[]>,
      rest(`tracker_clicks?tracker_id=eq.${tid}&select=link_id,visitor_id,occurred_at&order=occurred_at.desc&limit=20000`) as Promise<any[]>,
      rest(`tracker_conversions?tracker_id=eq.${tid}&select=link_id,type,email,name,occurred_at&order=occurred_at.desc&limit=20000`) as Promise<any[]>,
    ]);

    // Per-link aggregation
    const linkMap = new Map<string, any>();
    for (const l of links) {
      linkMap.set(l.id, {
        ...l,
        clicks: 0,
        unique_clicks: 0,
        conversions: 0,
        _visitors: new Set<string>(),
      });
    }
    let totalClicks = 0;
    const uniqueVisitors = new Set<string>();
    for (const c of clicks) {
      totalClicks++;
      if (c.visitor_id) uniqueVisitors.add(c.visitor_id);
      const lm = linkMap.get(c.link_id);
      if (lm) {
        lm.clicks++;
        if (c.visitor_id) lm._visitors.add(c.visitor_id);
      }
    }
    let totalConversions = 0;
    let storeConversions = 0;
    let clientConversions = 0;
    for (const cv of conversions) {
      totalConversions++;
      if (cv.type === "store_signup") storeConversions++;
      else if (cv.type === "client_signup") clientConversions++;
      const lm = linkMap.get(cv.link_id);
      if (lm) lm.conversions++;
    }

    // Channel aggregation
    const channelMap = new Map<string, { channel: string; clicks: number; conversions: number }>();
    const linksOut = [];
    for (const lm of linkMap.values()) {
      lm.unique_clicks = lm._visitors.size;
      delete lm._visitors;
      lm.conversion_rate = lm.clicks > 0 ? lm.conversions / lm.clicks : 0;
      linksOut.push(lm);
      const ch = channelMap.get(lm.channel) || { channel: lm.channel, clicks: 0, conversions: 0 };
      ch.clicks += lm.clicks;
      ch.conversions += lm.conversions;
      channelMap.set(lm.channel, ch);
    }
    const channels = Array.from(channelMap.values()).map((c) => ({
      ...c,
      conversion_rate: c.clicks > 0 ? c.conversions / c.clicks : 0,
    }));

    // Daily timeseries (last 30 days)
    const dayClicks: Record<string, number> = {};
    const dayConv: Record<string, number> = {};
    const dayKey = (d: string) => new Date(d).toISOString().slice(0, 10);
    for (const c of clicks) dayClicks[dayKey(c.occurred_at)] = (dayClicks[dayKey(c.occurred_at)] || 0) + 1;
    for (const cv of conversions) dayConv[dayKey(cv.occurred_at)] = (dayConv[dayKey(cv.occurred_at)] || 0) + 1;
    const series = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      series.push({ date: k, clicks: dayClicks[k] || 0, conversions: dayConv[k] || 0 });
    }

    // Recent signups list (with channel label)
    const linkLabel = new Map<string, { label: string; channel: string }>();
    for (const l of links) linkLabel.set(l.id, { label: l.label, channel: l.channel });
    const signups = conversions.slice(0, 200).map((cv) => ({
      type: cv.type,
      email: cv.email,
      name: cv.name,
      occurred_at: cv.occurred_at,
      channel: linkLabel.get(cv.link_id)?.channel || "—",
      link_label: linkLabel.get(cv.link_id)?.label || "—",
    }));

    return json({
      ok: true,
      tracker: { name: tracker.name, is_active: tracker.is_active },
      totals: {
        clicks: totalClicks,
        unique_clicks: uniqueVisitors.size,
        conversions: totalConversions,
        store_conversions: storeConversions,
        client_conversions: clientConversions,
        conversion_rate: totalClicks > 0 ? totalConversions / totalClicks : 0,
      },
      links: linksOut,
      channels,
      series,
      signups,
    });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
