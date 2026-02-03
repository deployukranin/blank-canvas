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

    const { role, email, password } = await req.json();

    if (!role || !email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Role, email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!['admin', 'ceo'].includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: "Role inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: "Senha deve ter no mínimo 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length > 128) {
      return new Response(
        JSON.stringify({ success: false, error: "Senha muito longa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password);

    // Get old credential to find the old email
    const { data: oldCredential } = await serviceSupabase
      .from("admin_credentials")
      .select("email")
      .eq("role", role)
      .single();

    // Upsert the credential with hashed password
    const { data, error } = await serviceSupabase
      .from("admin_credentials")
      .upsert(
        { 
          role, 
          email: email.toLowerCase(), 
          password_hash: hashedPassword,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'role' }
      )
      .select("id, role, email, updated_at")
      .single();

    if (error) {
      console.error("Error updating credentials:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao atualizar credenciais" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If email changed, we need to update or create the auth user
    if (oldCredential && oldCredential.email !== email.toLowerCase()) {
      // Delete old auth user if exists
      const { data: oldUser } = await serviceSupabase.auth.admin.listUsers();
      const oldAuthUser = oldUser?.users?.find(u => u.email === oldCredential.email);
      if (oldAuthUser) {
        await serviceSupabase.auth.admin.deleteUser(oldAuthUser.id);
        console.log(`Deleted old auth user: ${oldCredential.email}`);
      }
    }

    // Update or create the auth user
    const { data: existingUsers } = await serviceSupabase.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(u => u.email === email.toLowerCase());

    if (existingAuthUser) {
      // Update password for existing user
      await serviceSupabase.auth.admin.updateUserById(existingAuthUser.id, {
        password: password,
        user_metadata: { role }
      });
      console.log(`Updated auth user password: ${email}`);
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await serviceSupabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        email_confirm: true,
        user_metadata: { role }
      });

      if (createError) {
        console.error("Error creating auth user:", createError);
      } else if (newUser?.user) {
        // Assign role
        await serviceSupabase
          .from("user_roles")
          .upsert({ user_id: newUser.user.id, role }, { onConflict: 'user_id,role' });
        console.log(`Created auth user and assigned ${role} role: ${email}`);
      }
    }

    console.log(`Updated ${role} credentials for email: ${email}`);

    // Return credential without password_hash
    return new Response(
      JSON.stringify({ 
        success: true, 
        credential: {
          id: data.id,
          role: data.role,
          email: data.email,
          updated_at: data.updated_at
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error in update-admin-credentials:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
