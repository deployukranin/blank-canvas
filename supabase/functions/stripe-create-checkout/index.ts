import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Direct Charge — 100% goes to the connected account
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency,
              product_data: { name: product_name },
              unit_amount: amount_cents,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          metadata: {
            store_id,
            ...metadata,
          },
        },
        success_url,
        cancel_url,
        metadata: {
          store_id,
          ...metadata,
        },
      },
      {
        stripeAccount: store.stripe_account_id,
      }
    );

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
