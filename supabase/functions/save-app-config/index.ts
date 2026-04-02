import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Validate Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Autenticação obrigatória" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate JWT using getClaims (local validation, no server roundtrip)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Invalid token:", claimsError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // 3. Check user role from user_roles table (admin or ceo required)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles, error: rolesError } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError.message);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao verificar permissões" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedRoles = ["admin", "ceo", "super_admin", "creator"];
    const hasPermission = roles?.some((r) => allowedRoles.includes(r.role));

    if (!hasPermission) {
      console.error(`Access denied for user ${userId} - required roles: ${allowedRoles.join(", ")}`);
      return new Response(
        JSON.stringify({ success: false, error: "Acesso negado: permissões administrativas necessárias (admin, creator, ceo ou super_admin)" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authorized config update by user ${userId} with roles: ${roles?.map(r => r.role).join(", ")}`);

    // 4. Parse request body
    const { config_key, config_value, store_id } = await req.json();

    if (!config_key || config_value === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: "config_key e config_value são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate config_key
    const validKeys = ["video_config", "vip_config", "white_label_config", "global_default_categories", "payment_config", "youtube_channel"];
    if (!validKeys.includes(config_key)) {
      return new Response(
        JSON.stringify({ success: false, error: "config_key inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Use service role to save config (bypasses RLS for the actual save operation)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Build query based on whether store_id is provided
    let existingQuery = serviceClient
      .from("app_configurations")
      .select("id")
      .eq("config_key", config_key);

    if (store_id) {
      existingQuery = existingQuery.eq("store_id", store_id);
    } else {
      existingQuery = existingQuery.is("store_id", null);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    let error;
    if (existing) {
      // Update existing
      let updateQuery = serviceClient
        .from("app_configurations")
        .update({
          config_value,
          updated_at: new Date().toISOString(),
        })
        .eq("config_key", config_key);
      
      if (store_id) {
        updateQuery = updateQuery.eq("store_id", store_id);
      } else {
        updateQuery = updateQuery.is("store_id", null);
      }
      
      const result = await updateQuery;
      error = result.error;
    } else {
      // Insert new
      const result = await serviceClient
        .from("app_configurations")
        .insert({
          config_key,
          config_value,
          ...(store_id ? { store_id } : {}),
        });
      error = result.error;
    }

    if (error) {
      console.error("Error saving config:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao salvar configuração" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Config ${config_key} saved successfully by user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in save-app-config:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
