import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🛡️ CONFIGURAÇÃO DE SEGURANÇA
const ALLOWED_ORIGINS = [
  "https://seusite.lovable.app",
  "https://preview-seusite.lovable.app",
  "http://localhost:8080",
];

const MAX_REQUESTS_PER_MINUTE = 5;
const MAX_TEXT_LENGTH = 1000;
const ALLOWED_DURATIONS = [5, 10, 15] as const;

type ProductType = "video" | "audio";

// Helper de CORS dinâmico
const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : "null",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
});

const getPriceInCents = (type: ProductType, minutes?: number): number => {
  if (type === "audio") return 3000;
  if (type === "video") {
    if (minutes === 5) return 4000;
    if (minutes === 10) return 6000;
    if (minutes === 15) return 8000;
  }
  return 5000; // fallback seguro
};

serve(async (req) => {
  const origin = req.headers.get("Origin") || "";

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  // 1) 🛡️ Bloqueio REAL por Origin (para browsers). Sem Origin (server-to-server) passa.
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    console.error(`Blocked CORS attempt from: ${origin}`);
    return new Response(JSON.stringify({ error: "Forbidden Origin" }), {
      status: 403,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }

  try {
    const OPENPIX_APP_ID = Deno.env.get("OPENPIX_APP_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!OPENPIX_APP_ID) {
      // não vazar detalhes pro cliente
      console.error("OPENPIX_APP_ID missing");
      return new Response(JSON.stringify({ error: "Server config error" }), {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // 2) 🛡️ Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Auth required" }), {
        status: 401,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // 3) 🛡️ Rate limit (fail-closed)
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count: recentOrders, error: rateLimitError } = await supabase
      .from("custom_orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gt("created_at", oneMinuteAgo);

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError);
      return new Response(JSON.stringify({ error: "System busy, try again." }), {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    if (recentOrders !== null && recentOrders >= MAX_REQUESTS_PER_MINUTE) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // 4) 🛡️ Body parse seguro
    let rawBody: any;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // 5) 🛡️ Normalização + validação estrita
    const productTypeRaw = String(rawBody.productType || "");
    if (productTypeRaw !== "video" && productTypeRaw !== "audio") {
      return new Response(JSON.stringify({ error: "Invalid productType" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }
    const productType = productTypeRaw as ProductType;

    const category = String(rawBody.category || "").trim();
    const customerName = String(rawBody.customerName || "").trim();
    const durationMinutes = Number(rawBody.durationMinutes);

    if (!category || !customerName) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    if (productType === "video") {
      // duration precisa ser um número válido e permitido
      if (!Number.isFinite(durationMinutes) || !ALLOWED_DURATIONS.includes(durationMinutes as any)) {
        return new Response(JSON.stringify({ error: "Invalid duration" }), {
          status: 400,
          headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
        });
      }
    }

    // Limite de texto (evita payload DoS). Use rawBody para não quebrar se vier tipo diferente.
    const script = typeof rawBody.script === "string" ? rawBody.script : "";
    const observationsClient = typeof rawBody.observations === "string" ? rawBody.observations : "";

    if (script.length > MAX_TEXT_LENGTH || observationsClient.length > MAX_TEXT_LENGTH) {
      return new Response(JSON.stringify({ error: "Text too long" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // 6) 🛡️ Preço seguro
    const amountCents = getPriceInCents(productType, productType === "video" ? durationMinutes : undefined);
    const correlationID = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 7) 🛡️ Draft -> Charge -> Update
    const { data: draftOrder, error: draftError } = await supabase
      .from("custom_orders")
      .insert({
        user_id: user.id,
        product_type: productType,
        category,
        category_name: String(rawBody.categoryName || "").substring(0, 100),
        customer_name: customerName.substring(0, 100),
        duration_minutes: productType === "video" ? durationMinutes : 0,
        amount_cents: amountCents,
        correlation_id: correlationID,
        status: "draft",
        expires_at: expiresAt.toISOString(),
        // mantém o campo do cliente como cliente, se você quiser salvar:
        script: script.substring(0, MAX_TEXT_LENGTH),
        observations: observationsClient.substring(0, MAX_TEXT_LENGTH),
      })
      .select()
      .single();

    if (draftError || !draftOrder) {
      console.error("Draft insert error:", draftError);
      return new Response(JSON.stringify({ error: "Failed to initialize order" }), {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const openPixResponse = await fetch("https://api.openpix.com.br/api/v1/charge", {
      method: "POST",
      headers: { "Authorization": OPENPIX_APP_ID, "Content-Type": "application/json" },
      body: JSON.stringify({
        correlationID,
        value: amountCents,
        comment: `Order ${draftOrder.id} - User ${user.id}`, // ok, sem dados sensíveis
        expiresIn: 900,
      }),
    });

    let openPixData: any;
    try {
      openPixData = await openPixResponse.json();
    } catch {
      openPixData = null;
    }

    // 8) 🛡️ Validação do retorno do provedor
    const charge = openPixData?.charge;
    const okCharge =
      openPixResponse.ok &&
      !openPixData?.error &&
      charge?.identifier &&
      charge?.brCode &&
      charge?.qrCodeImage;

    if (!okCharge) {
      console.error("OpenPix failure:", {
        status: openPixResponse.status,
        error: openPixData?.error ?? "invalid_response",
      });

      // Auditoria: NÃO salvar o erro cru do provedor em campo do cliente
      await supabase
        .from("custom_orders")
        .update({
          status: "failed",
          // se você não tem coluna específica, grave um marcador curto:
          // (ideal seria ter failure_reason/provider_error_code em colunas separadas)
          observations: "openpix_failed",
        })
        .eq("id", draftOrder.id)
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ error: "Payment provider error" }), {
        status: 502,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // 9) 🛡️ Update seguro (id + user_id)
    const { error: updateError } = await supabase
      .from("custom_orders")
      .update({
        openpix_charge_id: charge.identifier,
        qr_code_image: charge.qrCodeImage,
        br_code: charge.brCode,
        status: "pending",
      })
      .eq("id", draftOrder.id)
      .eq("user_id", user.id);

    if (updateError) {
      // Situação rara: charge criada mas update falhou.
      console.error("Critical update error:", updateError);
      // Aqui você pode: tentar retry, ou registrar em logs/monitoramento.
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: draftOrder.id,
        correlation_id: correlationID,
        qr_code_image: charge.qrCodeImage,
        br_code: charge.brCode,
        expires_at: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Internal error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
});
