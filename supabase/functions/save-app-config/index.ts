import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ignoredConfigWrite = (error: string, extra: Record<string, unknown> = {}) =>
  jsonResponse({ success: false, ignored: true, error, ...extra }, 200);

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
      return jsonResponse({ success: false, error: "Autenticação obrigatória" }, 401);
    }

    // 2. Validate JWT using getClaims (local validation, no server roundtrip)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Invalid token:", claimsError?.message);
      return jsonResponse({ success: false, error: "Token inválido ou expirado" }, 401);
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
      return jsonResponse({ success: false, error: "Erro ao verificar permissões" }, 500);
    }

    const userRoles = new Set((roles || []).map((r) => r.role));
    const isPlatformAdmin = userRoles.has("ceo") || userRoles.has("super_admin");
    const isStoreManagerRole = userRoles.has("admin") || userRoles.has("creator");

    if (!isPlatformAdmin && !isStoreManagerRole) {
      return ignoredConfigWrite("Acesso negado: permissões administrativas necessárias", { reason: "missing_admin_role" });
    }

    // 4. Parse request body
    const { config_key, config_value, store_id } = await req.json();

    if (!config_key || config_value === undefined) {
      return jsonResponse({ success: false, error: "config_key e config_value são obrigatórios" }, 400);
    }

    // Validate config_key
    const validKeys = ["video_config", "vip_config", "white_label_config", "global_default_categories", "payment_config", "youtube_channel", "social_links", "platform_settings", "platform_plans", "content_settings"];
    if (!validKeys.includes(config_key)) {
      return jsonResponse({ success: false, error: "config_key inválido" }, 400);
    }

    // 4b. Ownership check — platform configs (store_id null) require CEO/super_admin;
    // store-scoped configs require that the caller actually owns/admins THAT store.
    // Without this, any admin/creator role could overwrite configs of other tenants
    // by passing an arbitrary store_id in the body (tenant escape).
    const platformOnlyKeys = new Set(["platform_settings", "platform_plans"]);
    const storeScopedKeys = new Set([
      "video_config",
      "vip_config",
      "white_label_config",
      "global_default_categories",
      "payment_config",
      "youtube_channel",
      "social_links",
      "content_settings",
    ]);

    // Older frontend bundles could send tenant configs without store_id, which
    // used to be treated as an attempted global write and returned 403. Do not
    // save anything in that case, but return a controlled 200 so the UI does not
    // crash while HMR/CDN catches up. Platform-only keys still require CEO/SA.
    if (!store_id && storeScopedKeys.has(config_key) && !isPlatformAdmin) {
      console.warn(`Ignored ${config_key} save without store_id by user ${userId}`);
      return ignoredConfigWrite("store_id obrigatório para configurações da loja", { reason: "missing_store_id" });
    }

    if (!store_id || platformOnlyKeys.has(config_key)) {
      if (!isPlatformAdmin) {
        console.warn(`Ignored global ${config_key} save by non-platform admin ${userId}`);
        return ignoredConfigWrite("Acesso negado: apenas CEO/super_admin podem alterar configurações globais", { reason: "platform_admin_required" });
      }
    } else if (!isPlatformAdmin) {
      // Verify the caller manages the target store
      const [{ data: ownedStore }, { data: storeAdminRow }] = await Promise.all([
        serviceClient.from("stores").select("id").eq("id", store_id).eq("created_by", userId).maybeSingle(),
        serviceClient.from("store_admins").select("id").eq("store_id", store_id).eq("user_id", userId).maybeSingle(),
      ]);
      if (!ownedStore && !storeAdminRow) {
        return ignoredConfigWrite("Acesso negado: você não gerencia esta loja", { reason: "store_not_managed" });
      }
    }

    // 5. Use service role to save config (bypasses RLS for the actual save operation)
    // serviceClient already created above for role check

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
      return jsonResponse({ success: false, error: "Erro ao salvar configuração" }, 500);
    }

    console.log(`Config ${config_key} saved successfully by user ${userId}`);

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Error in save-app-config:", err);
    return jsonResponse({ success: false, error: "Erro interno do servidor" }, 500);
  }
});
