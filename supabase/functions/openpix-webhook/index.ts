import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-openpix-signature",
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

// Taxa OpenPix fixa de 0.80%
const OPENPIX_FEE_RATE = 0.008;

// Percentuais por tipo de pedido
const SPLIT_CONFIG = {
  creator_custom: {
    influencer_pct: 0.80, // 80% para influenciador
    who_pays_fee: "influencer" as const,
  },
  platform_store: {
    influencer_pct: 0.30, // 30% para influenciador
    who_pays_fee: "platform" as const,
  },
};

// Validar assinatura do webhook (HMAC SHA-256)
async function validateWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    console.log("Signature ou secret não fornecidos, pulando validação");
    return true;
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

    const signatureBuffer = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    const payloadBuffer = encoder.encode(payload);

    return await crypto.subtle.verify("HMAC", key, signatureBuffer, payloadBuffer);
  } catch (error) {
    console.error("Erro ao validar assinatura:", error);
    return false;
  }
}

// Calcular split baseado no tipo de pedido
function calculateSplit(amountCents: number, orderType: "creator_custom" | "platform_store") {
  const config = SPLIT_CONFIG[orderType];
  const feeCents = Math.round(amountCents * OPENPIX_FEE_RATE);
  const influencerGrossCents = Math.floor(amountCents * config.influencer_pct);

  let influencerPayoutCents: number;
  if (config.who_pays_fee === "influencer") {
    influencerPayoutCents = influencerGrossCents - feeCents;
  } else {
    influencerPayoutCents = influencerGrossCents;
  }

  const platformCents = amountCents - influencerGrossCents;

  return {
    feeCents,
    influencerGrossCents,
    influencerPayoutCents,
    platformCents,
    whoPayssFee: config.who_pays_fee,
  };
}

