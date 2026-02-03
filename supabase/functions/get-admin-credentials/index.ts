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
    // Verify the caller is authenticated and has CEO role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Verify the user's JWT
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await userSupabase.auth.getClaims(token);
    
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;
    
    // Use service role to check if user has CEO role
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData, error: roleError } = await serviceSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "ceo")
      .single();

    if (roleError || !roleData) {
      console.log("User is not a CEO:", userId);
      return new Response(
        JSON.stringify({ success: false, error: "Acesso restrito ao CEO" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query admin_credentials table - NEVER return password_hash
    const { data, error } = await serviceSupabase
      .from("admin_credentials")
      .select("id, role, email, created_at, updated_at")
      .order("role");

    if (error) {
      console.error("Error fetching credentials:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao buscar credenciais" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetched ${data?.length || 0} admin credentials (without passwords)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        credentials: data || []
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error in get-admin-credentials:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
