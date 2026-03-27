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
    const { channelId, storeId } = await req.json();

    if (!channelId || !storeId) {
      return new Response(
        JSON.stringify({ error: "channelId and storeId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const youtubeKey = Deno.env.get("YOUTUBE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if we already have metrics for TODAY
    const today = new Date().toISOString().split("T")[0];
    const { data: todaySnapshot } = await supabase
      .from("youtube_metrics_history")
      .select("*")
      .eq("store_id", storeId)
      .eq("channel_id", channelId)
      .eq("recorded_at", today)
      .maybeSingle();

    if (todaySnapshot) {
      console.log(`[yt-metrics] Already have today's snapshot, returning cached`);
      // Also update the main metrics table
      return new Response(JSON.stringify({ success: true, metrics: todaySnapshot, fromCache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check main cache (less than 24h old)
    const { data: cached } = await supabase
      .from("youtube_channel_metrics")
      .select("*")
      .eq("store_id", storeId)
      .eq("channel_id", channelId)
      .maybeSingle();

    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      const maxAge = 24 * 60 * 60 * 1000;
      if (age < maxAge) {
        console.log(`[yt-metrics] Returning cached metrics (age: ${Math.round(age / 60000)}min)`);
        // Save daily snapshot if not exists
        await supabase.from("youtube_metrics_history").upsert({
          store_id: storeId,
          channel_id: channelId,
          subscriber_count: cached.subscriber_count,
          total_view_count: cached.total_view_count,
          total_video_count: cached.total_video_count,
          views_last_30d: cached.views_last_30d,
          videos_last_30d: cached.videos_last_30d,
          recorded_at: today,
        }, { onConflict: "store_id,channel_id,recorded_at" });

        return new Response(JSON.stringify({ success: true, metrics: cached, fromCache: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!youtubeKey) {
      // Return stale data if available
      if (cached) {
        return new Response(JSON.stringify({ success: true, metrics: cached, fromCache: true, stale: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ error: "YOUTUBE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch channel statistics
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${youtubeKey}`;
    const channelRes = await fetch(channelUrl);
    const channelData = await channelRes.json();

    if (!channelData.items?.length) {
      return new Response(
        JSON.stringify({ error: "Channel not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const channelStats = channelData.items[0].statistics;
    const subscriberCount = parseInt(channelStats.subscriberCount || "0");
    const totalViewCount = parseInt(channelStats.viewCount || "0");
    const totalVideoCount = parseInt(channelStats.videoCount || "0");

    // Fetch recent videos from cache to calculate 30-day metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentVideos } = await supabase
      .from("youtube_videos_cache")
      .select("video_id, video_title, published_at, thumbnail_url")
      .eq("channel_id", channelId)
      .gte("published_at", thirtyDaysAgo.toISOString())
      .order("published_at", { ascending: false });

    const videosLast30d = recentVideos?.length || 0;

    let viewsLast30d = 0;
    const topVideos: Array<{ id: string; title: string; views: number; thumbnail: string }> = [];

    if (recentVideos?.length) {
      const videoIds = recentVideos.map(v => v.video_id).slice(0, 50).join(",");
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${youtubeKey}`;
      const statsRes = await fetch(statsUrl);
      const statsData = await statsRes.json();

      if (statsData.items) {
        for (const item of statsData.items) {
          const views = parseInt(item.statistics?.viewCount || "0");
          viewsLast30d += views;
          const cachedVid = recentVideos.find(v => v.video_id === item.id);
          topVideos.push({
            id: item.id,
            title: cachedVid?.video_title || "",
            views,
            thumbnail: cachedVid?.thumbnail_url || "",
          });
        }
        topVideos.sort((a, b) => b.views - a.views);
        topVideos.splice(5);
      }
    }

    const metrics = {
      channel_id: channelId,
      store_id: storeId,
      subscriber_count: subscriberCount,
      total_view_count: totalViewCount,
      total_video_count: totalVideoCount,
      views_last_30d: viewsLast30d,
      videos_last_30d: videosLast30d,
      top_videos: topVideos,
      fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upsert into main cache
    await supabase
      .from("youtube_channel_metrics")
      .upsert(metrics, { onConflict: "store_id,channel_id" });

    // Save daily snapshot
    await supabase.from("youtube_metrics_history").upsert({
      store_id: storeId,
      channel_id: channelId,
      subscriber_count: subscriberCount,
      total_view_count: totalViewCount,
      total_video_count: totalVideoCount,
      views_last_30d: viewsLast30d,
      videos_last_30d: videosLast30d,
      recorded_at: today,
    }, { onConflict: "store_id,channel_id,recorded_at" });

    console.log(`[yt-metrics] Fetched fresh metrics for ${channelId}: ${subscriberCount} subs, ${viewsLast30d} views (30d)`);

    return new Response(JSON.stringify({ success: true, metrics, fromCache: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[yt-metrics] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
