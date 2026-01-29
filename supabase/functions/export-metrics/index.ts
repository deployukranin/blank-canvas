import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-dev-mode",
};

interface MetricsPayload {
  projectId: string;
  timestamp: string;
  period: {
    start: string;
    end: string;
    label: string;
  };
  metrics: {
    users: {
      total: number;
      newInPeriod: number;
      activeInPeriod: number;
      byRole: { admin: number; ceo: number; moderator: number; user: number };
    };
    payments: {
      total: number;
      totalInPeriod: number;
      byStatus: Record<string, number>;
      revenueTotal: number;
      revenueInPeriod: number;
      revenueByProduct: Record<string, number>;
      splitInfluencer: number;
      splitPlatform: number;
    };
    videos: {
      totalReactions: number;
      reactionsInPeriod: number;
      reactionsByType: Record<string, number>;
      topReactedVideos: Array<{ videoId: string; count: number }>;
      totalViews: number;
      viewsInPeriod: number;
      completionRate: number;
      topWatchedVideos: Array<{ videoId: string; views: number }>;
    };
    community: {
      totalChatMessages: number;
      messagesInPeriod: number;
    };
    influencers: {
      total: number;
      active: number;
      syncedWithWoovi: number;
    };
  };
}

function getPeriodStart(periodLabel: string): Date {
  const now = new Date();
  switch (periodLabel) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7days":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30days":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90days":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "all":
    default:
      return new Date(0);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { period = "30days", apiUrl, apiKey, previewOnly = false } = body;

    console.log(`[export-metrics] Starting metrics collection for period: ${period}`);

    const periodStart = getPeriodStart(period);
    const periodStartISO = periodStart.toISOString();
    const now = new Date();

    // ========== USERS METRICS ==========
    console.log("[export-metrics] Collecting user metrics...");

    // Total profiles
    const { count: totalProfiles } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // New users in period
    const { count: newUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", periodStartISO);

    // Active users in period
    const { count: activeUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", periodStartISO);

    // Users by role
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role");

    const byRole = { admin: 0, ceo: 0, moderator: 0, user: 0 };
    if (rolesData) {
      for (const row of rolesData) {
        if (row.role in byRole) {
          byRole[row.role as keyof typeof byRole]++;
        }
      }
    }

    // ========== PAYMENTS METRICS ==========
    console.log("[export-metrics] Collecting payment metrics...");

    // Total payments
    const { count: totalPayments } = await supabase
      .from("pix_payments")
      .select("*", { count: "exact", head: true });

    // Payments in period
    const { count: paymentsInPeriod } = await supabase
      .from("pix_payments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", periodStartISO);

    // Payments by status
    const { data: paymentsStatusData } = await supabase
      .from("pix_payments")
      .select("status");

    const byStatus: Record<string, number> = {};
    if (paymentsStatusData) {
      for (const row of paymentsStatusData) {
        byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      }
    }

    // Revenue calculations
    const { data: completedPayments } = await supabase
      .from("pix_payments")
      .select("value, product_type, split_influencer_value, split_platform_value")
      .eq("status", "COMPLETED");

    let revenueTotal = 0;
    let splitInfluencer = 0;
    let splitPlatform = 0;
    const revenueByProduct: Record<string, number> = {};

    if (completedPayments) {
      for (const p of completedPayments) {
        revenueTotal += p.value || 0;
        splitInfluencer += p.split_influencer_value || 0;
        splitPlatform += p.split_platform_value || 0;
        if (p.product_type) {
          revenueByProduct[p.product_type] = (revenueByProduct[p.product_type] || 0) + (p.value || 0);
        }
      }
    }

    // Revenue in period
    const { data: completedPaymentsInPeriod } = await supabase
      .from("pix_payments")
      .select("value")
      .eq("status", "COMPLETED")
      .gte("created_at", periodStartISO);

    let revenueInPeriod = 0;
    if (completedPaymentsInPeriod) {
      for (const p of completedPaymentsInPeriod) {
        revenueInPeriod += p.value || 0;
      }
    }

    // ========== VIDEO REACTIONS METRICS ==========
    console.log("[export-metrics] Collecting video reactions metrics...");

    // Total reactions
    const { count: totalReactions } = await supabase
      .from("video_reactions")
      .select("*", { count: "exact", head: true });

    // Reactions in period
    const { count: reactionsInPeriod } = await supabase
      .from("video_reactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", periodStartISO);

    // Reactions by type
    const { data: reactionsTypeData } = await supabase
      .from("video_reactions")
      .select("reaction_type");

    const reactionsByType: Record<string, number> = {};
    if (reactionsTypeData) {
      for (const row of reactionsTypeData) {
        reactionsByType[row.reaction_type] = (reactionsByType[row.reaction_type] || 0) + 1;
      }
    }

    // Top reacted videos
    const { data: reactionsVideoData } = await supabase
      .from("video_reactions")
      .select("video_id");

    const reactionsByVideo: Record<string, number> = {};
    if (reactionsVideoData) {
      for (const row of reactionsVideoData) {
        reactionsByVideo[row.video_id] = (reactionsByVideo[row.video_id] || 0) + 1;
      }
    }

    const topReactedVideos = Object.entries(reactionsByVideo)
      .map(([videoId, count]) => ({ videoId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ========== VIDEO WATCH HISTORY METRICS ==========
    console.log("[export-metrics] Collecting watch history metrics...");

    // Total views
    const { count: totalViews } = await supabase
      .from("video_watch_history")
      .select("*", { count: "exact", head: true });

    // Views in period
    const { count: viewsInPeriod } = await supabase
      .from("video_watch_history")
      .select("*", { count: "exact", head: true })
      .gte("created_at", periodStartISO);

    // Completion rate
    const { data: watchHistoryData } = await supabase
      .from("video_watch_history")
      .select("completed");

    let completedCount = 0;
    let totalWatched = 0;
    if (watchHistoryData) {
      totalWatched = watchHistoryData.length;
      completedCount = watchHistoryData.filter((w) => w.completed).length;
    }
    const completionRate = totalWatched > 0 ? (completedCount / totalWatched) * 100 : 0;

    // Top watched videos
    const { data: watchVideoData } = await supabase
      .from("video_watch_history")
      .select("video_id");

    const viewsByVideo: Record<string, number> = {};
    if (watchVideoData) {
      for (const row of watchVideoData) {
        viewsByVideo[row.video_id] = (viewsByVideo[row.video_id] || 0) + 1;
      }
    }

    const topWatchedVideos = Object.entries(viewsByVideo)
      .map(([videoId, views]) => ({ videoId, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // ========== COMMUNITY METRICS ==========
    console.log("[export-metrics] Collecting community metrics...");

    // Total chat messages
    const { count: totalChatMessages } = await supabase
      .from("video_chat_messages")
      .select("*", { count: "exact", head: true });

    // Messages in period
    const { count: messagesInPeriod } = await supabase
      .from("video_chat_messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", periodStartISO);

    // ========== INFLUENCERS METRICS ==========
    console.log("[export-metrics] Collecting influencer metrics...");

    // Total influencers
    const { count: totalInfluencers } = await supabase
      .from("influencers")
      .select("*", { count: "exact", head: true });

    // Active influencers
    const { count: activeInfluencers } = await supabase
      .from("influencers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Synced with Woovi
    const { count: syncedInfluencers } = await supabase
      .from("influencers")
      .select("*", { count: "exact", head: true })
      .not("woovi_subaccount_id", "is", null);

    // ========== BUILD PAYLOAD ==========
    const metricsPayload: MetricsPayload = {
      projectId: Deno.env.get("SUPABASE_URL")?.split("//")[1]?.split(".")[0] || "unknown",
      timestamp: now.toISOString(),
      period: {
        start: periodStartISO,
        end: now.toISOString(),
        label: period,
      },
      metrics: {
        users: {
          total: totalProfiles || 0,
          newInPeriod: newUsers || 0,
          activeInPeriod: activeUsers || 0,
          byRole,
        },
        payments: {
          total: totalPayments || 0,
          totalInPeriod: paymentsInPeriod || 0,
          byStatus,
          revenueTotal,
          revenueInPeriod,
          revenueByProduct,
          splitInfluencer,
          splitPlatform,
        },
        videos: {
          totalReactions: totalReactions || 0,
          reactionsInPeriod: reactionsInPeriod || 0,
          reactionsByType,
          topReactedVideos,
          totalViews: totalViews || 0,
          viewsInPeriod: viewsInPeriod || 0,
          completionRate: Math.round(completionRate * 100) / 100,
          topWatchedVideos,
        },
        community: {
          totalChatMessages: totalChatMessages || 0,
          messagesInPeriod: messagesInPeriod || 0,
        },
        influencers: {
          total: totalInfluencers || 0,
          active: activeInfluencers || 0,
          syncedWithWoovi: syncedInfluencers || 0,
        },
      },
    };

    console.log("[export-metrics] Metrics collected successfully");

    // If preview only, return the metrics without sending
    if (previewOnly) {
      return new Response(JSON.stringify({ success: true, preview: true, data: metricsPayload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate external API configuration
    if (!apiUrl || !apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "apiUrl and apiKey are required to send metrics" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // ========== SEND TO EXTERNAL PANEL ==========
    console.log(`[export-metrics] Sending metrics to: ${apiUrl}`);

    const externalResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(metricsPayload),
    });

    const responseText = await externalResponse.text();
    let externalData;
    try {
      externalData = JSON.parse(responseText);
    } catch {
      externalData = { raw: responseText };
    }

    if (!externalResponse.ok) {
      console.error(`[export-metrics] External API error: ${externalResponse.status}`, externalData);
      return new Response(
        JSON.stringify({
          success: false,
          error: `External API returned ${externalResponse.status}`,
          details: externalData,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
      );
    }

    console.log("[export-metrics] Metrics sent successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Metrics sent successfully",
        sentAt: now.toISOString(),
        externalResponse: externalData,
        data: metricsPayload,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[export-metrics] Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
