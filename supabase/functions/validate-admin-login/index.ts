import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple password comparison helper using Web Crypto API for timing-safe comparison
async function secureCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  
  if (aBytes.length !== bBytes.length) {
    return false;
  }
  
  // Use subtle crypto for timing-safe comparison
  const aHash = await crypto.subtle.digest('SHA-256', aBytes);
  const bHash = await crypto.subtle.digest('SHA-256', bBytes);
  
  const aArray = new Uint8Array(aHash);
  const bArray = new Uint8Array(bHash);
  
  let result = 0;
  for (let i = 0; i < aArray.length; i++) {
    result |= aArray[i] ^ bArray[i];
  }
  
  return result === 0;
}

// Hash password using Web Crypto API (SHA-256 with salt)
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `$sha256$${saltHex}$${hashHex}`;
}

// Verify password against stored hash
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Handle bcrypt hashes (legacy - just compare plaintext for migration)
  if (storedHash.startsWith('$2')) {
    // For bcrypt hashes, we can't verify without bcrypt library
    // Return false to force re-authentication or password reset
    console.log("Bcrypt hash detected - cannot verify in edge runtime");
    return false;
  }
  
  // Handle our SHA-256 format: $sha256$salt$hash
  if (storedHash.startsWith('$sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    
    const salt = parts[2];
    const expectedHash = parts[3];
    
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    const computedHash = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return await secureCompare(computedHash, expectedHash);
  }
  
  // Legacy plaintext comparison (for migration)
  return password === storedHash;
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

    // Validate input
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6 || password.length > 128) {
      return new Response(
        JSON.stringify({ success: false, error: "Senha inválida" }),
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

    // Verify password
    const passwordValid = await verifyPassword(password, data.password_hash);
    
    // If valid and using plaintext, migrate to secure hash
    if (passwordValid && !data.password_hash.startsWith('$')) {
      console.log(`Migrating plaintext password to SHA-256 for: ${email}`);
      const hashedPassword = await hashPassword(password);
      await supabase
        .from("admin_credentials")
        .update({ password_hash: hashedPassword, updated_at: new Date().toISOString() })
        .eq("email", email.toLowerCase());
    }

    if (!passwordValid) {
      console.log("Password mismatch for email:", email);
      return new Response(
        JSON.stringify({ success: false, error: "Credenciais inválidas" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sign in or create the admin user in Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: password,
    });

    let session = signInData?.session;
    let userId = signInData?.user?.id;

    // If user doesn't exist in auth, create them
    if (signInError && signInError.message.includes("Invalid login credentials")) {
      console.log(`Creating auth user for admin: ${email}`);
      
      // Create the user in Supabase Auth
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: password,
        email_confirm: true,
        user_metadata: { role: data.role }
      });

      if (createError) {
        console.error("Error creating auth user:", createError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao configurar autenticação" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = createData.user.id;

      // Sign in the newly created user
      const { data: newSignIn, error: newSignInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: password,
      });

      if (newSignInError) {
        console.error("Error signing in new user:", newSignInError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao fazer login" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      session = newSignIn.session;
      userId = newSignIn.user?.id;
    } else if (signInError) {
      console.error("Sign in error:", signInError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao fazer login" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!session || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao criar sessão" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure the user has the correct role in user_roles table
    const roleValue = data.role as 'admin' | 'ceo';
    
    // Check if role already exists
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", roleValue)
      .single();

    if (!existingRole) {
      // Insert the role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: roleValue });

      if (roleError) {
        console.error("Error assigning role:", roleError);
        // Non-fatal, continue with login
      } else {
        console.log(`Assigned ${roleValue} role to user ${userId}`);
      }
    }

    console.log(`Admin login successful: ${email} as ${data.role}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        role: data.role,
        email: data.email,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          expires_at: session.expires_at,
          user: session.user
        }
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
