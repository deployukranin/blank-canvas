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
  console.log("Headers:", Object.fromEntries(req.headers.entries()));

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

    // Buscar pagamento pelo correlationID
    const { data: payment, error: findError } = await supabase
      .from("pix_payments")
      .select("*")
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

async function handlePaymentCompleted(supabase: any, payment: any) {
  console.log("Processando pagamento completado:", payment.product_type);

  // Ações específicas por tipo de produto
  switch (payment.product_type) {
    case "VIP":
      // Aqui você pode adicionar lógica para ativar VIP do usuário
      console.log("Ativar VIP para usuário:", payment.user_id);
      // Exemplo: atualizar tabela de usuários, enviar email, etc.
      break;

    case "SUBSCRIPTION":
      console.log("Ativar assinatura para usuário:", payment.user_id);
      break;

    case "CUSTOM_VIDEO":
      console.log("Criar pedido de vídeo personalizado:", payment.product_id);
      break;

    default:
      console.log("Tipo de produto não requer ação especial:", payment.product_type);
  }
}
