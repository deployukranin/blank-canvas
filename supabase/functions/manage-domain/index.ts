import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN");
const VERCEL_PROJECT_ID = Deno.env.get("VERCEL_PROJECT_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return new Response(
      JSON.stringify({ success: false, error: "Vercel credentials not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin/creator role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = (roles || []).map((r: { role: string }) => r.role);
    const isAdmin = ["admin", "creator", "ceo", "super_admin"].some((r) => userRoles.includes(r));
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, store_id, domain } = body;

    if (!store_id) {
      return new Response(
        JSON.stringify({ success: false, error: "store_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user owns or admins this store
    const { data: storeCheck } = await supabaseAdmin
      .from("stores")
      .select("id, created_by")
      .eq("id", store_id)
      .single();

    if (!storeCheck) {
      return new Response(
        JSON.stringify({ success: false, error: "Store not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: storeAdminCheck } = await supabaseAdmin
      .from("store_admins")
      .select("id")
      .eq("store_id", store_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (storeCheck.created_by !== user.id && !storeAdminCheck && !userRoles.includes("super_admin")) {
      return new Response(
        JSON.stringify({ success: false, error: "Not authorized for this store" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "add": {
        if (!domain || typeof domain !== "string") {
          return new Response(
            JSON.stringify({ success: false, error: "Domain is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");

        // Validate domain format
        const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
        if (!domainRegex.test(cleanDomain)) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid domain format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Add domain to Vercel
        const vercelRes = await fetch(
          `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${VERCEL_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: cleanDomain }),
          }
        );

        const vercelData = await vercelRes.json();

        if (!vercelRes.ok) {
          const errorMsg = vercelData?.error?.message || "Failed to add domain to Vercel";
          return new Response(
            JSON.stringify({ success: false, error: errorMsg, vercel_error: vercelData }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Save to database
        await supabaseAdmin
          .from("stores")
          .update({
            custom_domain: cleanDomain,
            domain_verified: false,
            domain_added_at: new Date().toISOString(),
          })
          .eq("id", store_id);

        return new Response(
          JSON.stringify({
            success: true,
            domain: cleanDomain,
            verification: vercelData.verification || null,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify": {
        // Check domain config on Vercel
        const { data: store } = await supabaseAdmin
          .from("stores")
          .select("custom_domain")
          .eq("id", store_id)
          .single();

        if (!store?.custom_domain) {
          return new Response(
            JSON.stringify({ success: false, error: "No domain configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const vercelRes = await fetch(
          `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${store.custom_domain}`,
          {
            headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
          }
        );

        const vercelData = await vercelRes.json();

        const isVerified = vercelData?.verified === true;

        if (isVerified) {
          await supabaseAdmin
            .from("stores")
            .update({ domain_verified: true })
            .eq("id", store_id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            verified: isVerified,
            domain: store.custom_domain,
            verification: vercelData.verification || null,
            misconfigured: vercelData?.misconfigured || false,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "remove": {
        const { data: store } = await supabaseAdmin
          .from("stores")
          .select("custom_domain")
          .eq("id", store_id)
          .single();

        if (!store?.custom_domain) {
          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Remove from Vercel
        const vercelRes = await fetch(
          `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${store.custom_domain}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
          }
        );

        await vercelRes.text(); // consume body

        // Clear from database
        await supabaseAdmin
          .from("stores")
          .update({
            custom_domain: null,
            domain_verified: false,
            domain_added_at: null,
          })
          .eq("id", store_id);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action. Use: add, verify, remove" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