// Executar Pix Out para o influenciador
async function executePixOut(
  appId: string,
  pixKey: string,
  amountCents: number,
  correlationId: string,
  influencerName: string
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  const paymentCorrelationId = `payout_${correlationId}`;

  console.log("=== Executando Pix Out ===");
  console.log("Valor:", amountCents, "centavos");
  console.log("Chave PIX:", pixKey);
  console.log("Correlation ID:", paymentCorrelationId);

  try {
    // Criar pagamento Pix Out
    const paymentResponse = await fetch("https://api.openpix.com.br/api/v1/payment", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: appId,
      },
      body: JSON.stringify({
        value: amountCents,
        destinationAlias: pixKey,
        comment: `Repasse automático - ${correlationId} - ${influencerName}`,
        correlationID: paymentCorrelationId,
      }),
    });

    const paymentData = await paymentResponse.json();
    console.log("Resposta criação pagamento:", JSON.stringify(paymentData, null, 2));

    if (!paymentResponse.ok) {
      console.error("Erro ao criar Pix Out:", paymentData);
      return {
        success: false,
        error: paymentData?.error?.message || "Erro ao criar pagamento",
      };
    }

    // Aprovar pagamento automaticamente
    console.log("Aprovando pagamento...");
    const approveResponse = await fetch(
      `https://api.openpix.com.br/api/v1/payment/${paymentCorrelationId}/approve`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: appId,
        },
      }
    );

    const approveData = await approveResponse.json();
    console.log("Resposta aprovação:", JSON.stringify(approveData, null, 2));

    if (!approveResponse.ok) {
      console.error("Erro ao aprovar Pix Out:", approveData);
      return {
        success: false,
        paymentId: paymentData.payment?.id,
        error: approveData?.error?.message || "Erro ao aprovar pagamento",
      };
    }

    console.log("✅ Pix Out aprovado com sucesso!");
    return {
      success: true,
      paymentId: paymentData.payment?.id,
    };
  } catch (error) {
    console.error("Erro inesperado no Pix Out:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== OpenPix Webhook Recebido ===");
  console.log("Method:", req.method);

  try {
    const rawBody = await req.text();
    const body: OpenPixWebhookPayload = JSON.parse(rawBody);

    console.log("Event:", body.event);
    console.log("Payload:", JSON.stringify(body, null, 2));

    // Validar assinatura do webhook (opcional)
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

    // Extrair correlationID
    const correlationID = body.charge?.correlationID || body.pix?.charge?.correlationID;

    if (!correlationID) {
      console.log("Webhook sem correlationID, ignorando");
      return new Response(
        JSON.stringify({ success: true, message: "Evento ignorado - sem correlationID" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("CorrelationID:", correlationID);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar pedido na tabela orders
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, influencers!inner(id, name, pix_key)")
      .eq("correlation_id", correlationID)
      .single();

    if (orderError || !order) {
      console.log("Pedido não encontrado para correlationID:", correlationID);
      return new Response(
        JSON.stringify({ success: true, message: "Pedido não encontrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Pedido encontrado:", order.id);
    console.log("Status atual:", order.status);
    console.log("Tipo:", order.order_type);

    // Processar apenas eventos de pagamento confirmado
    if (!["OPENPIX:CHARGE_COMPLETED", "OPENPIX:TRANSACTION_RECEIVED"].includes(body.event)) {
      console.log("Evento não é de pagamento confirmado, ignorando:", body.event);

      // Se for expiração, atualizar status
      if (body.event === "OPENPIX:CHARGE_EXPIRED") {
        await supabase
          .from("orders")
          .update({ status: "payout_failed" })
          .eq("id", order.id);
        console.log("Pedido marcado como expirado");
      }

      return new Response(
        JSON.stringify({ success: true, message: "Evento processado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // IDEMPOTÊNCIA: Não processar se já foi pago/processado
    if (order.status !== "pending") {
      console.log("Pedido já processado (idempotência). Status:", order.status);
      return new Response(
        JSON.stringify({ success: true, message: "Pedido já processado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Pagamento confirmado! Processando split...");

    // Marcar como pago
    await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", order.id);

    // Calcular split
    const split = calculateSplit(order.amount_cents, order.order_type);

    console.log("=== Split Calculado ===");
    console.log("Total:", order.amount_cents, "centavos");
    console.log("Taxa OpenPix (0.80%):", split.feeCents, "centavos");
    console.log("Influenciador bruto:", split.influencerGrossCents, "centavos");
    console.log("Influenciador líquido (Pix Out):", split.influencerPayoutCents, "centavos");
    console.log("Plataforma:", split.platformCents, "centavos");
    console.log("Quem paga taxa:", split.whoPayssFee);

    // Validar se o valor do payout é positivo
    if (split.influencerPayoutCents <= 0) {
      console.error("Valor de payout inválido:", split.influencerPayoutCents);

      await supabase.from("payouts").insert({
        order_id: order.id,
        influencer_id: order.influencer_id,
        amount_cents: 0,
        fee_cents: split.feeCents,
        platform_cents: split.platformCents,
        who_pays_fee: split.whoPayssFee,
        payment_correlation_id: `payout_${correlationID}`,
        status: "failed",
        error_message: "Valor de payout inválido (negativo ou zero)",
      });

      await supabase
        .from("orders")
        .update({ status: "payout_failed" })
        .eq("id", order.id);

      return new Response(
        JSON.stringify({ success: false, error: "Valor de payout inválido" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar registro de payout
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({
        order_id: order.id,
        influencer_id: order.influencer_id,
        amount_cents: split.influencerPayoutCents,
        fee_cents: split.feeCents,
        platform_cents: split.platformCents,
        who_pays_fee: split.whoPayssFee,
        payment_correlation_id: `payout_${correlationID}`,
        status: "pending",
      })
      .select()
      .single();

    if (payoutError) {
      console.error("Erro ao criar registro de payout:", payoutError);
    }

    // Executar Pix Out para o influenciador
    const OPENPIX_APP_ID = Deno.env.get("OPENPIX_APP_ID");
    if (!OPENPIX_APP_ID) {
      console.error("OPENPIX_APP_ID não configurado");

      await supabase
        .from("payouts")
        .update({ status: "failed", error_message: "OPENPIX_APP_ID não configurado" })
        .eq("id", payout.id);

      await supabase
        .from("orders")
        .update({ status: "payout_failed" })
        .eq("id", order.id);

      return new Response(
        JSON.stringify({ success: false, error: "Configuração de pagamento não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const influencer = order.influencers as { id: string; name: string; pix_key: string };

    const pixOutResult = await executePixOut(
      OPENPIX_APP_ID,
      influencer.pix_key,
      split.influencerPayoutCents,
      correlationID,
      influencer.name
    );

    if (pixOutResult.success) {
      // Atualizar payout como aprovado
      await supabase
        .from("payouts")
        .update({
          status: "approved",
          openpix_payment_id: pixOutResult.paymentId,
          approved_at: new Date().toISOString(),
        })
        .eq("id", payout.id);

      // Atualizar pedido como payout_done
      await supabase
        .from("orders")
        .update({ status: "payout_done" })
        .eq("id", order.id);

      console.log("=== Pix Out Concluído ===");
      console.log("Pedido:", order.id);
      console.log("Influenciador:", influencer.name);
      console.log("Valor repassado:", split.influencerPayoutCents, "centavos");

      return new Response(
        JSON.stringify({
          success: true,
          message: "Pagamento processado e repasse executado",
          payout: {
            orderId: order.id,
            influencer: influencer.name,
            amountCents: split.influencerPayoutCents,
            feeCents: split.feeCents,
            platformCents: split.platformCents,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Falha no Pix Out
      await supabase
        .from("payouts")
        .update({
          status: "failed",
          openpix_payment_id: pixOutResult.paymentId,
          error_message: pixOutResult.error,
        })
        .eq("id", payout.id);

      await supabase
        .from("orders")
        .update({ status: "payout_failed" })
        .eq("id", order.id);

      console.error("=== Falha no Pix Out ===");
      console.error("Erro:", pixOutResult.error);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Falha no repasse",
          details: pixOutResult.error,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Erro no webhook:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
