import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
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

    const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
    if (age > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expected === signature;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();

    // Optional signature verification
    const webhookSecret = Deno.env.get("STRIPE_PLATFORM_WEBHOOK_SECRET");
    const sigHeader = req.headers.get("stripe-signature");

    if (webhookSecret) {
      if (!sigHeader) {
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const valid = await verifyStripeSignature(body, sigHeader, webhookSecret);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("STRIPE_PLATFORM_WEBHOOK_SECRET not set — signature verification SKIPPED.");
    }

    const event = JSON.parse(body);
    console.log("Platform subscription webhook event:", event.type, event.id);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const storeId = session.metadata?.store_id;
        const planId = session.metadata?.plan_id;
        const subscriptionId = session.subscription;

        if (storeId && planId) {
          // Default 30 days; will be refined when subscription event arrives
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          const { error } = await supabaseAdmin
            .from("stores")
            .update({
              plan_type: planId,
              plan_expires_at: expiresAt.toISOString(),
              status: "active",
            })
            .eq("id", storeId);

          if (error) console.error("Error updating store plan:", error);
          else console.log(`Store ${storeId} upgraded to ${planId} (sub: ${subscriptionId})`);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object;
        const storeId = sub.metadata?.store_id;
        const planId = sub.metadata?.plan_id;
        const periodEnd = sub.current_period_end;

        if (storeId && planId && periodEnd) {
          const expiresAt = new Date(periodEnd * 1000);
          const { error } = await supabaseAdmin
            .from("stores")
            .update({
              plan_type: planId,
              plan_expires_at: expiresAt.toISOString(),
              status: sub.status === "active" || sub.status === "trialing" ? "active" : "suspended",
            })
            .eq("id", storeId);
          if (error) console.error("Error syncing subscription:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const storeId = sub.metadata?.store_id;
        if (storeId) {
          const { error } = await supabaseAdmin
            .from("stores")
            .update({ plan_type: "trial", status: "suspended" })
            .eq("id", storeId);
          if (error) console.error("Error cancelling subscription:", error);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn("Invoice payment failed:", invoice.id, "customer:", invoice.customer);
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
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
