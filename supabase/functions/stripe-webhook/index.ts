import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

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
    
    // Parse the event (webhook signature verification is optional for Connect events
    // routed through the platform, but recommended for production)
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    
    let event: Stripe.Event;
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response("Invalid signature", { status: 400 });
      }
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log("Stripe webhook event:", event.type, event.id);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const storeId = session.metadata?.store_id;
        const orderId = session.metadata?.order_id;
        
        console.log("Payment completed for store:", storeId, "order:", orderId);

        if (orderId && storeId) {
          // Update order status to paid
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
        // Connected account was updated (onboarding completed, etc.)
        const account = event.data.object as Stripe.Account;
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
