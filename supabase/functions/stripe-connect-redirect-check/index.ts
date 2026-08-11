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

    // Read the platform account settings from Stripe.
    const accountRes = await fetch("https://api.stripe.com/v1/account", {
      headers: { Authorization: `Bearer ${stripeSecretKey}` },
    });

    if (!accountRes.ok) {
      const errBody = await accountRes.text();
      console.error("Stripe platform account read error:", errBody);
      return json({ status: "unknown", expected: EXPECTED_REDIRECT_URI, error: "Failed to read Stripe platform settings" }, 502);
    }

    const account = await accountRes.json();
    console.log("Stripe account settings.connect:", JSON.stringify(account?.settings?.connect ?? null));

    // The configured redirect URI lives under settings.connect.redirect_uri for the platform.
    const connectSettings = account?.settings?.connect ?? {};
    let configuredUris: string[] = [];
    if (Array.isArray(connectSettings.redirect_uris)) {
      configuredUris = connectSettings.redirect_uris;
    } else if (connectSettings.redirect_uri) {
      configuredUris = [connectSettings.redirect_uri];
    }

    if (configuredUris.length === 0) {
      return json({ status: "missing", expected: EXPECTED_REDIRECT_URI, configured: null }, 200);
    }

    const exactMatch = configuredUris.includes(EXPECTED_REDIRECT_URI);

    return json({
      status: exactMatch ? "configured" : "mismatch",
      expected: EXPECTED_REDIRECT_URI,
      configured: configuredUris,
    }, 200);
  } catch (error) {
    console.error("Stripe redirect URI check error:", error);
    return json({ status: "unknown", expected: EXPECTED_REDIRECT_URI, error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
}));
