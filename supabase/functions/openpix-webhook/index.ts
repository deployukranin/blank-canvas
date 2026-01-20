import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface OpenPixWebhookPayload {
  event: string;
  charge?: {
    correlationID: string;
    status: string;
    value: number;
    identifier: string;
  };
  pix?: {
    charge: {
      correlationID: string;
      status: string;
    };
    value: number;
    time: string;
    transactionID: string;
  };
}

// Validar assinatura do webhook (HMAC SHA-256)
async function validateWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    console.log("Signature ou secret não fornecidos, pulando validação");
    return true; // Se não houver secret configurado, aceita (para desenvolvimento)
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    const payloadBuffer = encoder.encode(payload);

    const isValid = await crypto.subtle.verify("HMAC", key, signatureBuffer, payloadBuffer);
    return isValid;
  } catch (error) {
    console.error("Erro ao validar assinatura:", error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== OpenPix Webhook Recebido ===");
  console.log("Method:", req.method);

  try {
    // Ler body como texto para validação de assinatura
    const rawBody = await req.text();
    const body: OpenPixWebhookPayload = JSON.parse(rawBody);
    
    console.log("Event:", body.event);
    console.log("Payload:", JSON.stringify(body, null, 2));

    // Validar assinatura do webhook (opcional, depende de OPENPIX_WEBHOOK_SECRET)
    const webhookSecret = Deno.env.get("OPENPIX_WEBHOOK_SECRET");
    const signature = req.headers.get("x-openpix-signature") || req.headers.get("x-webhook-secret");
    
    if (webhookSecret) {
      const isValid = await validateWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("Assinatura inválida do webhook");
        return new Response(
          JSON.stringify({ error: "Assinatura inválida" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Assinatura válida ✓");
    }

    // Extrair correlationID e charge_id
    const correlationID = body.charge?.correlationID || body.pix?.charge?.correlationID;
    const chargeId = body.charge?.identifier;
    
    if (!correlationID && !chargeId) {
      console.log("Webhook sem identificadores, ignorando");
      return new Response(
        JSON.stringify({ success: true, message: "Evento ignorado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("CorrelationID:", correlationID);
    console.log("ChargeID:", chargeId);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar pagamento - IDEMPOTÊNCIA por charge_id primeiro, depois correlationID
    let payment: Record<string, unknown> | null = null;
    
    if (chargeId) {
      const { data } = await supabase
        .from("pix_payments")
        .select("*, influencers(*)")
        .eq("charge_id", chargeId)
        .maybeSingle();
      payment = data;
    }
    
    if (!payment && correlationID) {
      const { data } = await supabase
        .from("pix_payments")
        .select("*, influencers(*)")
        .eq("correlation_id", correlationID)
        .maybeSingle();
      payment = data;
    }

    if (!payment) {
      console.log("Pagamento não encontrado");
      return new Response(
        JSON.stringify({ success: true, message: "Pagamento não encontrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Pagamento encontrado:", payment.id);
    console.log("Status atual:", payment.status);

    // IDEMPOTÊNCIA: Não processar se já foi completado
    const completedEvents = ["OPENPIX:CHARGE_COMPLETED", "OPENPIX:TRANSACTION_RECEIVED"];
    if (payment.status === "COMPLETED" && completedEvents.includes(body.event)) {
      console.log("Pagamento já processado (idempotência)");
      return new Response(
        JSON.stringify({ success: true, message: "Pagamento já processado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mapear status
    let newStatus = payment.status as string;
    let paidAt = payment.paid_at;

    switch (body.event) {
      case "OPENPIX:CHARGE_COMPLETED":
      case "OPENPIX:TRANSACTION_RECEIVED":
        newStatus = "COMPLETED";
        paidAt = new Date().toISOString();
        console.log("✅ Pagamento confirmado!");
        break;

      case "OPENPIX:CHARGE_EXPIRED":
        newStatus = "EXPIRED";
        console.log("⏰ Pagamento expirado");
        break;

      case "OPENPIX:TRANSACTION_REFUND_RECEIVED":
        newStatus = "REFUNDED";
        console.log("↩️ Pagamento estornado");
        break;

      default:
        console.log("Evento não mapeado:", body.event);
    }

    // Atualizar se status mudou
    if (newStatus !== payment.status) {
      const { error: updateError } = await supabase
        .from("pix_payments")
        .update({
          status: newStatus,
          paid_at: paidAt,
          charge_id: chargeId || payment.charge_id,
        })
        .eq("id", payment.id);

      if (updateError) {
        console.error("Erro ao atualizar:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar pagamento" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Status atualizado:", payment.status, "→", newStatus);

      // Ações pós-pagamento
      if (newStatus === "COMPLETED") {
        await handlePaymentCompleted(supabase, payment);
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no webhook:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handlePaymentCompleted(supabase: any, payment: Record<string, unknown>) {
  console.log("=== Processando Pagamento Confirmado ===");
  console.log("Payment ID:", payment.id);
  console.log("Product Type:", payment.product_type);
  console.log("User ID:", payment.user_id);
  
  // Log de split
  if (payment.influencer_id) {
    const influencer = payment.influencers as Record<string, unknown> | null;
    console.log("=== Split Processado ===");
    console.log("Influencer:", influencer?.name || payment.influencer_id);
    console.log("Valor Total:", payment.value);
    console.log("Valor Influencer:", payment.split_influencer_value);
    console.log("Valor Plataforma:", payment.split_platform_value);
  }

  // Ações por tipo de produto
  const productType = payment.product_type as string;
  const userId = payment.user_id as string;

  switch (productType) {
    case "VIP":
      console.log("🔓 Liberando VIP para:", userId);
      // TODO: Implementar ativação VIP
      break;

    case "SUBSCRIPTION":
      console.log("📦 Ativando assinatura para:", userId);
      // TODO: Implementar assinatura
      break;

    case "CUSTOM_VIDEO":
      console.log("🎬 Liberando vídeo custom:", payment.product_id);
      // TODO: Liberar conteúdo
      break;

    case "CONTENT":
      console.log("📄 Liberando conteúdo:", payment.product_id);
      // TODO: Liberar conteúdo
      break;

    default:
      console.log("Tipo sem ação especial:", productType);
  }
}
