import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Hash password using SHA-256 with salt
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `$sha256$${salt}$${hashHex}`;
}

// Verify password against stored hash
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Parse the stored hash format: $sha256$salt$hash
  const parts = storedHash.split("$");
  if (parts.length !== 4 || parts[1] !== "sha256") {
    // Fallback: plain text comparison (for development)
    return password === storedHash;
  }
  
  const salt = parts[2];
  const expectedHash = await hashPassword(password, salt);
  return expectedHash === storedHash;
}

// Create an HMAC-signed admin token to be used as x-admin-token
async function createAdminToken(email: string, role: string): Promise<string | null> {
  const secret = Deno.env.get("ADMIN_SESSION_SECRET");
  if (!secret) {
    console.error("ADMIN_SESSION_SECRET not set");
    return null;
  }

  const timestamp = Date.now();
  const payload = btoa(`${email}:${role}:${timestamp}`);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${payload}.${signatureHex}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query admin_credentials table
    const { data, error } = await supabase
      .from("admin_credentials")
      .select("role, email, password_hash")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !data) {
      console.log("No admin credential found for email:", email);
      return new Response(
        JSON.stringify({ success: false, error: "Credenciais inválidas" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify password against stored hash
    const isValid = await verifyPassword(password, data.password_hash);
    
    if (!isValid) {
      console.log("Password mismatch for email:", email);
      return new Response(
        JSON.stringify({ success: false, error: "Credenciais inválidas" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin login successful: ${email} as ${data.role}`);

    const admin_token = await createAdminToken(data.email, data.role);

    return new Response(
      JSON.stringify({ 
        success: true, 
        role: data.role,
        email: data.email,
        admin_token,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error in validate-admin-login:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
