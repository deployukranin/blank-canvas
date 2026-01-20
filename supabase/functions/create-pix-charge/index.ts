import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateChargeRequest {
  value: number; // valor em centavos
  productType: string; // VIP, SUBSCRIPTION, CUSTOM_VIDEO, etc
  productId?: string;
  customer?: {
    name?: string;
    email?: string;
    taxID?: string;
    phone?: string;
  };
  comment?: string;
  expiresIn?: number; // segundos até expirar (default: 3600 = 1 hora)
}

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
    console.log("Criando cobrança Pix:", { ...body, userId });

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

    // Gerar correlationID único
    const correlationID = crypto.randomUUID();
    const expiresIn = body.expiresIn || 3600; // 1 hora default
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Criar cobrança na OpenPix
    const openPixPayload = {
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

    console.log("Enviando para OpenPix:", openPixPayload);

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
    console.log("Resposta OpenPix:", openPixData);

    if (!openPixResponse.ok) {
      console.error("Erro OpenPix:", openPixData);
      return new Response(
        JSON.stringify({ error: "Erro ao criar cobrança Pix", details: openPixData }),
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

    console.log("Pagamento criado:", payment);

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
