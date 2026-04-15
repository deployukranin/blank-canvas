import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Find trial stores expired more than 7 days ago
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiredStores, error: fetchError } = await adminClient
      .from("stores")
      .select("id, name, slug")
      .eq("plan_type", "trial")
      .lt("plan_expires_at", cutoffDate);

    if (fetchError) {
      console.error("Error fetching expired stores:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!expiredStores || expiredStores.length === 0) {
      return new Response(JSON.stringify({ deleted: 0, message: "No expired stores to clean up" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let deletedCount = 0;

    for (const store of expiredStores) {
      console.log(`Deleting expired store: ${store.name} (${store.slug})`);

      // Cascade delete related data
      await adminClient.from("store_admins").delete().eq("store_id", store.id);
      await adminClient.from("store_users").delete().eq("store_id", store.id);
      await adminClient.from("invite_codes").delete().eq("store_id", store.id);
      await adminClient.from("app_configurations").delete().eq("store_id", store.id);
      await adminClient.from("custom_orders").delete().eq("store_id", store.id);
      await adminClient.from("video_ideas").delete().eq("store_id", store.id);
      await adminClient.from("video_chat_messages").delete().eq("store_id", store.id);
      await adminClient.from("vip_content").delete().eq("store_id", store.id);
      await adminClient.from("vip_subscriptions").delete().eq("store_id", store.id);
      await adminClient.from("support_tickets").delete().eq("store_id", store.id);
      await adminClient.from("youtube_channel_metrics").delete().eq("store_id", store.id);
      await adminClient.from("youtube_metrics_history").delete().eq("store_id", store.id);

      const { error: delError } = await adminClient.from("stores").delete().eq("id", store.id);
      if (delError) {
        console.error(`Failed to delete store ${store.id}:`, delError);
      } else {
        deletedCount++;
      }
    }

    return new Response(JSON.stringify({ deleted: deletedCount, total_found: expiredStores.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cleanup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
