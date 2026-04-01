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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
      "line_items[0][price_data][product_data][name]": product_name,
      "line_items[0][price_data][unit_amount]": String(amount_cents),
      "line_items[0][quantity]": "1",
      success_url,
      cancel_url,
      "metadata[store_id]": store_id,
      "payment_intent_data[metadata][store_id]": store_id,
    });

    // Add custom metadata
    for (const [key, value] of Object.entries(metadata)) {
      params.append(`metadata[${key}]`, String(value));
      params.append(`payment_intent_data[metadata][${key}]`, String(value));
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
      throw new Error("Failed to create checkout session");
    }

    const session = await sessionRes.json();

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
