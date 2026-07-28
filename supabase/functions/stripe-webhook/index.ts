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

    // Verify Stripe signature — REQUIRED. Without a configured secret an
    // attacker could POST forged events to mark orders as paid.
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || Deno.env.get("STRIPE_PLATFORM_WEBHOOK_SECRET");
    const sigHeader = req.headers.get("stripe-signature");

    if (!stripeWebhookSecret) {
      console.error("Stripe webhook secret not configured — refusing to process events.");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!sigHeader) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const valid = await verifyStripeSignature(body, sigHeader, stripeWebhookSecret);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    console.log("Stripe webhook event:", event.type, event.id);

    // Idempotency guard — reject duplicate deliveries.
    if (event.id) {
      const { error: dupErr } = await supabaseAdmin
        .from("stripe_webhook_events")
        .insert({ event_id: event.id, event_type: event.type, source: "stripe-webhook" });
      if (dupErr) {
        // Unique-violation ⇒ already processed. Ack 200 so Stripe stops retrying.
        console.log("Duplicate event, skipping:", event.id);
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const storeId = session.metadata?.store_id;
        const orderId = session.metadata?.order_id;
        const correlationId = session.metadata?.correlation_id;

        // Only trust events for fully paid sessions.
        if (session.payment_status && session.payment_status !== "paid" && session.mode !== "subscription") {
          console.log("Session not paid, skipping:", session.id, session.payment_status);
          break;
        }

        let paidOrder: { product_id: string | null } | null = null;
        if ((orderId || correlationId) && storeId) {
          let updateQuery = supabaseAdmin
            .from("custom_orders")
            .update({ status: "paid", paid_at: new Date().toISOString() })
            .eq("store_id", storeId)
            .neq("status", "paid"); // don't re-stamp paid_at on retries

          updateQuery = orderId ? updateQuery.eq("id", orderId) : updateQuery.eq("correlation_id", correlationId);

          const { data, error } = await updateQuery.select("product_id").maybeSingle();
          paidOrder = data;
          if (error) console.error("Error updating order:", error);
        }

        const subscriptionId = session.metadata?.subscription_id || paidOrder?.product_id;
        if (subscriptionId && storeId && session.metadata?.product_type === "vip_subscription") {
          const { error } = await supabaseAdmin
            .from("vip_subscriptions")
            .update({ status: "active", started_at: new Date().toISOString() })
            .eq("id", subscriptionId)
            .eq("store_id", storeId)
            .neq("status", "active");
          if (error) console.error("Error activating VIP subscription:", error);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object;
        const correlationId = sub.metadata?.correlation_id;
        const storeId = sub.metadata?.store_id;
        if (correlationId && storeId) {
          const active = sub.status === "active" || sub.status === "trialing";
          const expiresAt = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null;
          // Resolve vip_subscriptions.id via custom_orders.correlation_id → product_id
          const { data: order } = await supabaseAdmin
            .from("custom_orders")
            .select("product_id")
            .eq("correlation_id", correlationId)
            .eq("store_id", storeId)
            .maybeSingle();
          if (order?.product_id) {
            const patch: Record<string, unknown> = { status: active ? "active" : "cancelled" };
            if (expiresAt) patch.expires_at = expiresAt;
            await supabaseAdmin
              .from("vip_subscriptions")
              .update(patch)
              .eq("id", order.product_id)
              .eq("store_id", storeId);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const correlationId = sub.metadata?.correlation_id;
        const storeId = sub.metadata?.store_id;
        if (correlationId && storeId) {
          const { data: order } = await supabaseAdmin
            .from("custom_orders")
            .select("product_id")
            .eq("correlation_id", correlationId)
            .eq("store_id", storeId)
            .maybeSingle();
          if (order?.product_id) {
            await supabaseAdmin
              .from("vip_subscriptions")
              .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
              .eq("id", order.product_id)
              .eq("store_id", storeId);
          }
        }
        break;
      }

      case "charge.refunded":
      case "charge.dispute.created": {
        const obj = event.data.object;
        const correlationId = obj.metadata?.correlation_id;
        const storeId = obj.metadata?.store_id;
        if (correlationId && storeId) {
          await supabaseAdmin
            .from("custom_orders")
            .update({ status: "refunded" })
            .eq("correlation_id", correlationId)
            .eq("store_id", storeId);
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
