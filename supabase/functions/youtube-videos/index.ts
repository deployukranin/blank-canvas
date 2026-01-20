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
      channelId = String((body as any)?.channelId ?? "").trim();
    } else {
      const url = new URL(req.url);
      channelId = String(url.searchParams.get("channelId") ?? "").trim();
    }

    if (!channelId) {
      return json({ error: "channelId is required" }, 400);
    }

    console.log("[youtube-videos] Fetching for channelId:", channelId);

    const videos: YouTubeVideoItem[] = [];
    let pageToken: string | undefined;

    // Fetch up to ~150 items (3 pages) to avoid heavy requests.
    for (let i = 0; i < 3; i++) {
      const params = new URLSearchParams({
        part: "snippet",
        channelId,
        maxResults: "50",
        order: "date",
        type: "video",
        key: apiKey,
      });
      if (pageToken) params.set("pageToken", pageToken);

      const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        console.log("[youtube-videos] YouTube API error:", data);
        return json({ error: "YouTube API error", details: data }, 502);
      }

      for (const item of data.items ?? []) {
        const video_id = item?.id?.videoId;
        const snippet = item?.snippet;
        if (!video_id || !snippet) continue;

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

    // Ensure newest->oldest
    videos.sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    return json({ videos });
  } catch (e) {
    console.log("[youtube-videos] Unhandled error:", e);
    return json({ error: "Unhandled error" }, 500);
  }
});
