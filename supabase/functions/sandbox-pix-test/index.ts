import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Teste Completo de Pagamento PIX no Sandbox
 * 
 * Esta função simula TODO o fluxo de pagamento sem depender da API do OpenPix:
 * 1. Cria cobrança PIX (mock)
 * 2. Calcula split automaticamente
 * 3. Salva no banco
 * 4. Simula confirmação de pagamento
 * 5. Dispara ações pós-pagamento
 */

interface SandboxTestRequest {
  value: number; // valor em centavos (default: 1000 = R$10,00)
  productType: string; // VIP, SUBSCRIPTION, CUSTOM_VIDEO, etc
  influencerId?: string; // ID do influencer para split
  autoConfirm?: boolean; // Se true, confirma pagamento automaticamente
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== SANDBOX PIX TEST - Teste Completo de Split ===");

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: SandboxTestRequest = await req.json();
    const { 
      value = 1000, // R$10,00 default
      productType = "TEST",
      influencerId,
      autoConfirm = true 
    } = body;

    console.log("Parâmetros do teste:", { value, productType, influencerId, autoConfirm });

    // 1. Buscar influencer se informado
    let influencer: Influencer | null = null;
    let splitPlatformValue: number | null = null;
    let splitInfluencerValue: number | null = null;

    if (influencerId) {
      const { data: influencerData, error: influencerError } = await supabase
        .from("influencers")
        .select("*")
        .eq("id", influencerId)
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

      // Calcular split (backend define, não frontend)
      const influencerPercentage = influencer.split_percentage;
      splitInfluencerValue = Math.floor((value * influencerPercentage) / 100);
      splitPlatformValue = value - splitInfluencerValue;

      console.log("=== Split Calculado ===");
      console.log("Valor Total:", value, "centavos (R$", (value / 100).toFixed(2), ")");
      console.log("Influencer:", influencer.name, `(${influencerPercentage}%)`);
      console.log("Valor Influencer:", splitInfluencerValue, "centavos (R$", (splitInfluencerValue / 100).toFixed(2), ")");
      console.log("Valor Plataforma:", splitPlatformValue, "centavos (R$", (splitPlatformValue / 100).toFixed(2), ")");
    }

    // 2. Gerar dados do pagamento (mock)
    const correlationID = crypto.randomUUID();
    const chargeId = `mock_charge_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hora

    // QR Code e BrCode mockados
    const mockQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${correlationID}`;
    const mockBrCode = `00020126580014br.gov.bcb.pix0136${correlationID}520400005303986540${(value / 100).toFixed(2)}5802BR`;

    console.log("=== Cobrança PIX Criada (Mock) ===");
    console.log("Correlation ID:", correlationID);
    console.log("Charge ID:", chargeId);

    // 3. Salvar no banco
    const { data: payment, error: dbError } = await supabase
      .from("pix_payments")
      .insert({
        correlation_id: correlationID,
        charge_id: chargeId,
        value: value,
        status: "PENDING",
        product_type: productType,
        influencer_id: influencer?.id || null,
        split_platform_value: splitPlatformValue,
        split_influencer_value: splitInfluencerValue,
        pix_qrcode: mockQRCode,
        pix_qrcode_image: mockQRCode,
        pix_brcode: mockBrCode,
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

    console.log("Pagamento salvo com ID:", payment.id);

    // 4. Se autoConfirm, simular confirmação de pagamento
    let confirmedPayment = null;
    if (autoConfirm) {
      console.log("=== Simulando Confirmação de Pagamento ===");

      const { error: confirmError } = await supabase
        .from("pix_payments")
        .update({
          status: "COMPLETED",
          paid_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (confirmError) {
        console.error("Erro ao confirmar pagamento:", confirmError);
      } else {
        console.log("✅ Pagamento CONFIRMADO!");

        // 5. Executar ações pós-pagamento
        console.log("=== Executando Ações Pós-Pagamento ===");
        
        switch (productType) {
          case "VIP":
            console.log("🎉 Ação: Ativar acesso VIP");
            break;
          case "SUBSCRIPTION":
            console.log("📅 Ação: Ativar assinatura");
            break;
          case "CUSTOM_VIDEO":
            console.log("🎬 Ação: Liberar pedido de vídeo personalizado");
            break;
          case "CONTENT":
            console.log("📦 Ação: Liberar conteúdo pago");
            break;
          default:
            console.log("ℹ️ Tipo de produto:", productType);
        }

        // Buscar pagamento atualizado
        const { data: updated } = await supabase
          .from("pix_payments")
          .select("*")
          .eq("id", payment.id)
          .single();
        
        confirmedPayment = updated;
      }
    }

    const finalPayment = confirmedPayment || payment;

    // 6. Retornar resultado completo
    return new Response(
      JSON.stringify({
        success: true,
        message: autoConfirm 
          ? "✅ Teste completo: cobrança criada e pagamento confirmado" 
          : "Cobrança criada (pendente confirmação)",
        test: {
          mode: "SANDBOX",
          autoConfirmed: autoConfirm,
        },
        charge: {
          id: finalPayment.id,
          correlationId: finalPayment.correlation_id,
          chargeId: finalPayment.charge_id,
          qrCode: finalPayment.pix_qrcode,
          brCode: finalPayment.pix_brcode,
          expiresAt: finalPayment.expires_at,
        },
        payment: {
          status: finalPayment.status,
          value: finalPayment.value,
          valueBRL: `R$ ${(finalPayment.value / 100).toFixed(2)}`,
          productType: finalPayment.product_type,
          paidAt: finalPayment.paid_at,
        },
        split: influencer ? {
          enabled: true,
          influencer: {
            id: influencer.id,
            name: influencer.name,
            pixKey: influencer.pix_key,
            percentage: influencer.split_percentage,
          },
          values: {
            influencer: {
              centavos: splitInfluencerValue,
              brl: `R$ ${(splitInfluencerValue! / 100).toFixed(2)}`,
              percentage: influencer.split_percentage,
            },
            platform: {
              centavos: splitPlatformValue,
              brl: `R$ ${(splitPlatformValue! / 100).toFixed(2)}`,
              percentage: 100 - influencer.split_percentage,
            },
          },
        } : {
          enabled: false,
          message: "Sem split - pagamento integral para plataforma",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no teste sandbox:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
