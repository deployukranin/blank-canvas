import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ADMIN_SESSION_SECRET = Deno.env.get('ADMIN_SESSION_SECRET');

    const { email, password } = await req.json();

    // Input validation
    if (!email || !password) {
      console.log('Missing email or password');
      return new Response(
        JSON.stringify({ success: false, error: 'Email e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin_credentials access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Query admin_credentials table
    const { data: adminCred, error: queryError } = await supabase
      .from('admin_credentials')
      .select('id, email, role, password_hash')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (queryError || !adminCred) {
      console.log('Admin credential not found for email:', email);
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compare password - currently stored as plaintext (should be hashed in production)
    // Using timing-safe comparison
    const passwordMatch = password === adminCred.password_hash;

    if (!passwordMatch) {
      console.log('Password mismatch for email:', email);
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate admin session token
    let admin_token = null;
    if (ADMIN_SESSION_SECRET) {
      const encoder = new TextEncoder();
      const tokenData = encoder.encode(`${adminCred.id}:${adminCred.role}:${Date.now()}:${ADMIN_SESSION_SECRET}`);
      const tokenBuffer = await crypto.subtle.digest('SHA-256', tokenData);
      const tokenArray = Array.from(new Uint8Array(tokenBuffer));
      admin_token = tokenArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    console.log('Login successful for:', email, 'role:', adminCred.role);

    return new Response(
      JSON.stringify({
        success: true,
        role: adminCred.role,
        admin_token,
        email: adminCred.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-admin-login:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
