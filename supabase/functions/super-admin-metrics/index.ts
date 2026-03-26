import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify super_admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all data in parallel
    const [
      storesRes,
      ordersRes,
      usersRes,
      vipSubsRes,
      ticketsRes,
      vipContentRes,
      ideasRes,
      chatMsgsRes,
      inviteCodesRes,
      profilesRes,
    ] = await Promise.all([
      adminClient.from("stores").select("id, name, slug, status, plan_type, plan_expires_at, created_at, created_by"),
      adminClient.from("custom_orders").select("id, store_id, amount_cents, status, created_at, paid_at"),
      adminClient.from("store_users").select("id, store_id, created_at"),
      adminClient.from("vip_subscriptions").select("id, store_id, status, price_cents, plan_type, created_at, expires_at"),
      adminClient.from("support_tickets").select("id, store_id, status, created_at"),
      adminClient.from("vip_content").select("id, store_id, created_at"),
      adminClient.from("video_ideas").select("id, store_id, votes, created_at"),
      adminClient.from("video_chat_messages").select("id, store_id, created_at"),
      adminClient.from("invite_codes").select("id, store_id, used_count, max_uses, is_active"),
      adminClient.from("profiles").select("id, created_at"),
    ]);

    const stores = storesRes.data || [];
    const orders = ordersRes.data || [];
    const storeUsers = usersRes.data || [];
    const vipSubs = vipSubsRes.data || [];
    const tickets = ticketsRes.data || [];
    const vipContent = vipContentRes.data || [];
    const ideas = ideasRes.data || [];
    const chatMsgs = chatMsgsRes.data || [];
    const inviteCodes = inviteCodesRes.data || [];
    const profiles = profilesRes.data || [];

    const now = new Date();

    // Global metrics
    const paidOrders = orders.filter(o => o.status === "paid" || o.status === "completed");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0) / 100;
    const activeVipSubs = vipSubs.filter(s => s.status === "active" && new Date(s.expires_at) > now);
    const vipMRR = activeVipSubs.reduce((sum, s) => sum + (s.price_cents || 0), 0) / 100;
    const openTickets = tickets.filter(t => t.status === "open" || t.status === "answered");

    // Per-store metrics
    const perStore = stores.map(store => {
      const sOrders = orders.filter(o => o.store_id === store.id);
      const sPaidOrders = sOrders.filter(o => o.status === "paid" || o.status === "completed");
      const sUsers = storeUsers.filter(u => u.store_id === store.id);
      const sVip = vipSubs.filter(v => v.store_id === store.id);
      const sActiveVip = sVip.filter(v => v.status === "active" && new Date(v.expires_at) > now);
      const sTickets = tickets.filter(t => t.store_id === store.id);
      const sContent = vipContent.filter(c => c.store_id === store.id);
      const sIdeas = ideas.filter(i => i.store_id === store.id);
      const sMsgs = chatMsgs.filter(m => m.store_id === store.id);
      const sInvites = inviteCodes.filter(c => c.store_id === store.id);
      const sRevenue = sPaidOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0) / 100;
      const sVipRevenue = sActiveVip.reduce((sum, v) => sum + (v.price_cents || 0), 0) / 100;

      // Last 30 days activity
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      const recentOrders = sOrders.filter(o => new Date(o.created_at) > thirtyDaysAgo).length;
      const recentUsers = sUsers.filter(u => new Date(u.created_at) > thirtyDaysAgo).length;
      const recentMsgs = sMsgs.filter(m => new Date(m.created_at) > thirtyDaysAgo).length;

      return {
        store_id: store.id,
        name: store.name,
        slug: store.slug,
        status: store.status,
        plan_type: store.plan_type,
        plan_expires_at: store.plan_expires_at,
        created_at: store.created_at,
        users_count: sUsers.length,
        orders_total: sOrders.length,
        orders_paid: sPaidOrders.length,
        revenue: sRevenue,
        vip_active: sActiveVip.length,
        vip_total: sVip.length,
        vip_revenue: sVipRevenue,
        content_count: sContent.length,
        ideas_count: sIdeas.length,
        ideas_votes: sIdeas.reduce((s, i) => s + (i.votes || 0), 0),
        chat_messages: sMsgs.length,
        tickets_open: sTickets.filter(t => t.status === "open").length,
        tickets_total: sTickets.length,
        invites_active: sInvites.filter(c => c.is_active).length,
        invites_used: sInvites.reduce((s, c) => s + (c.used_count || 0), 0),
        recent_orders_30d: recentOrders,
        recent_users_30d: recentUsers,
        recent_messages_30d: recentMsgs,
      };
    });

    // Monthly growth (last 6 months)
    const monthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = d.toLocaleDateString("pt-BR", { month: "short" });
      monthlyGrowth.push({
        month: label.charAt(0).toUpperCase() + label.slice(1),
        stores: stores.filter(s => new Date(s.created_at) < nextD).length,
        users: profiles.filter(p => new Date(p.created_at) < nextD).length,
        new_stores: stores.filter(s => {
          const c = new Date(s.created_at);
          return c >= d && c < nextD;
        }).length,
        new_users: profiles.filter(p => {
          const c = new Date(p.created_at);
          return c >= d && c < nextD;
        }).length,
        revenue: paidOrders
          .filter(o => o.paid_at && new Date(o.paid_at) >= d && new Date(o.paid_at) < nextD)
          .reduce((s, o) => s + (o.amount_cents || 0), 0) / 100,
      });
    }

    const result = {
      global: {
        total_stores: stores.length,
        active_stores: stores.filter(s => s.status === "active").length,
        suspended_stores: stores.filter(s => s.status === "suspended").length,
        trial_stores: stores.filter(s => s.plan_type === "trial").length,
        paid_stores: stores.filter(s => s.plan_type === "paid").length,
        total_users: profiles.length,
        total_store_users: storeUsers.length,
        total_orders: orders.length,
        paid_orders: paidOrders.length,
        total_revenue: totalRevenue,
        active_vip_subs: activeVipSubs.length,
        total_vip_subs: vipSubs.length,
        vip_mrr: vipMRR,
        open_tickets: openTickets.length,
        total_tickets: tickets.length,
        total_content: vipContent.length,
        total_ideas: ideas.length,
        total_chat_messages: chatMsgs.length,
        conversion_rate: stores.length > 0
          ? Math.round((stores.filter(s => s.plan_type === "paid").length / stores.length) * 100)
          : 0,
      },
      per_store: perStore,
      monthly_growth: monthlyGrowth,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
