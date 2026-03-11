/// <reference lib="deno.ns" />

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type YouTubeVideoItem = {
  video_id: string;
  thumbnail_url: string;
  video_title: string;
  video_description: string;
  published_at: string;
};

type CacheMetadata = {
  last_fetched_at: string;
  video_count: number;
};

type CachedVideo = {
  video_id: string;
  thumbnail_url: string | null;
  video_title: string;
  video_description: string | null;
  published_at: string | null;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Cache TTL in minutes (6 hours = 360 minutes)
const CACHE_TTL_MINUTES = 360;

// Get the uploads playlist ID from a channel (costs 1 quota unit)
async function getUploadsPlaylistId(channelId: string, apiKey: string): Promise<string | null> {
  const params = new URLSearchParams({
    part: "contentDetails",
    id: channelId,
    key: apiKey,
  });

  const url = `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`;
  console.log("[youtube-videos] Fetching channel info for:", channelId);
  
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    console.log("[youtube-videos] Channels API error:", data);
    return null;
  }

  const uploadsPlaylistId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  console.log("[youtube-videos] Uploads playlist ID:", uploadsPlaylistId);
  
  return uploadsPlaylistId || null;
}

// Fetch videos from uploads playlist (costs 1 quota unit per request)
async function fetchPlaylistVideos(
  playlistId: string,
  apiKey: string,
  maxPages = 3
): Promise<{ videos: YouTubeVideoItem[]; error?: unknown }> {
  const videos: YouTubeVideoItem[] = [];
  let pageToken: string | undefined;

  for (let i = 0; i < maxPages; i++) {
    const params = new URLSearchParams({
      part: "snippet",
      playlistId,
      maxResults: "50",
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const url = `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`;
    console.log(`[youtube-videos] Fetching playlist page ${i + 1}`);
    
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      console.log("[youtube-videos] PlaylistItems API error:", data);
      return { videos: [], error: data };
    }

    for (const item of data.items ?? []) {
      const snippet = item?.snippet;
      const video_id = snippet?.resourceId?.videoId;
      
      // Skip deleted/private videos
      if (!video_id || !snippet || snippet.title === "Deleted video" || snippet.title === "Private video") {
        continue;
      }

      const thumbnail_url =
        snippet?.thumbnails?.maxres?.url ||
        snippet?.thumbnails?.high?.url ||
        snippet?.thumbnails?.medium?.url ||
        snippet?.thumbnails?.default?.url ||
        "";

      videos.push({
        video_id,
        thumbnail_url,
        video_title: snippet.title ?? "",
        video_description: snippet.description ?? "",
        published_at: snippet.publishedAt ?? "",
      });
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return { videos };
}

// Check if cache is valid
async function getCachedVideos(
  supabase: SupabaseClient,
  channelId: string
): Promise<{ videos: YouTubeVideoItem[]; isValid: boolean }> {
  try {
    // Check cache metadata
    const { data: metadata, error: metaError } = await supabase
      .from("youtube_cache_metadata")
      .select("last_fetched_at, video_count")
      .eq("channel_id", channelId)
      .single();

    if (metaError || !metadata) {
      console.log("[youtube-videos] No cache metadata found for channel:", channelId);
      return { videos: [], isValid: false };
    }

    const typedMetadata = metadata as CacheMetadata;
    const lastFetched = new Date(typedMetadata.last_fetched_at);
    const now = new Date();
    const ageMinutes = (now.getTime() - lastFetched.getTime()) / (1000 * 60);

    if (ageMinutes > CACHE_TTL_MINUTES) {
      console.log(`[youtube-videos] Cache expired (age: ${ageMinutes.toFixed(0)} min)`);
      return { videos: [], isValid: false };
    }

    // Get cached videos
    const { data: cachedVideos, error } = await supabase
      .from("youtube_videos_cache")
      .select("video_id, thumbnail_url, video_title, video_description, published_at")
      .eq("channel_id", channelId)
      .order("published_at", { ascending: false });

    if (error || !cachedVideos?.length) {
      console.log("[youtube-videos] No cached videos found");
      return { videos: [], isValid: false };
    }

    console.log(`[youtube-videos] Returning ${cachedVideos.length} cached videos (age: ${ageMinutes.toFixed(0)} min)`);
    
    const typedVideos = cachedVideos as CachedVideo[];
    
    return {
      videos: typedVideos.map((v) => ({
        video_id: v.video_id,
        thumbnail_url: v.thumbnail_url ?? "",
        video_title: v.video_title,
        video_description: v.video_description ?? "",
        published_at: v.published_at ?? "",
      })),
      isValid: true,
    };
  } catch (err) {
    console.log("[youtube-videos] Cache check error:", err);
    return { videos: [], isValid: false };
  }
}

// Update cache with new videos
async function updateCache(
  supabase: SupabaseClient,
  channelId: string,
  videos: YouTubeVideoItem[]
): Promise<void> {
  try {
    console.log(`[youtube-videos] Updating cache with ${videos.length} videos`);

    // Delete old cache for this channel
    await supabase
      .from("youtube_videos_cache")
      .delete()
      .eq("channel_id", channelId);

    // Insert new videos
    if (videos.length > 0) {
      const videosToInsert = videos.map((v) => ({
        channel_id: channelId,
        video_id: v.video_id,
        thumbnail_url: v.thumbnail_url,
        video_title: v.video_title,
        video_description: v.video_description,
        published_at: v.published_at || null,
      }));

      const { error: insertError } = await supabase
        .from("youtube_videos_cache")
        .insert(videosToInsert);

      if (insertError) {
        console.log("[youtube-videos] Error inserting cache:", insertError);
      }
    }

    // Update or insert metadata
    const { error: metaError } = await supabase
      .from("youtube_cache_metadata")
      .upsert(
        {
          channel_id: channelId,
          last_fetched_at: new Date().toISOString(),
          video_count: videos.length,
        },
        { onConflict: "channel_id" }
      );

    if (metaError) {
      console.log("[youtube-videos] Error updating cache metadata:", metaError);
    } else {
      console.log("[youtube-videos] Cache updated successfully");
    }
  } catch (err) {
    console.log("[youtube-videos] Cache update error:", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("[youtube-videos] Missing Supabase credentials");
      return json({ error: "Missing Supabase credentials" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let channelId = "";
    let forceRefresh = false;

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      channelId = String((body as Record<string, unknown>)?.channelId ?? "").trim();
      forceRefresh = Boolean((body as Record<string, unknown>)?.forceRefresh);
    } else {
      const url = new URL(req.url);
      channelId = String(url.searchParams.get("channelId") ?? "").trim();
      forceRefresh = url.searchParams.get("forceRefresh") === "true";
    }

    if (!channelId) {
      return json({ error: "channelId is required" }, 400);
    }

    console.log("[youtube-videos] Processing request for channelId:", channelId, "forceRefresh:", forceRefresh);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { videos: cachedVideos, isValid } = await getCachedVideos(supabase, channelId);
      if (isValid && cachedVideos.length > 0) {
        return json({ videos: cachedVideos, fromCache: true });
      }
    }

    // If no API key, return cached data even if expired, or error
    if (!apiKey) {
      console.log("[youtube-videos] Missing YOUTUBE_API_KEY, trying stale cache");
      const { videos: staleVideos } = await getCachedVideos(supabase, channelId);
      if (staleVideos.length > 0) {
        return json({ videos: staleVideos, fromCache: true, stale: true });
      }
      return json({ error: "Missing YOUTUBE_API_KEY" }, 500);
    }

    // Fetch from YouTube API
    console.log("[youtube-videos] Fetching fresh data from YouTube API");

    // Step 1: Get uploads playlist ID (1 quota unit)
    const uploadsPlaylistId = await getUploadsPlaylistId(channelId, apiKey);
    let totalQuotaUsed = 1; // channels.list = 1 unit
    
    if (!uploadsPlaylistId) {
      // Log quota usage even on failure
      await logQuotaUsage(supabase, channelId, totalQuotaUsed, "channels");
      // Try returning stale cache on error
      const { videos: staleVideos } = await getCachedVideos(supabase, channelId);
      if (staleVideos.length > 0) {
        return json({ videos: staleVideos, fromCache: true, stale: true });
      }
      return json({ error: "Could not find uploads playlist for channel" }, 404);
    }

    // Step 2: Fetch videos from playlist (1 quota unit per page, max 3 pages = 3 units)
    const { videos, error } = await fetchPlaylistVideos(uploadsPlaylistId, apiKey, 3);
    totalQuotaUsed += 3; // max 3 pages

    if (error) {
      // Check if it's a quota error
      const errorDetails = error as { error?: { errors?: Array<{ reason?: string }> } };
      const isQuotaError = errorDetails?.error?.errors?.some(e => e.reason === "quotaExceeded");
      
      await logQuotaUsage(supabase, channelId, totalQuotaUsed, "playlistItems");

      if (isQuotaError) {
        console.log("[youtube-videos] Quota exceeded, trying stale cache");
        const { videos: staleVideos } = await getCachedVideos(supabase, channelId);
        if (staleVideos.length > 0) {
          return json({ videos: staleVideos, fromCache: true, stale: true, quotaExceeded: true });
        }
      }
      
      return json({ error: "YouTube API error", details: error }, 502);
    }

    // Log quota usage
    await logQuotaUsage(supabase, channelId, totalQuotaUsed, "playlistItems");

    // Sort newest first
    videos.sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    // Update cache in background
    updateCache(supabase, channelId, videos).catch((err) => {
      console.log("[youtube-videos] Background cache update failed:", err);
    });

    console.log(`[youtube-videos] Returning ${videos.length} fresh videos (used ~${totalQuotaUsed} quota units)`);

    return json({ videos, fromCache: false });
  } catch (e) {
    console.log("[youtube-videos] Unhandled error:", e);
    return json({ error: "Unhandled error" }, 500);
  }
});
