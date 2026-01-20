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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== OpenPix Webhook Recebido ===");
  console.log("Method:", req.method);

  try {
    const body: OpenPixWebhookPayload = await req.json();
    console.log("Webhook payload:", JSON.stringify(body, null, 2));

    // Extrair correlationID do payload
    const correlationID = body.charge?.correlationID || body.pix?.charge?.correlationID;
    
    if (!correlationID) {
      console.log("Webhook sem correlationID, ignorando");
      return new Response(
        JSON.stringify({ success: true, message: "Evento ignorado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("CorrelationID:", correlationID);
    console.log("Evento:", body.event);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar pagamento pelo correlationID com dados do influencer
    const { data: payment, error: findError } = await supabase
      .from("pix_payments")
      .select("*, influencers(*)")
      .eq("correlation_id", correlationID)
      .maybeSingle();

    if (findError) {
      console.error("Erro ao buscar pagamento:", findError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar pagamento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payment) {
      console.log("Pagamento não encontrado para correlationID:", correlationID);
      return new Response(
        JSON.stringify({ success: true, message: "Pagamento não encontrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Pagamento encontrado:", payment.id);

    // Verificar idempotência - não processar novamente se já está pago
    if (payment.status === "COMPLETED" && 
        (body.event === "OPENPIX:CHARGE_COMPLETED" || body.event === "OPENPIX:TRANSACTION_RECEIVED")) {
      console.log("Pagamento já processado (idempotência):", payment.id);
      return new Response(
        JSON.stringify({ success: true, message: "Pagamento já processado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mapear status do OpenPix para nosso status
    let newStatus = payment.status;
    let paidAt = payment.paid_at;

    // Eventos de pagamento confirmado
    if (body.event === "OPENPIX:CHARGE_COMPLETED" || body.event === "OPENPIX:TRANSACTION_RECEIVED") {
      newStatus = "COMPLETED";
      paidAt = new Date().toISOString();
      console.log("Pagamento confirmado!");
    } 
    // Eventos de expiração
    else if (body.event === "OPENPIX:CHARGE_EXPIRED") {
      newStatus = "EXPIRED";
      console.log("Pagamento expirado");
    }
    // Evento de estorno
    else if (body.event === "OPENPIX:TRANSACTION_REFUND_RECEIVED") {
      newStatus = "REFUNDED";
      console.log("Pagamento estornado");
    }

    // Atualizar status no banco se mudou
    if (newStatus !== payment.status) {
      const { error: updateError } = await supabase
        .from("pix_payments")
        .update({
          status: newStatus,
          paid_at: paidAt,
          charge_id: body.charge?.identifier || payment.charge_id,
        })
        .eq("id", payment.id);

      if (updateError) {
        console.error("Erro ao atualizar pagamento:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar pagamento" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Status atualizado:", payment.status, "->", newStatus);

      // Se pagamento completado, executar ações específicas do produto
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
  
  // Log de split se houver influencer
  if (payment.influencer_id) {
    const influencer = payment.influencers as Record<string, unknown> | null;
    console.log("=== Split Processado Automaticamente pela OpenPix ===");
    console.log("Influencer ID:", payment.influencer_id);
    console.log("Influencer Name:", influencer?.name || "N/A");
    console.log("Charge ID:", payment.charge_id);
    console.log("OpenPix Split ID:", payment.openpix_split_id);
    console.log("Valor Total:", payment.value);
    console.log("Valor Influencer:", payment.split_influencer_value);
    console.log("Valor Plataforma:", payment.split_platform_value);
  }

  // Ações específicas por tipo de produto
  const productType = payment.product_type as string;
  const userId = payment.user_id as string;

  switch (productType) {
    case "VIP":
      console.log("Ativar VIP para usuário:", userId);
      // Implementar lógica de ativação VIP
      break;

    case "SUBSCRIPTION":
      console.log("Ativar assinatura para usuário:", userId);
      // Implementar lógica de assinatura
      break;

    case "CUSTOM_VIDEO":
      console.log("Liberar pedido de vídeo personalizado:", payment.product_id);
      // Implementar lógica de liberação de conteúdo
      break;

    case "CONTENT":
      console.log("Liberar conteúdo pago:", payment.product_id);
      // Implementar lógica de liberação de conteúdo
      break;

    default:
      console.log("Tipo de produto sem ação especial:", productType);
  }
}
