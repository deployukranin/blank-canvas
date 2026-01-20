import { motion } from 'framer-motion';
import { Play, X } from 'lucide-react';
import { useContinueWatching } from '@/hooks/use-video-watch-history';
import type { YouTubeVideoItem } from '@/hooks/use-youtube-videos';
import { cn } from '@/lib/utils';

interface ContinueWatchingProps {
  videos: YouTubeVideoItem[];
  onSelectVideo: (videoId: string, startAt?: number) => void;
  className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ContinueWatching({ videos, onSelectVideo, className }: ContinueWatchingProps) {
  const { entry, isLoading, dismiss } = useContinueWatching();

  if (isLoading) return null;
  if (!entry) return null;

  const video = videos.find((v) => v.video_id === entry.video_id);
  if (!video) return null;

  const progressPercent = entry.duration_seconds
    ? Math.min(100, (entry.last_position_seconds / entry.duration_seconds) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('relative', className)}
    >
      <button
        type="button"
        onClick={() => onSelectVideo(entry.video_id, entry.last_position_seconds)}
        className="w-full group"
      >
        <div className="relative rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300">
          <div className="flex gap-3 p-3">
            {/* Thumbnail */}
            <div className="relative flex-shrink-0 w-28 sm:w-36 aspect-video rounded-lg overflow-hidden">
              <img
                src={video.thumbnail_url}
                alt={video.video_title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                  <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-left py-0.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                Continuar assistindo
              </p>
              <h4 className="text-sm font-medium line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                {video.video_title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1.5">
                {formatTime(entry.last_position_seconds)}
                {entry.duration_seconds && (
                  <span> / {formatTime(entry.duration_seconds)}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </button>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors z-10"
        aria-label="Dispensar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
