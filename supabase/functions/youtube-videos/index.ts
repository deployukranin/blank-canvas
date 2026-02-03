/// <reference lib="deno.ns" />

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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      console.log("[youtube-videos] Missing YOUTUBE_API_KEY");
      return json({ error: "Missing YOUTUBE_API_KEY" }, 500);
    }

    let channelId = "";

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      channelId = String((body as Record<string, unknown>)?.channelId ?? "").trim();
    } else {
      const url = new URL(req.url);
      channelId = String(url.searchParams.get("channelId") ?? "").trim();
    }

    if (!channelId) {
      return json({ error: "channelId is required" }, 400);
    }

    console.log("[youtube-videos] Processing request for channelId:", channelId);

    // Step 1: Get uploads playlist ID (1 quota unit)
    const uploadsPlaylistId = await getUploadsPlaylistId(channelId, apiKey);
    
    if (!uploadsPlaylistId) {
      return json({ error: "Could not find uploads playlist for channel" }, 404);
    }

    // Step 2: Fetch videos from playlist (1 quota unit per page, max 3 pages = 3 units)
    const { videos, error } = await fetchPlaylistVideos(uploadsPlaylistId, apiKey, 3);

    if (error) {
      return json({ error: "YouTube API error", details: error }, 502);
    }

    // Sort newest first
    videos.sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    console.log(`[youtube-videos] Returning ${videos.length} videos (used ~4 quota units)`);

    return json({ videos });
  } catch (e) {
    console.log("[youtube-videos] Unhandled error:", e);
    return json({ error: "Unhandled error" }, 500);
  }
});
