/**
 * Starts the Stripe Connect OAuth flow.
 *
 * Unlike the account_onboarding link (which creates a brand new Standard
 * account and asks for every detail again), OAuth lets a creator who already
 * has a Stripe account simply log in and authorize the platform.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { servePrivate, privateCors } from "../_shared/cors.ts";
import { storeBlockedResponse } from "../_shared/store-plan.ts";
import { emailUnverifiedResponse } from "../_shared/email-verified.ts";
import { signState, isAllowedReturnUrl } from "../_shared/stripe-oauth-state.ts";

Deno.serve(servePrivate(async (req) => {
  const corsHeaders = privateCors(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const connectClientId = Deno.env.get("STRIPE_CONNECT_CLIENT_ID");
    if (!stripeSecretKey) return json({ error: "Stripe not configured" }, 500);
    // A malformed client id makes Stripe answer "No application matches the
    // supplied client identifier". Fall back to hosted onboarding instead.
    if (!connectClientId || !/^ca_[A-Za-z0-9]+$/.test(connectClientId.trim())) {
      return json({ error: "oauth_unavailable" }, 501);
    }


    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Invalid session" }, 401);

    const user = { id: claimsData.claims.sub as string, email: claimsData.claims.email as string };

    const unverified = await emailUnverifiedResponse(user.id, corsHeaders);
    if (unverified) return unverified;

    const { store_id, return_url } = await req.json();
    if (!store_id || !return_url) return json({ error: "store_id and return_url are required" }, 400);
    if (!isAllowedReturnUrl(return_url)) return json({ error: "Invalid return_url" }, 400);

    const planBlocked = await storeBlockedResponse(store_id, corsHeaders);
    if (planBlocked) return planBlocked;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id, created_by")
      .eq("id", store_id)
      .maybeSingle();
    if (!store) return json({ error: "Store not found" }, 404);

    const { data: storeAdmin } = await supabaseAdmin
      .from("store_admins")
      .select("id")
      .eq("store_id", store_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (store.created_by !== user.id && !storeAdmin) {
      return json({ error: "Not authorized for this store" }, 403);
    }

    const state = await signState({ store_id, user_id: user.id, return_url }, stripeSecretKey);
    // Allow a branded domain callback URI; if not configured, fall back to the
    // Supabase Edge Function URL. Stripe requires the redirect_uri to match
    // exactly what is registered in the platform settings.
    const redirectUri = Deno.env.get("STRIPE_CONNECT_REDIRECT_URI") ||
      `${supabaseUrl}/functions/v1/stripe-connect-oauth-callback`;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: connectClientId,
      scope: "read_write",
      redirect_uri: redirectUri,
      state,
    });
    if (user.email) params.set("stripe_user[email]", user.email);

    return json({ url: `https://connect.stripe.com/oauth/authorize?${params.toString()}` });
  } catch (error) {
    console.error("Stripe OAuth start error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
}));
