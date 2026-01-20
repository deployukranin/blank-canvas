import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface YouTubeVideoItem {
  video_id: string;
  thumbnail_url: string;
  video_title: string;
  video_description: string;
  published_at: string;
}

interface UseYouTubeVideosParams {
  channelId: string;
  enabled?: boolean;
}

export const useYouTubeVideos = ({ channelId, enabled = true }: UseYouTubeVideosParams) => {
  return useQuery({
    queryKey: ["youtube-videos", channelId],
    enabled: enabled && Boolean(channelId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("youtube-videos", {
        body: { channelId },
      });

      if (error) throw error;

      const videos = ((data?.videos ?? []) as YouTubeVideoItem[])
        .filter((v) => v?.video_id)
        .sort(
          (a, b) =>
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        );

      return { videos };
    },
  });
};
