/// <reference lib="deno.ns" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      return json({ error: "YouTube API key not configured" }, 500);
    }

    let channelId = "";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      channelId = String((body as Record<string, unknown>)?.channelId ?? "").trim();
    }

    if (!channelId) {
      return json({ error: "channelId is required" }, 400);
    }

    // Validate format
    if (!channelId.startsWith("UC") || channelId.length < 10) {
      return json({ valid: false, error: "Channel ID deve começar com 'UC'" }, 200);
    }

    const params = new URLSearchParams({
      part: "snippet",
      id: channelId,
      key: apiKey,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`);
    const data = await res.json();

    if (!res.ok) {
      return json({ valid: false, error: "Erro na API do YouTube" }, 200);
    }

    const channel = data.items?.[0];
    if (!channel) {
      return json({ valid: false, error: "Canal não encontrado" }, 200);
    }

    return json({
      valid: true,
      channel: {
        id: channel.id,
        title: channel.snippet?.title ?? "",
        thumbnail: channel.snippet?.thumbnails?.default?.url ?? "",
        description: channel.snippet?.description?.substring(0, 200) ?? "",
      },
    });
  } catch (e) {
    console.error("[validate-youtube-channel] Error:", e);
    return json({ error: "Internal error" }, 500);
  }
});
