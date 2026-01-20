import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { VideoChat } from "@/components/video/VideoChat";
import { VideoReactions } from "@/components/video/VideoReactions";
import type { YouTubeVideoItem } from "@/hooks/use-youtube-videos";

interface VideoWatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVideo: YouTubeVideoItem | null;
  videos: YouTubeVideoItem[];
  onSelectVideo: (videoId: string) => void;
}

export const VideoWatchModal = ({
  open,
  onOpenChange,
  selectedVideo,
  videos,
  onSelectVideo,
}: VideoWatchModalProps) => {
  const otherVideos = useMemo(() => {
    if (!selectedVideo) return [];
    return videos
      .filter((v) => v.video_id !== selectedVideo.video_id)
      .slice(0, 5);
  }, [videos, selectedVideo]);

  const embedUrl = selectedVideo
    ? `https://www.youtube.com/watch?v=${selectedVideo.video_id}`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass w-[calc(100vw-2rem)] max-w-6xl p-0 h-[calc(100dvh-2rem)] overflow-y-auto top-[1rem] translate-y-0">
        {selectedVideo ? (
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Main */}
            <div className="lg:col-span-3 p-4 sm:p-5 space-y-3">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="font-display text-base sm:text-lg">
                  {selectedVideo.video_title}
                </DialogTitle>
              </DialogHeader>

              <div className="rounded-2xl overflow-hidden">
                <VideoPlayer
                  videoUrl={embedUrl}
                  title={selectedVideo.video_title}
                  description={selectedVideo.video_description}
                  autoplay
                  showPreview={false}
                  className="rounded-2xl"
                  onYouTubeVideoIdChange={(nextVideoId) => {
                    // If user clicks a YouTube suggestion inside the player, keep them inside the platform
                    // by switching to the matching video (when it exists in our catalog).
                    if (videos.some((v) => v.video_id === nextVideoId)) {
                      onSelectVideo(nextVideoId);
                    }
                  }}
                />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-border p-4 sm:p-5 space-y-4">
              <div className="space-y-2">
                <h3 className="font-display text-base font-semibold line-clamp-2">
                  {selectedVideo.video_title}
                </h3>
                {selectedVideo.video_description ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
                    {selectedVideo.video_description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sem descrição.
                  </p>
                )}
              </div>

              {/* Reaction buttons */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Como você se sentiu?</p>
                <VideoReactions videoId={selectedVideo.video_id} />
              </div>

              <div>
                <Link to="/customs">
                  <Button className="w-full bg-gradient-to-r from-primary to-accent">
                    Peça um ASMR Personalizado
                  </Button>
                </Link>
                <p className="mt-2 text-xs text-muted-foreground">
                  Diga o estilo, triggers e qualquer detalhe que você quiser.
                </p>
              </div>

              <VideoChat videoId={selectedVideo.video_id} />

              {otherVideos.length > 0 && (
                <section className="space-y-2">
                  <p className="text-sm font-medium">Mais do canal</p>
                  <div className="space-y-2">
                    {otherVideos.map((v) => (
                      <button
                        key={v.video_id}
                        type="button"
                        onClick={() => onSelectVideo(v.video_id)}
                        className="w-full flex gap-3 items-start glass glass-hover rounded-xl p-2 text-left"
                      >
                        <img
                          src={v.thumbnail_url}
                          alt={v.video_title}
                          loading="lazy"
                          className="w-20 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium line-clamp-2">
                            {v.video_title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(v.published_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
