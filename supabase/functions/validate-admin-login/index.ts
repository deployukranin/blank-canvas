import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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

    // Secure password comparison using bcrypt
    let passwordValid = false;
    
    // Check if password_hash looks like a bcrypt hash (starts with $2)
    if (data.password_hash.startsWith('$2')) {
      // Compare using bcrypt
      passwordValid = await bcrypt.compare(password, data.password_hash);
    } else {
      // Legacy plaintext comparison for migration period
      // This path should be removed after all passwords are migrated
      passwordValid = data.password_hash === password;
      
      // Auto-migrate: hash the password and update the record
      if (passwordValid) {
        console.log(`Migrating plaintext password to bcrypt for: ${email}`);
        const hashedPassword = await bcrypt.hash(password);
        await supabase
          .from("admin_credentials")
          .update({ password_hash: hashedPassword, updated_at: new Date().toISOString() })
          .eq("email", email.toLowerCase());
      }
    }

    if (!passwordValid) {
      console.log("Password mismatch for email:", email);
      return new Response(
        JSON.stringify({ success: false, error: "Credenciais inválidas" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sign in or create the admin user in Supabase Auth
    // First, try to sign in with the admin email/password
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
