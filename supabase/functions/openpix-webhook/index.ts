import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

// Configurações de Split
const CREATOR_PERCENTAGE = 0.79; 
const OPENPIX_FEE_PERCENTAGE = 0.008;

// Função auxiliar para verificar a assinatura HMAC-SHA256
async function verifySignature(secret: string, signature: string | null, payload: string): Promise<boolean> {
  if (!signature) return false;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // O cabeçalho da OpenPix geralmente vem como "algo=hash", precisamos apenas do hash ou verificar conforme a doc.
  // Na OpenPix padrão, o header x-webhook-signature costuma ser o hash direto.
  // Vamos converter a assinatura hex recebida para Uint8Array
  const signatureBytes = new Uint8Array(
    signature.match(/[\da-f]{2}/gi)!.map((h) => parseInt(h, 16))
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(payload)
  );
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENPIX_APP_ID = Deno.env.get('OPENPIX_APP_ID');
    const OPENPIX_WEBHOOK_SECRET = Deno.env.get('OPENPIX_WEBHOOK_SECRET'); // <--- NOVO
    const CREATOR_PIX_KEY = Deno.env.get('CREATOR_PIX_KEY');
    const CREATOR_TAX_ID = Deno.env.get('CREATOR_TAX_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!OPENPIX_APP_ID || !CREATOR_PIX_KEY || !CREATOR_TAX_ID) {
      console.error('Missing configuration');
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500, headers: corsHeaders });
    }

    // 1. 🛡️ SEGURANÇA MÁXIMA: Verificar Assinatura
    // Precisamos ler o corpo como TEXTO primeiro para validar o hash
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    // Se você configurou o segredo na OpenPix, essa verificação é obrigatória
    if (OPENPIX_WEBHOOK_SECRET) {
      const isValid = await verifySignature(OPENPIX_WEBHOOK_SECRET, signature, rawBody);
      if (!isValid) {
        console.error('⚠️ Assinatura de Webhook Inválida! Tentativa de ataque?');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: corsHeaders });
      }
    } else {
        console.warn('⚠️ AVISO CRÍTICO: OPENPIX_WEBHOOK_SECRET não configurado. Seu webhook está vulnerável.');
        // Para não quebrar seu app agora, ele passa, mas você PRECISA configurar isso.
    }

    const payload = JSON.parse(rawBody);

    // Tratamento de Testes
    if ((payload as any).evento === 'teste_webhook') {
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
    }

    // Apenas eventos de cobrança completa
    if (payload.event !== 'OPENPIX:CHARGE_COMPLETED') {
      return new Response(JSON.stringify({ received: true, reason: 'ignored' }), { status: 200, headers: corsHeaders });
    }

    if (!payload.charge?.correlationID) {
      return new Response(JSON.stringify({ error: 'No correlationID' }), { status: 400, headers: corsHeaders });
    }

    const correlationID = payload.charge.correlationID;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Busca o pedido
    const { data: order, error: fetchError } = await supabase
      .from('custom_orders')
      .select('*')
      .eq('correlation_id', correlationID)
      .single();

    if (fetchError || !order) {
      console.error('Order not found:', correlationID);
      // Retornamos 200 para a OpenPix não ficar tentando reenviar infinitamente se o pedido não existe
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 200, headers: corsHeaders });
    }

    // Idempotência (Evita pagar duas vezes)
    if (['paid', 'payout_done', 'delivered'].includes(order.status) && order.payout_status !== 'failed') {
      return new Response(JSON.stringify({ received: true, reason: 'Already processed' }), { status: 200, headers: corsHeaders });
    }

    // --- LÓGICA DE PRODUTOS ---

    // 1. Assinatura VIP
    if (order.product_type === 'vip_subscription' && order.product_id) {
       await supabase.from('vip_subscriptions')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', order.product_id);

       await supabase.from('custom_orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', order.id);

       return new Response(JSON.stringify({ processed: true, type: 'vip' }), { status: 200, headers: corsHeaders });
    }

    // 2. Pedidos Customizados (Com Split)
    const totalCents = order.amount_cents;
    const creatorShareCents = Math.floor(totalCents * CREATOR_PERCENTAGE);
    
    // Atualiza status local
    await supabase.from('custom_orders')
      .update({ 
        status: 'paid', 
        paid_at: new Date().toISOString(),
        payout_amount_cents: creatorShareCents
      })
      .eq('id', order.id);

    // Dispara o Split (Pix Out)
    const payoutCorrelationID = `payout_${correlationID}`;
    
    console.log(`Iniciando Payout Seguro: ${creatorShareCents} cents para criador.`);

    const pixOutResponse = await fetch('https://api.openpix.com.br/api/v1/payment', {
      method: 'POST',
      headers: {
        'Authorization': OPENPIX_APP_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correlationID: payoutCorrelationID,
        value: creatorShareCents,
        destinationAlias: CREATOR_PIX_KEY,
        taxId: CREATOR_TAX_ID,
        comment: `Pagamento ${order.category}`,
      }),
    });

    const pixOutData = await pixOutResponse.json();

    if (!pixOutResponse.ok || pixOutData.error) {
      console.error('Erro no Payout:', pixOutData);
      await supabase.from('custom_orders')
        .update({ payout_status: 'failed', payout_correlation_id: payoutCorrelationID })
        .eq('id', order.id);
      
      // Retornamos 200 pois o webhook foi recebido com sucesso, o erro foi no nosso processo secundário
      return new Response(JSON.stringify({ error: 'Payout failed' }), { status: 200, headers: corsHeaders });
    }

    // Atualiza sucesso do Payout
    await supabase.from('custom_orders')
      .update({ 
        status: 'payout_done', 
        payout_correlation_id: payoutCorrelationID,
        payout_status: 'created'
      })
      .eq('id', order.id);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook Panic:', error);
    return new Response(JSON.stringify({ error: 'Internal Error' }), { status: 500, headers: corsHeaders });
  }
});