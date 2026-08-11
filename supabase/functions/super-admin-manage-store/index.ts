import { servePrivate } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(servePrivate(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is super_admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = { id: claimsData.claims.sub as string };

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check super_admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: super_admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, store_id, plan_type, plan_expires_at } = await req.json();

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!store_id || typeof store_id !== "string" || !UUID_RE.test(store_id)) {
      return new Response(JSON.stringify({ error: "valid store_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "suspend":
        updateData = { status: "suspended", suspended_at: new Date().toISOString() };
        break;
      case "activate":
        updateData = { status: "active", suspended_at: null };
        break;
      case "update_plan": {
        // plan_type comes from the client: accept only known plans, never a raw value.
        const ALLOWED_PLANS = ["trial", "basic", "pro", "premium", "enterprise", "paid"];
        if (plan_type !== undefined) {
          if (typeof plan_type !== "string" || !ALLOWED_PLANS.includes(plan_type)) {
            return new Response(JSON.stringify({ error: "Invalid plan_type" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          updateData.plan_type = plan_type;
        }
        if (plan_expires_at !== undefined && plan_expires_at !== null) {
          const d = new Date(plan_expires_at);
          if (Number.isNaN(d.getTime())) {
            return new Response(JSON.stringify({ error: "Invalid plan_expires_at" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          updateData.plan_expires_at = d.toISOString();
        }
        break;
      }
      case "delete": {
        // Delete related data first (same cascade as the cron cleanup, so no
        // tenant rows survive the store they belonged to).
        for (const table of [
          "store_admins",
          "store_users",
          "invite_codes",
          "app_configurations",
          "custom_orders",
          "video_ideas",
          "video_chat_messages",
          "vip_content",
          "vip_subscriptions",
          "support_tickets",
          "youtube_channel_metrics",
          "youtube_metrics_history",
        ]) {
          await adminClient.from(table).delete().eq("store_id", store_id);
        }
        const { error: delError } = await adminClient.from("stores").delete().eq("id", store_id);

        if (delError) {
          return new Response(JSON.stringify({ error: delError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ success: true, deleted: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const { data, error } = await adminClient
      .from("stores")
      .update(updateData)
      .eq("id", store_id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, store: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}));
