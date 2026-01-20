import { motion } from "framer-motion";
import type { YouTubeVideoItem } from "@/hooks/use-youtube-videos";

interface VideoCardProps {
  video: YouTubeVideoItem;
  onClick: () => void;
  isNew?: boolean;
  progressPercent?: number; // 0..100
}

export const VideoCard = ({ video, onClick, isNew, progressPercent }: VideoCardProps) => {
  const showProgress = typeof progressPercent === "number" && progressPercent > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="glass glass-hover w-full text-left rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
