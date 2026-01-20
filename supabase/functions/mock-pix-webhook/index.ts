import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Mock Webhook para Sandbox - Simula confirmação de pagamento PIX
 * 
 * ATENÇÃO: Esta função é APENAS para testes em ambiente de desenvolvimento.
 * Em produção, apenas webhooks reais do OpenPix devem atualizar pagamentos.
 * 
 * Uso:
 * POST /mock-pix-webhook
 * Body: {
 *   "correlationId": "uuid-do-pagamento",
 *   "event": "OPENPIX:CHARGE_COMPLETED" // ou "OPENPIX:TRANSACTION_RECEIVED"
 * }
 */

interface MockWebhookRequest {
  correlationId: string;
  event?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== Mock PIX Webhook - Simulação de Pagamento ===");

  try {
    const body: MockWebhookRequest = await req.json();
    const { correlationId, event = "OPENPIX:CHARGE_COMPLETED" } = body;

    console.log("Mock webhook recebido:", { correlationId, event });

    if (!correlationId) {
      return new Response(
        JSON.stringify({ error: "correlationId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar pagamento pelo correlationID com dados do influencer
    const { data: payment, error: findError } = await supabase
      .from("pix_payments")
      .select("*, influencers(*)")
      .eq("correlation_id", correlationId)
      .maybeSingle();

    if (findError) {
      console.error("Erro ao buscar pagamento:", findError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar pagamento", details: findError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payment) {
      console.log("Pagamento não encontrado para correlationId:", correlationId);
      return new Response(
        JSON.stringify({ error: "Pagamento não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Pagamento encontrado:", {
      id: payment.id,
      status: payment.status,
      value: payment.value,
      influencer_id: payment.influencer_id,
    });

    // Verificar idempotência - não processar novamente se já está pago
    if (payment.status === "COMPLETED") {
      console.log("Pagamento já processado (idempotência):", payment.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Pagamento já estava confirmado",
          payment: {
            id: payment.id,
            status: "COMPLETED",
            paid_at: payment.paid_at,
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simular processamento do webhook
    let newStatus = payment.status;
    let paidAt = payment.paid_at;

    if (event === "OPENPIX:CHARGE_COMPLETED" || event === "OPENPIX:TRANSACTION_RECEIVED") {
      newStatus = "COMPLETED";
      paidAt = new Date().toISOString();
      console.log("✅ Simulando pagamento CONFIRMADO!");
    } else if (event === "OPENPIX:CHARGE_EXPIRED") {
      newStatus = "EXPIRED";
      console.log("⚠️ Simulando pagamento EXPIRADO");
    } else if (event === "OPENPIX:TRANSACTION_REFUND_RECEIVED") {
      newStatus = "REFUNDED";
      console.log("↩️ Simulando ESTORNO");
    }

    // Atualizar status no banco
    const { error: updateError } = await supabase
      .from("pix_payments")
      .update({
        status: newStatus,
        paid_at: paidAt,
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Erro ao atualizar pagamento:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar pagamento", details: updateError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Status atualizado:", payment.status, "->", newStatus);

    // Processar ações pós-pagamento se completado
    if (newStatus === "COMPLETED") {
      const influencer = payment.influencers as Record<string, unknown> | null;
      
      console.log("=== Pagamento Confirmado - Detalhes do Split ===");
      console.log("Payment ID:", payment.id);
      console.log("Valor Total:", payment.value, "centavos (R$", (payment.value / 100).toFixed(2), ")");
      console.log("Produto:", payment.product_type);
      
      if (payment.influencer_id) {
        console.log("--- Split Automático ---");
        console.log("Influencer ID:", payment.influencer_id);
        console.log("Influencer Nome:", influencer?.name || "N/A");
        console.log("Valor Plataforma:", payment.split_platform_value, "centavos (R$", (payment.split_platform_value / 100).toFixed(2), ")");
        console.log("Valor Influencer:", payment.split_influencer_value, "centavos (R$", (payment.split_influencer_value / 100).toFixed(2), ")");
      }

      // Ações específicas por tipo de produto
      switch (payment.product_type) {
        case "VIP":
          console.log("🎉 Ação: Ativar acesso VIP para usuário:", payment.user_id);
          break;
        case "SUBSCRIPTION":
          console.log("📅 Ação: Ativar assinatura para usuário:", payment.user_id);
          break;
        case "CUSTOM_VIDEO":
          console.log("🎬 Ação: Liberar pedido de vídeo personalizado:", payment.product_id);
          break;
        case "CONTENT":
          console.log("📦 Ação: Liberar conteúdo pago:", payment.product_id);
          break;
        default:
          console.log("ℹ️ Tipo de produto sem ação especial:", payment.product_type);
      }
    }

    // Buscar pagamento atualizado para retornar
    const { data: updatedPayment } = await supabase
      .from("pix_payments")
      .select("*")
      .eq("id", payment.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Pagamento atualizado para ${newStatus}`,
        simulatedEvent: event,
        payment: {
          id: updatedPayment?.id,
          correlationId: updatedPayment?.correlation_id,
          status: updatedPayment?.status,
          value: updatedPayment?.value,
          valueBRL: `R$ ${(updatedPayment?.value / 100).toFixed(2)}`,
          paid_at: updatedPayment?.paid_at,
          product_type: updatedPayment?.product_type,
          split: payment.influencer_id ? {
            influencer_id: updatedPayment?.influencer_id,
            platform_value: updatedPayment?.split_platform_value,
            platform_valueBRL: `R$ ${(updatedPayment?.split_platform_value / 100).toFixed(2)}`,
            influencer_value: updatedPayment?.split_influencer_value,
            influencer_valueBRL: `R$ ${(updatedPayment?.split_influencer_value / 100).toFixed(2)}`,
          } : null,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no mock webhook:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
