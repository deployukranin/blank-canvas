import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateChargeRequest {
  value: number; // valor em centavos
  productType: string; // VIP, SUBSCRIPTION, CUSTOM_VIDEO, etc
  productId?: string;
  influencerId?: string; // ID do influencer para split
  customer?: {
    name?: string;
    email?: string;
    taxID?: string;
    phone?: string;
  };
  comment?: string;
  expiresIn?: number; // segundos até expirar (default: 3600 = 1 hora)
  // Configurações de split dinâmicas
  splitConfig?: {
    platformSplitPercentage?: number; // % para plataforma (default: 20)
    platformPaysOpenPixFee?: boolean; // Se true, taxa descontada da plataforma
  };
}

interface Influencer {
  id: string;
  name: string;
  openpix_receiver_id?: string;
  woovi_subaccount_id?: string;
  pix_key: string;
  split_percentage: number;
  is_active: boolean;
}

// Split fixo: 20% plataforma, 80% influencer (configurável por influencer)
const DEFAULT_PLATFORM_PERCENTAGE = 20;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENPIX_APP_ID = Deno.env.get("OPENPIX_APP_ID");
    if (!OPENPIX_APP_ID) {
      console.error("OPENPIX_APP_ID não configurado");
      return new Response(
        JSON.stringify({ success: false, error: "Configuração de pagamento não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Autenticação do usuário
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
      if (!claimsError && claimsData?.user) {
        userId = claimsData.user.id;
      }
    }

    // Parse request body
    const body: CreateChargeRequest = await req.json();
    console.log("=== Criando Cobrança PIX ===");
    console.log("Request:", { ...body, userId });

    // Validações
    if (!body.value || body.value < 1) {
      return new Response(
        JSON.stringify({ success: false, error: "Valor inválido. Mínimo: 1 centavo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.productType) {
      return new Response(
        JSON.stringify({ success: false, error: "Tipo de produto é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados do influencer se informado
    let influencer: Influencer | null = null;
    let splitPlatformValue: number | null = null;
    let splitInfluencerValue: number | null = null;

    // Usar configurações de split passadas ou valores padrão
    const platformSplitPercentage = body.splitConfig?.platformSplitPercentage ?? 20;

    if (body.influencerId) {
      const { data: influencerData, error: influencerError } = await supabase
        .from("influencers")
        .select("id, name, openpix_receiver_id, woovi_subaccount_id, pix_key, split_percentage, is_active")
        .eq("id", body.influencerId)
        .eq("is_active", true)
        .single();

      if (influencerError || !influencerData) {
        console.error("Influencer não encontrado:", influencerError);
        return new Response(
          JSON.stringify({ success: false, error: "Influencer não encontrado ou inativo" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      influencer = influencerData as Influencer;

      // Calcular split - usar o percentual do influencer ou calcular baseado na plataforma
      // O influencer.split_percentage é o que ele recebe, então usamos esse valor
      const influencerPercentage = influencer.split_percentage || (100 - platformSplitPercentage);
      splitInfluencerValue = Math.floor((body.value * influencerPercentage) / 100);
      splitPlatformValue = body.value - splitInfluencerValue;

      console.log("Split calculado:", {
        total: body.value,
        influencerPercentage,
        platformPercentage: 100 - influencerPercentage,
        splitInfluencerValue,
        splitPlatformValue,
        usedSubaccountId: influencer.woovi_subaccount_id || influencer.openpix_receiver_id || influencer.pix_key,
      });
    }

    // Gerar correlationID único
    const correlationID = crypto.randomUUID();
    const expiresIn = body.expiresIn || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Payload para OpenPix
    const openPixPayload: Record<string, unknown> = {
      correlationID,
      value: body.value,
      comment: body.comment || `Pagamento ${body.productType}`,
      expiresIn,
      customer: body.customer ? {
        name: body.customer.name,
        email: body.customer.email,
        taxID: body.customer.taxID,
        phone: body.customer.phone,
      } : undefined,
    };

    // Adicionar split se houver influencer com subconta ou receiver_id configurado
    // Prioridade: woovi_subaccount_id > openpix_receiver_id > pix_key
    const receiverId = influencer?.woovi_subaccount_id || influencer?.openpix_receiver_id;
    if (receiverId && splitInfluencerValue && splitInfluencerValue > 0) {
      openPixPayload.splits = [
        {
          receiver: receiverId,
          value: splitInfluencerValue,
        },
      ];
      console.log("Split adicionado ao payload:", openPixPayload.splits);
    } else if (influencer && !receiverId) {
      console.warn("Influencer sem subconta ou receiver_id configurado. Split não será aplicado automaticamente.");
    }

    console.log("Enviando para OpenPix:", JSON.stringify(openPixPayload, null, 2));

    // Criar cobrança na OpenPix
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
          details: openPixData 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Salvar no banco
    const { data: payment, error: dbError } = await supabase
      .from("pix_payments")
      .insert({
        user_id: userId,
        correlation_id: correlationID,
        charge_id: openPixData.charge?.identifier || null,
        value: body.value,
        status: "PENDING",
        product_type: body.productType,
        product_id: body.productId || null,
        influencer_id: influencer?.id || null,
        split_platform_value: splitPlatformValue,
        split_influencer_value: splitInfluencerValue,
        openpix_split_id: openPixData.charge?.splits?.[0]?.id || null,
        customer_name: body.customer?.name || null,
        customer_email: body.customer?.email || null,
        customer_taxid: body.customer?.taxID || null,
        pix_qrcode: openPixData.charge?.qrCodeImage || null,
        pix_qrcode_image: openPixData.charge?.qrCodeImage || null,
        pix_brcode: openPixData.charge?.brCode || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Erro ao salvar pagamento:", dbError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao salvar pagamento", details: dbError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("=== Pagamento Criado ===");
    console.log("Payment ID:", payment.id);
    console.log("Charge ID:", openPixData.charge?.identifier);

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          correlationId: correlationID,
          chargeId: openPixData.charge?.identifier,
          value: body.value,
          status: "PENDING",
          qrCode: openPixData.charge?.qrCodeImage,
          brCode: openPixData.charge?.brCode,
          paymentLinkUrl: openPixData.charge?.paymentLinkUrl,
          expiresAt: expiresAt.toISOString(),
          split: influencer ? {
            influencerId: influencer.id,
            influencerName: influencer.name,
            influencerValue: splitInfluencerValue,
            platformValue: splitPlatformValue,
          } : null,
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
