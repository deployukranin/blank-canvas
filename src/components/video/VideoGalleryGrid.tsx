import { motion } from "framer-motion";
import { VideoCard } from "@/components/video/VideoCard";
import type { YouTubeVideoItem } from "@/hooks/use-youtube-videos";

interface VideoGalleryGridProps {
  videos: YouTubeVideoItem[];
  isLoading?: boolean;
  onSelect: (videoId: string) => void;
  metaById?: Record<string, { isNew?: boolean; progressPercent?: number }>;
}

export const VideoGalleryGrid = ({ videos, isLoading, onSelect, metaById }: VideoGalleryGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass rounded-xl overflow-hidden" aria-hidden>
            <div className="aspect-video bg-muted animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-5/6 bg-muted animate-pulse rounded" />
              <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {videos.map((video, index) => (
          <motion.div
            key={video.video_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.3) }}
          >
            <VideoCard
              video={video}
              onClick={() => onSelect(video.video_id)}
              isNew={metaById?.[video.video_id]?.isNew}
              progressPercent={metaById?.[video.video_id]?.progressPercent}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
};
