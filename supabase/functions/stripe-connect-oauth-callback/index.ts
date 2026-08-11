/**
 * Stripe Connect OAuth callback.
 *
 * Stripe redirects the creator's browser here with ?code&state. We exchange the
 * code for the connected account id, store it on the tenant and bounce the user
 * back to their payments panel. Public (no JWT): the signed state is the proof.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyState, isAllowedReturnUrl } from "../_shared/stripe-oauth-state.ts";

const FALLBACK_RETURN = "https://mytinglebox.com/";

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}

function withParam(base: string, key: string, value: string) {
  try {
    const u = new URL(base);
    u.searchParams.set(key, value);
    return u.toString();
  } catch {
    return FALLBACK_RETURN;
  }
}

Deno.serve(async (req) => {
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) return redirect(withParam(FALLBACK_RETURN, "stripe", "error"));

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const stripeError = url.searchParams.get("error");

    const state = stateParam ? await verifyState(stateParam, stripeSecretKey) : null;
    const returnUrl = state && isAllowedReturnUrl(state.return_url) ? state.return_url : FALLBACK_RETURN;

    if (!state) return redirect(withParam(FALLBACK_RETURN, "stripe", "invalid_state"));
    if (stripeError || !code) return redirect(withParam(returnUrl, "stripe", "cancelled"));

    // Exchange the authorization code for the connected account id
    const tokenRes = await fetch("https://connect.stripe.com/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code }),
    });

    if (!tokenRes.ok) {
      console.error("Stripe OAuth token error:", tokenRes.status, await tokenRes.text());
      return redirect(withParam(returnUrl, "stripe", "error"));
    }

    const tokenBody = await tokenRes.json();
    const accountId: string | undefined = tokenBody.stripe_user_id;
    if (!accountId) return redirect(withParam(returnUrl, "stripe", "error"));

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Re-verify authorization server-side (the state is signed, but ownership
    // may have changed between start and callback).
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id, created_by")
      .eq("id", state.store_id)
      .maybeSingle();
    if (!store) return redirect(withParam(returnUrl, "stripe", "error"));

    const { data: storeAdmin } = await supabaseAdmin
      .from("store_admins")
      .select("id")
      .eq("store_id", state.store_id)
      .eq("user_id", state.user_id)
      .maybeSingle();

    if (store.created_by !== state.user_id && !storeAdmin) {
      return redirect(withParam(returnUrl, "stripe", "forbidden"));
    }

    // Guard against linking the same Stripe account to two different tenants.
    const { data: taken } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("stripe_account_id", accountId)
      .neq("id", state.store_id)
      .maybeSingle();
    if (taken) return redirect(withParam(returnUrl, "stripe", "account_in_use"));

    await supabaseAdmin
      .from("stores")
      .update({ stripe_account_id: accountId })
      .eq("id", state.store_id);

    return redirect(withParam(returnUrl, "stripe", "connected"));
  } catch (error) {
    console.error("Stripe OAuth callback error:", error);
    return redirect(withParam(FALLBACK_RETURN, "stripe", "error"));
  }
});
