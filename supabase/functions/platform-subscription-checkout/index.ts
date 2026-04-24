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
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    const { store_id, plan_id, currency = "brl", success_url, cancel_url } = await req.json();

    if (!store_id || !plan_id || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: "store_id, plan_id, success_url, cancel_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URLs
    try {
      const sUrl = new URL(success_url);
      const cUrl = new URL(cancel_url);
      if (!["http:", "https:"].includes(sUrl.protocol) || !["http:", "https:"].includes(cUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return new Response(JSON.stringify({ error: "Invalid redirect URLs" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is owner/admin of the store
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id, name, created_by")
      .eq("id", store_id)
      .single();

    if (!store) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: storeAdmin } = await supabaseAdmin
      .from("store_admins")
      .select("id")
      .eq("store_id", store_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (store.created_by !== userId && !storeAdmin) {
      return new Response(JSON.stringify({ error: "Not authorized for this store" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load platform_plans config
    const { data: planConfig } = await supabaseAdmin
      .from("app_configurations")
      .select("config_value")
      .eq("config_key", "platform_plans")
      .is("store_id", null)
      .maybeSingle();

    if (!planConfig?.config_value) {
      return new Response(JSON.stringify({ error: "Platform plans not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plans = planConfig.config_value as Array<{
      id: string;
      stripe_price_id_brl?: string;
      stripe_price_id_usd?: string;
    }>;
    const plan = plans.find((p) => p.id === plan_id);

    if (!plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceId = currency === "brl" ? plan.stripe_price_id_brl : plan.stripe_price_id_usd;
    if (!priceId) {
      return new Response(
        JSON.stringify({
          error: `Stripe Price ID not configured for plan "${plan_id}" (${currency.toUpperCase()}). Configure it in Super Admin → Plans.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Stripe Checkout Session (subscription mode) on platform account
    const params = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url,
      cancel_url,
      customer_email: userEmail || "",
      "metadata[store_id]": store_id,
      "metadata[user_id]": userId,
      "metadata[plan_id]": plan_id,
      "subscription_data[metadata][store_id]": store_id,
      "subscription_data[metadata][user_id]": userId,
      "subscription_data[metadata][plan_id]": plan_id,
    });

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!sessionRes.ok) {
      const errBody = await sessionRes.text();
      console.error("Stripe checkout error:", errBody);
      return new Response(
        JSON.stringify({ error: "Failed to create checkout session", details: errBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await sessionRes.json();

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Platform subscription checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
