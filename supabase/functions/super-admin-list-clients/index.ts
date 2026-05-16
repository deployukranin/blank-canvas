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

    // Fetch all stores
    const { data: stores } = await adminClient
      .from("stores")
      .select("id, name, slug, status, plan_type, created_at, created_by")
      .order("created_at", { ascending: false });

    // Fetch all memberships
    const { data: memberships } = await adminClient
      .from("store_users")
      .select("store_id, user_id, created_at, banned_at");

    // Collect all user ids (members + owners)
    const userIds = new Set<string>();
    (memberships || []).forEach((m) => userIds.add(m.user_id));
    (stores || []).forEach((s) => s.created_by && userIds.add(s.created_by));

    // Resolve emails by paginating auth users
    const emailMap = new Map<string, { email: string; created_at: string }>();
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) break;
      for (const u of data.users) {
        if (userIds.has(u.id)) {
          emailMap.set(u.id, { email: u.email || "(sem email)", created_at: u.created_at });
        }
      }
      if (data.users.length < perPage) break;
      page++;
      if (page > 50) break; // safety
    }

    const result = (stores || []).map((s) => {
      const owner = s.created_by ? emailMap.get(s.created_by) : null;
      const clients = (memberships || [])
        .filter((m) => m.store_id === s.id)
        .map((m) => {
          const info = emailMap.get(m.user_id);
          return {
            user_id: m.user_id,
            email: info?.email || "(desconhecido)",
            joined_at: m.created_at,
            banned: !!m.banned_at,
          };
        })
        .sort((a, b) => (a.joined_at < b.joined_at ? 1 : -1));

      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        status: s.status,
        plan_type: s.plan_type,
        created_at: s.created_at,
        owner_email: owner?.email || null,
        clients,
      };
    });

    return new Response(JSON.stringify({ stores: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
