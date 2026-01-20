import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { YouTubeVideoItem } from "@/hooks/use-youtube-videos";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: YouTubeVideoItem;
  onClick: () => void;
  isNew?: boolean;
  progressPercent?: number; // 0..100
  isFavorite?: boolean;
  onToggleFavorite?: (videoId: string) => void;
}

export const VideoCard = ({
  video,
  onClick,
  isNew,
  progressPercent,
  isFavorite,
  onToggleFavorite,
}: VideoCardProps) => {
  const showProgress = typeof progressPercent === "number" && progressPercent > 0;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(video.video_id);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="glass glass-hover w-full text-left rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative group"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        <motion.img
          src={video.thumbnail_url}
          alt={video.video_title}
          loading="lazy"
          className="w-full h-full object-cover"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.25 }}
        />

        {isNew ? (
          <div className="absolute left-2 top-2">
            <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              Novo
            </span>
          </div>
        ) : null}

        {/* Favorite button */}
        {onToggleFavorite && (
          <div
            role="button"
            tabIndex={0}
            onClick={handleFavoriteClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleFavoriteClick(e as unknown as React.MouseEvent);
              }
            }}
            className={cn(
              "absolute right-2 top-2 w-8 h-8 rounded-full flex items-center justify-center transition-all",
              "bg-background/80 backdrop-blur-sm hover:bg-background",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              isFavorite && "opacity-100"
            )}
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              )}
            />
          </div>
        )}

        {showProgress ? (
          <div className="absolute left-0 right-0 bottom-0 h-1 bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent ?? 0))}%` }}
              aria-hidden
            />
          </div>
        ) : null}
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-foreground line-clamp-2">{video.video_title}</p>
      </div>
    </button>
  );
};
