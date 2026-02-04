import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // 1. 🛡️ Autenticação Básica
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Auth required' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // 2. 🛡️ VERIFICAÇÃO DE HIERARQUIA (CEO/ADMIN)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // Consulta a role no banco
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // BLOQUEIA se não for CEO ou Admin
    if (!profile || !['ceo', 'admin', 'super_admin'].includes(profile.role)) {
      console.error(`Tentativa de acesso não autorizado por: ${user.id}`);
      return new Response(JSON.stringify({ error: 'Forbidden: Acesso restrito à diretoria.' }), { status: 403, headers: corsHeaders });
    }

    // === AQUI COMEÇA A LÓGICA DE DADOS (Agora segura) ===
    
    const { period, previewOnly, apiUrl, apiKey } = await req.json();

    // Exemplo de cálculo real de métricas (Simplificado para o exemplo)
    // Você pode adicionar queries reais aqui usando o supabase client
    
    // Calcular Receita Total (Exemplo)
    const { data: payments } = await supabase
      .from('custom_orders')
      .select('amount_cents')
      .eq('status', 'paid');
    
    const totalRevenue = payments?.reduce((acc, curr) => acc + (curr.amount_cents || 0), 0) || 0;
    
    // Calcular Usuários
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const metrics = {
      users: { total: userCount || 0, newInPeriod: 12, activeInPeriod: 450 }, // Exemplo
      payments: { 
        total: payments?.length || 0, 
        revenueTotal: totalRevenue, 
        totalInPeriod: 0 
      },
      videos: { totalViews: 15000, totalReactions: 3200, completionRate: 65 },
      community: { totalChatMessages: 8500, messagesInPeriod: 120 },
      influencers: { total: 50, active: 12, syncedWithWoovi: 10 },
      business: {
        conversionRate: 2.5,
        ltv: 15000, // R$ 150,00
        arpu: 4500,
        payingCustomers: 120,
        averageTicket: 8500,
        repeatPurchaseRate: 15,
        engagementRate: 22,
        videoEngagementRate: 45,
        revenueGrowthRate: 12,
        userGrowthRate: 8,
        influencerContributionRate: 40
      }
    };

    // Se for apenas Preview (usado pelo MetricsExportManager)
    if (previewOnly) {
      return new Response(
        JSON.stringify({ success: true, data: { metrics } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se for Envio para API Externa
    if (apiUrl && apiKey) {
      console.log(`Enviando métricas para ${apiUrl}...`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(metrics)
      });

      if (!response.ok) {
        throw new Error(`Falha no envio: ${response.statusText}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Métricas enviadas com sucesso' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: { metrics } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing metrics:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});