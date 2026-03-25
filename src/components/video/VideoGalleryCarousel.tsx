import { motion } from "framer-motion";

import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { VideoCard } from "@/components/video/VideoCard";
import type { YouTubeVideoItem } from "@/hooks/use-youtube-videos";

interface VideoGalleryCarouselProps {
  videos: YouTubeVideoItem[];
  isLoading?: boolean;
  onSelect: (videoId: string) => void;
  metaById?: Record<string, { isNew?: boolean; progressPercent?: number }>;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (videoId: string) => void;
}

export function VideoGalleryCarousel({
  videos,
  isLoading,
  onSelect,
  metaById,
  favoriteIds,
  onToggleFavorite,
}: VideoGalleryCarouselProps) {
  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-1/2 sm:w-1/3 lg:w-1/4">
              <div className="glass rounded-xl overflow-hidden" aria-hidden>
                <div className="aspect-video bg-muted animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-5/6 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Carousel
      opts={{
        align: "start",
        dragFree: true,
      }}
      plugins={[
        Autoplay({ delay: 4000, stopOnInteraction: true }),
      ]}
      className="relative"
    >
      <CarouselContent>
        {videos.map((video, index) => (
          <CarouselItem key={video.video_id} className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
            >
              <VideoCard
                video={video}
                onClick={() => onSelect(video.video_id)}
                isNew={metaById?.[video.video_id]?.isNew}
                progressPercent={metaById?.[video.video_id]?.progressPercent}
                isFavorite={favoriteIds?.has(video.video_id)}
                onToggleFavorite={onToggleFavorite}
              />
            </motion.div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );
}
