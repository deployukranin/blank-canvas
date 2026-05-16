import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub as string;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData } = await adminClient
      .from("user_roles").select("role")
      .eq("user_id", callerId).eq("role", "super_admin").maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body for mode
    let body: any = {};
    if (req.method === "POST") {
      try { body = await req.json(); } catch { /* ignore */ }
    }
    const mode = body.mode || "stores"; // "stores" | "clients"

    // -----------------------------------------------------------------
    // MODE: "stores" — return only stores list + client counts (fast)
    // -----------------------------------------------------------------
    if (mode === "stores") {
      const { data: stores } = await adminClient
        .from("stores")
        .select("id, name, slug, status, plan_type, created_at, created_by")
        .order("created_at", { ascending: false });

      const storeIds = (stores || []).map((s) => s.id);

      // Count clients per store via grouped query
      const counts = new Map<string, number>();
      if (storeIds.length) {
        const { data: memberships } = await adminClient
          .from("store_users")
          .select("store_id")
          .in("store_id", storeIds);
        for (const m of memberships || []) {
          counts.set(m.store_id, (counts.get(m.store_id) || 0) + 1);
        }
      }

      // Resolve owner emails in a single paged scan only if owners exist
      const ownerIds = new Set<string>();
      (stores || []).forEach((s) => s.created_by && ownerIds.add(s.created_by));
      const emailMap = new Map<string, string>();
      if (ownerIds.size > 0) {
        let page = 1;
        const perPage = 1000;
        while (ownerIds.size > emailMap.size) {
          const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
          if (error || !data?.users?.length) break;
          for (const u of data.users) {
            if (ownerIds.has(u.id)) emailMap.set(u.id, u.email || "(sem email)");
          }
          if (data.users.length < perPage) break;
          page++;
          if (page > 20) break;
        }
      }

      const result = (stores || []).map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        status: s.status,
        plan_type: s.plan_type,
        created_at: s.created_at,
        owner_email: s.created_by ? emailMap.get(s.created_by) || null : null,
        client_count: counts.get(s.id) || 0,
      }));

      return new Response(JSON.stringify({ stores: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -----------------------------------------------------------------
    // MODE: "clients" — paginated clients for a single store
    // -----------------------------------------------------------------
    if (mode === "clients") {
      const storeId = body.store_id as string;
      const page = Math.max(1, Number(body.page) || 1);
      const pageSize = Math.min(200, Math.max(10, Number(body.page_size) || 50));
      const search = (body.search || "").toString().trim().toLowerCase();

      if (!storeId) {
        return new Response(JSON.stringify({ error: "store_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: memberships, count } = await adminClient
        .from("store_users")
        .select("user_id, created_at, banned_at", { count: "exact" })
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .range(from, to);

      const ids = new Set((memberships || []).map((m) => m.user_id));
      const emailMap = new Map<string, string>();

      // Resolve emails — paged listUsers, stop early when all found
      if (ids.size > 0) {
        let p = 1;
        const perPage = 1000;
        while (emailMap.size < ids.size) {
          const { data, error } = await adminClient.auth.admin.listUsers({ page: p, perPage });
          if (error || !data?.users?.length) break;
          for (const u of data.users) {
            if (ids.has(u.id)) emailMap.set(u.id, u.email || "(sem email)");
          }
          if (data.users.length < perPage) break;
          p++;
          if (p > 50) break;
        }
      }

      let clients = (memberships || []).map((m) => ({
        user_id: m.user_id,
        email: emailMap.get(m.user_id) || "(desconhecido)",
        joined_at: m.created_at,
        banned: !!m.banned_at,
      }));

      if (search) {
        clients = clients.filter((c) => c.email.toLowerCase().includes(search));
      }

      return new Response(JSON.stringify({
        clients,
        page,
        page_size: pageSize,
        total: count || 0,
        has_more: (count || 0) > to + 1,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown mode" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
