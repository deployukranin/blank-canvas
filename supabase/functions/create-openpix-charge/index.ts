import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateChargeRequest {
  order_type: "creator_custom" | "platform_store";
  influencer_id: string;
  amount: number; // valor em reais
  product_type?: string;
  product_id?: string;
  customer_name?: string;
  customer_email?: string;
  expires_in?: number; // segundos até expirar (default: 3600)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== create-openpix-charge ===");

  try {
    const OPENPIX_APP_ID = Deno.env.get("OPENPIX_APP_ID");
    if (!OPENPIX_APP_ID) {
      console.error("OPENPIX_APP_ID não configurado");
      return new Response(
        JSON.stringify({ success: false, error: "Configuração de pagamento não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Autenticação do usuário (opcional)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      if (!authError && userData?.user) {
        userId = userData.user.id;
      }
    }

    // Parse request body
    const body: CreateChargeRequest = await req.json();
    console.log("Request:", { ...body, userId });

    // Validações
    if (!body.order_type || !["creator_custom", "platform_store"].includes(body.order_type)) {
      return new Response(
        JSON.stringify({ success: false, error: "order_type inválido. Use 'creator_custom' ou 'platform_store'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.influencer_id) {
      return new Response(
        JSON.stringify({ success: false, error: "influencer_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.amount || body.amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "amount deve ser maior que zero" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se influencer existe e está ativo
    const { data: influencer, error: influencerError } = await supabase
      .from("influencers")
      .select("id, name, pix_key, is_active")
      .eq("id", body.influencer_id)
      .eq("is_active", true)
      .single();

    if (influencerError || !influencer) {
      console.error("Influencer não encontrado:", influencerError);
      return new Response(
        JSON.stringify({ success: false, error: "Influencer não encontrado ou inativo" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Converter para centavos
    const amountCents = Math.round(body.amount * 100);

    // Gerar correlationID único
    const correlationId = `ord_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`;
    const expiresIn = body.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    console.log("Criando cobrança:", {
      correlationId,
      amountCents,
      orderType: body.order_type,
      influencer: influencer.name,
    });

    // Criar cobrança na OpenPix (SEM split nativo - faremos o payout manual)
    const openPixPayload = {
      correlationID: correlationId,
      value: amountCents,
      comment: `Pagamento ${body.order_type === "creator_custom" ? "Personalizado" : "Loja"} - ${influencer.name}`,
      expiresIn,
      customer: {
        name: body.customer_name || undefined,
        email: body.customer_email || undefined,
      },
    };

    console.log("Payload OpenPix:", JSON.stringify(openPixPayload, null, 2));

    const openPixResponse = await fetch("https://api.openpix.com.br/api/v1/charge", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: OPENPIX_APP_ID,
      },
      body: JSON.stringify(openPixPayload),
    });

    const openPixData = await openPixResponse.json();
    console.log("Resposta OpenPix:", JSON.stringify(openPixData, null, 2));

    if (!openPixResponse.ok) {
      console.error("Erro OpenPix:", openPixData);
      return new Response(
        JSON.stringify({
          success: false,
          error: openPixData?.error?.message || "Erro ao criar cobrança Pix",
          details: openPixData,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Salvar pedido na tabela orders
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_type: body.order_type,
        influencer_id: body.influencer_id,
        amount_cents: amountCents,
        status: "pending",
        correlation_id: correlationId,
        openpix_charge_id: openPixData.charge?.identifier || null,
        user_id: userId,
        product_type: body.product_type || null,
        product_id: body.product_id || null,
        customer_name: body.customer_name || null,
        customer_email: body.customer_email || null,
        pix_brcode: openPixData.charge?.brCode || null,
        pix_qrcode_image: openPixData.charge?.qrCodeImage || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error("Erro ao salvar pedido:", orderError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao salvar pedido", details: orderError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("=== Pedido Criado ===");
    console.log("Order ID:", order.id);
    console.log("Correlation ID:", correlationId);
    console.log("Charge ID:", openPixData.charge?.identifier);

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          correlationId,
          status: "pending",
          amountCents,
          orderType: body.order_type,
          influencerName: influencer.name,
        },
        charge: {
          brCode: openPixData.charge?.brCode,
          qrCodeImage: openPixData.charge?.qrCodeImage,
          paymentLinkUrl: openPixData.charge?.paymentLinkUrl,
          expiresAt: expiresAt.toISOString(),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro inesperado:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
