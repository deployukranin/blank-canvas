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
    // Parse request body
    const { config_key, config_value } = await req.json();

    if (!config_key || config_value === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: "config_key e config_value são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate config_key
    const validKeys = ["video_config", "vip_config", "white_label_config"];
    if (!validKeys.includes(config_key)) {
      return new Response(
        JSON.stringify({ success: false, error: "config_key inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if config exists
    const { data: existing } = await supabase
      .from("app_configurations")
      .select("id")
      .eq("config_key", config_key)
      .maybeSingle();

    let error;
    if (existing) {
      // Update existing
      const result = await supabase
        .from("app_configurations")
        .update({
          config_value,
          updated_at: new Date().toISOString(),
        })
        .eq("config_key", config_key);
      error = result.error;
    } else {
      // Insert new
      const result = await supabase
        .from("app_configurations")
        .insert({
          config_key,
          config_value,
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

    console.log(`Config ${config_key} saved successfully`);

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
