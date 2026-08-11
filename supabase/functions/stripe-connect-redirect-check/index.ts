/**
 * Validates that the Stripe Connect platform redirect URI is exactly the
 * branded domain callback. This lets admins see in the panel whether Stripe
 * is configured correctly before they click "Connect with Stripe".
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { servePrivate, privateCors } from "../_shared/cors.ts";

const EXPECTED_REDIRECT_URI = "https://mytinglebox.com/api/stripe-connect-oauth-callback";

Deno.serve(servePrivate(async (req) => {
  const corsHeaders = privateCors(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) return json({ status: "unknown", expected: EXPECTED_REDIRECT_URI, error: "Stripe not configured" }, 500);

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
    const user = { id: claimsData.claims.sub as string };

    const { store_id } = await req.json();
    if (!store_id) return json({ error: "store_id is required" }, 400);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id, created_by")
      .eq("id", store_id)
      .single();
    if (!store) return json({ error: "Store not found" }, 404);

    const { data: storeAdmin } = await supabaseAdmin
      .from("store_admins")
      .select("id")
      .eq("store_id", store_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: superAdminCheck } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (store.created_by !== user.id && !storeAdmin && !superAdminCheck) {
      return json({ error: "Not authorized for this store" }, 403);
    }

    // Read the platform account settings from Stripe. The Connect redirect URI
    // is not exposed via the Account API, so we do a lightweight OAuth probe:
    // we hit the authorize endpoint with the expected URI and follow the first
    // redirect. Stripe redirects back to the URI with an error if it is not
    // registered; otherwise it goes to the consent/login page.
    const connectClientId = Deno.env.get("STRIPE_CONNECT_CLIENT_ID");
    if (!connectClientId) {
      return json({ status: "unknown", expected: EXPECTED_REDIRECT_URI, error: "STRIPE_CONNECT_CLIENT_ID not configured" }, 500);
    }

    const probeParams = new URLSearchParams({
      response_type: "code",
      client_id: connectClientId,
      scope: "read_write",
      redirect_uri: EXPECTED_REDIRECT_URI,
      state: "probe",
    });
    const probeUrl = `https://connect.stripe.com/oauth/authorize?${probeParams.toString()}`;
    const probeRes = await fetch(probeUrl, { redirect: "manual" });

    const location = probeRes.headers.get("Location") ?? "";
    const locationUrl = location ? new URL(location) : null;
    const errorCode = locationUrl?.searchParams.get("error");

    if (probeRes.status === 302 && location.startsWith(EXPECTED_REDIRECT_URI) && errorCode) {
      return json({ status: "missing", expected: EXPECTED_REDIRECT_URI, configured: null, stripe_error: errorCode }, 200);
    }

    // If Stripe accepted the URI, it will either redirect to the consent page
    // or return the login/authorize page (not back to our URI with an error).
    const accepted = probeRes.status === 302 && !location.startsWith(EXPECTED_REDIRECT_URI);
    if (!accepted && probeRes.status !== 200) {
      return json({ status: "unknown", expected: EXPECTED_REDIRECT_URI, error: `OAuth probe failed: ${probeRes.status}` }, 502);
    }

    return json({ status: "configured", expected: EXPECTED_REDIRECT_URI, configured: [EXPECTED_REDIRECT_URI] }, 200);
  } catch (error) {
    console.error("Stripe redirect URI check error:", error);
    return json({ status: "unknown", expected: EXPECTED_REDIRECT_URI, error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
}));
