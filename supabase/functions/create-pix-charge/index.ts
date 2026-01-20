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
}

interface Influencer {
  id: string;
  name: string;
  tax_id: string;
  pix_key_type: string;
  pix_key: string;
  split_percentage: number;
  is_active: boolean;
}

const PLATFORM_SPLIT_PERCENTAGE = 20; // 20% para a plataforma

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENPIX_APP_ID = Deno.env.get("OPENPIX_APP_ID");
    if (!OPENPIX_APP_ID) {
      console.error("OPENPIX_APP_ID não configurado");
      return new Response(
        JSON.stringify({ error: "Configuração de pagamento não encontrada" }),
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
    console.log("Criando cobrança Pix com split:", { ...body, userId });

    if (!body.value || body.value < 1) {
      return new Response(
        JSON.stringify({ error: "Valor inválido. Mínimo: 1 centavo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.productType) {
      return new Response(
        JSON.stringify({ error: "Tipo de produto é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados do influencer se informado
    let influencer: Influencer | null = null;
    let splitPlatformValue: number | null = null;
    let splitInfluencerValue: number | null = null;

    if (body.influencerId) {
      const { data: influencerData, error: influencerError } = await supabase
        .from("influencers")
        .select("*")
        .eq("id", body.influencerId)
        .eq("is_active", true)
        .single();

      if (influencerError || !influencerData) {
        console.error("Influencer não encontrado:", influencerError);
        return new Response(
          JSON.stringify({ error: "Influencer não encontrado ou inativo" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      influencer = influencerData as Influencer;

      // Calcular valores do split (definido no backend, não no frontend)
      const influencerPercentage = influencer.split_percentage;
      const platformPercentage = 100 - influencerPercentage;

      splitInfluencerValue = Math.floor((body.value * influencerPercentage) / 100);
      splitPlatformValue = body.value - splitInfluencerValue; // Resto para plataforma

      console.log("Split calculado:", {
        total: body.value,
        influencerPercentage,
        platformPercentage,
        splitInfluencerValue,
        splitPlatformValue,
      });
    }

    // Gerar correlationID único
    const correlationID = crypto.randomUUID();
    const expiresIn = body.expiresIn || 3600; // 1 hora default
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Criar payload para OpenPix
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

    // Adicionar split se houver influencer
    if (influencer && splitInfluencerValue && splitInfluencerValue > 0) {
      // OpenPix Split API: https://developers.openpix.com.br/docs/split-payment
      openPixPayload.splits = [
        {
          pixKey: influencer.pix_key,
          pixKeyType: influencer.pix_key_type.toUpperCase(),
          value: splitInfluencerValue,
          splitDetail: {
            name: influencer.name,
            taxID: influencer.tax_id,
          },
        },
      ];
    }

    console.log("Enviando para OpenPix:", JSON.stringify(openPixPayload, null, 2));

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
      
      // Verificar se é erro de chave PIX inválida
      const errorMessage = openPixData?.error?.message || openPixData?.message || "";
      if (errorMessage.toLowerCase().includes("pix") || errorMessage.toLowerCase().includes("key")) {
        return new Response(
          JSON.stringify({ 
            error: "Chave PIX do influencer inválida", 
            details: openPixData,
            code: "INVALID_PIX_KEY"
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao criar cobrança Pix", details: openPixData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Salvar no banco com dados de split
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
        JSON.stringify({ error: "Erro ao salvar pagamento", details: dbError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Pagamento criado com split:", {
      paymentId: payment.id,
      influencerId: influencer?.id,
      splitPlatformValue,
      splitInfluencerValue,
    });

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          correlationId: correlationID,
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
      JSON.stringify({ error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
