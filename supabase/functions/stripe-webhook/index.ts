import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// HMAC-SHA256 signature verification for Stripe webhooks
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = sigHeader.split(",").reduce((acc, part) => {
      const [key, value] = part.split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts["t"];
    const signature = parts["v1"];

    if (!timestamp || !signature) return false;

    // Reject timestamps older than 5 minutes (replay protection)
    const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
    if (age > 300) {
      console.error("Webhook timestamp too old:", age, "seconds");
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signedPayload)
    );
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expected === signature;
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response("Webhook not configured", { status: 500 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();

    // Verify Stripe signature if webhook secret is configured
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const sigHeader = req.headers.get("stripe-signature");

    if (stripeWebhookSecret) {
      if (!sigHeader) {
        console.error("Missing stripe-signature header");
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const valid = await verifyStripeSignature(body, sigHeader, stripeWebhookSecret);
      if (!valid) {
        console.error("Invalid Stripe webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("STRIPE_WEBHOOK_SECRET not set — signature verification SKIPPED. Configure it for production!");
    }

    const event = JSON.parse(body);

    console.log("Stripe webhook event:", event.type, event.id);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const storeId = session.metadata?.store_id;
        const orderId = session.metadata?.order_id;

        console.log("Payment completed for store:", storeId, "order:", orderId);

        if (orderId && storeId) {
          const { error } = await supabaseAdmin
            .from("custom_orders")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .eq("store_id", storeId);

          if (error) {
            console.error("Error updating order:", error);
          } else {
            console.log("Order updated to paid:", orderId);
          }
        }

        // Handle VIP subscription activation
        const subscriptionId = session.metadata?.subscription_id;
        if (subscriptionId && storeId) {
          const { error } = await supabaseAdmin
            .from("vip_subscriptions")
            .update({ status: "active" })
            .eq("id", subscriptionId)
            .eq("store_id", storeId);

          if (error) {
            console.error("Error activating VIP subscription:", error);
          } else {
            console.log("VIP subscription activated:", subscriptionId);
          }
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object;
        console.log("Account updated:", account.id, "charges_enabled:", account.charges_enabled);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
