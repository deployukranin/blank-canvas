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

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert the credential
    const { data, error } = await supabase
      .from("admin_credentials")
      .upsert(
        { 
          role, 
          email: email.toLowerCase(), 
          password_hash: password,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'role' }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating credentials:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao atualizar credenciais" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updated ${role} credentials for email: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        credential: data
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
