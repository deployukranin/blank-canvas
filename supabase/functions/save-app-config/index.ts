import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-token",
};

// Simple HMAC-based token verification
async function verifyAdminToken(token: string): Promise<{ valid: boolean; email?: string; role?: string }> {
  const secret = Deno.env.get("ADMIN_SESSION_SECRET");
  if (!secret || !token) {
    return { valid: false };
  }

  try {
    // Token format: base64(email:role:timestamp):signature
    const [payload, signature] = token.split(".");
    if (!payload || !signature) {
      return { valid: false };
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const expectedSig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSigHex = Array.from(new Uint8Array(expectedSig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedSigHex) {
      return { valid: false };
    }

    // Decode payload
    const decoded = atob(payload);
    const [email, role, timestamp] = decoded.split(":");
    
    // Check if token is expired (24 hours)
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (now - tokenTime > maxAge) {
      console.log("Token expired");
      return { valid: false };
    }

    return { valid: true, email, role };
  } catch (err) {
    console.error("Token verification error:", err);
    return { valid: false };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Check admin token from header
    const adminToken = req.headers.get("x-admin-token");
    
    // Also check if there's a valid Supabase session (for regular auth users with admin role)
    const authHeader = req.headers.get("authorization");
    
    let isAuthorized = false;
    let adminInfo: { email?: string; role?: string } = {};

    // First, try admin token
    if (adminToken) {
      const tokenResult = await verifyAdminToken(adminToken);
      if (tokenResult.valid && (tokenResult.role === "admin" || tokenResult.role === "ceo")) {
        isAuthorized = true;
        adminInfo = { email: tokenResult.email, role: tokenResult.role };
        console.log(`Admin token verified for: ${tokenResult.email} (${tokenResult.role})`);
      }
    }

    // If no admin token, check Supabase auth
    if (!isAuthorized && authHeader?.startsWith("Bearer ")) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
      
      if (!claimsError && claimsData?.claims?.sub) {
        const userId = claimsData.claims.sub;
        
        // Check if user has admin or CEO role using service role
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: roles } = await adminSupabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (roles?.some((r) => r.role === "admin" || r.role === "ceo")) {
          isAuthorized = true;
          adminInfo = { email: claimsData.claims.email, role: roles[0].role };
          console.log(`Supabase user verified as admin: ${claimsData.claims.email}`);
        }
      }
    }

    if (!isAuthorized) {
      console.log("Unauthorized attempt to save config");
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    console.log(`Config ${config_key} saved by ${adminInfo.email} (${adminInfo.role})`);

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
