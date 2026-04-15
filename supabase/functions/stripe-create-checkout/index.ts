import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    const {
      store_id,
      product_name,
      amount_cents,
      currency = "brl",
      success_url,
      cancel_url,
      metadata = {},
    } = await req.json();

    if (!store_id || !product_name || !amount_cents || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount
    if (typeof amount_cents !== "number" || amount_cents < 100 || amount_cents > 1000000) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URLs (prevent open redirect)
    try {
      const sUrl = new URL(success_url);
      const cUrl = new URL(cancel_url);
      if (!["http:", "https:"].includes(sUrl.protocol) || !["http:", "https:"].includes(cUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid redirect URLs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get store's stripe_account_id
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("stripe_account_id, name")
      .eq("id", store_id)
      .single();

    if (!store?.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: "Store has not connected Stripe yet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build form data for Stripe Checkout Session (Direct Charge)
    const params = new URLSearchParams({
      mode: "payment",
      "line_items[0][price_data][currency]": currency,
      "line_items[0][price_data][product_data][name]": String(product_name).substring(0, 200),
      "line_items[0][price_data][unit_amount]": String(amount_cents),
      "line_items[0][quantity]": "1",
      success_url,
      cancel_url,
      "metadata[store_id]": store_id,
      "metadata[user_id]": userId,
      "payment_intent_data[metadata][store_id]": store_id,
      "payment_intent_data[metadata][user_id]": userId,
    });

    // Add custom metadata (sanitized)
    const allowedMetaKeys = ["order_id", "subscription_id", "product_type"];
    for (const [key, value] of Object.entries(metadata)) {
      if (allowedMetaKeys.includes(key)) {
        params.append(`metadata[${key}]`, String(value).substring(0, 500));
        params.append(`payment_intent_data[metadata][${key}]`, String(value).substring(0, 500));
      }
    }

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Account": store.stripe_account_id,
      },
      body: params,
    });

    if (!sessionRes.ok) {
      const errBody = await sessionRes.text();
      console.error("Stripe checkout error:", errBody);
      return new Response(
        JSON.stringify({ error: "Failed to create checkout session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await sessionRes.json();

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
