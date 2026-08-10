import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, MessageCircle, Info, ListVideo } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { VideoChat } from "@/components/video/VideoChat";
import { VideoReactions } from "@/components/video/VideoReactions";
import { useTenant } from "@/contexts/TenantContext";
import { cn } from "@/lib/utils";
import type { YouTubeVideoItem } from "@/hooks/use-youtube-videos";

export interface ImmersiveVideoViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVideo: YouTubeVideoItem | null;
  videos: YouTubeVideoItem[];
  onSelectVideo: (videoId: string) => void;
  startAtSeconds?: number;
}

type PanelTab = "about" | "comments" | "more";

export const ImmersiveVideoView = ({
  open,
  onOpenChange,
  selectedVideo,
  videos,
  onSelectVideo,
  startAtSeconds,
}: ImmersiveVideoViewProps) => {
  const { t } = useTranslation();
  const { basePath, isTenantScope } = useTenant();
  const [tab, setTab] = useState<PanelTab>("about");
  const customsPath = isTenantScope ? `${basePath}/customs` : "/customs";

  const otherVideos = useMemo(() => {
    if (!selectedVideo) return [];
    return videos.filter((v) => v.video_id !== selectedVideo.video_id).slice(0, 12);
  }, [videos, selectedVideo]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  if (typeof document === "undefined") return null;

  const embedUrl = selectedVideo
    ? `https://www.youtube.com/watch?v=${selectedVideo.video_id}${startAtSeconds ? `&t=${startAtSeconds}` : ""}`
    : "";

  const tabs: Array<{ id: PanelTab; label: string; icon: typeof Info }> = [
    { id: "about", label: t("video.about", "About"), icon: Info },
    { id: "comments", label: t("video.comments", "Comments"), icon: MessageCircle },
    { id: "more", label: t("video.moreFromChannel", "More"), icon: ListVideo },
  ];

  return createPortal(
    <AnimatePresence>
      {open && selectedVideo && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={selectedVideo.video_title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-background"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30 blur-3xl scale-110"
            style={{
              backgroundImage: `url(${selectedVideo.thumbnail_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-2xl" aria-hidden />

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t("common.close", "Close")}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-foreground/10 hover:bg-foreground/20 backdrop-blur flex items-center justify-center text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 h-full w-full overflow-y-auto lg:overflow-hidden">
            <div className="h-full w-full flex flex-col lg:flex-row">
              <div className="flex-1 min-w-0 flex flex-col justify-center px-4 sm:px-8 lg:px-12 pt-14 lg:pt-10 pb-6">
                <motion.div
                  initial={{ scale: 0.97, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-[1400px] mx-auto"
                >
                  <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/40">
                    <VideoPlayer
                      key={selectedVideo.video_id}
                      videoUrl={embedUrl}
                      title={selectedVideo.video_title}
                      description={selectedVideo.video_description}
                      autoplay
                      showPreview={false}
                      className="rounded-2xl"
                      onYouTubeVideoIdChange={(nextVideoId) => {
                        if (videos.some((v) => v.video_id === nextVideoId)) {
                          onSelectVideo(nextVideoId);
                        }
                      }}
                    />
                  </div>

                  <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <h1 className="font-display text-lg sm:text-2xl font-bold text-foreground line-clamp-2">
                      {selectedVideo.video_title}
                    </h1>
                    <VideoReactions videoId={selectedVideo.video_id} />
                  </div>
                </motion.div>
              </div>

              <aside className="w-full lg:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-border/40 bg-card/40 backdrop-blur-xl flex flex-col lg:h-full">
                <div className="flex items-center gap-1 p-3 border-b border-border/40">
                  {tabs.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                        tab === item.id
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 lg:overflow-y-auto p-4 space-y-4">
                  {tab === "about" && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {selectedVideo.video_description || t("video.noDescription", "No description.")}
                      </p>
                      <div>
                        <Link to={customsPath}>
                          <Button className="w-full bg-gradient-to-r from-primary to-accent">
                            {t("video.requestCustom", "Request a custom ASMR")}
                          </Button>
                        </Link>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t("video.requestCustomDesc", "Tell us the style, triggers and any detail you want.")}
                        </p>
                      </div>
                    </div>
                  )}

                  {tab === "comments" && <VideoChat videoId={selectedVideo.video_id} />}

                  {tab === "more" && (
                    <div className="space-y-2">
                      {otherVideos.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          {t("video.noOtherVideos", "No other videos yet.")}
                        </p>
                      )}
                      {otherVideos.map((v) => (
                        <button
                          key={v.video_id}
                          type="button"
                          onClick={() => onSelectVideo(v.video_id)}
                          className="w-full flex gap-3 items-start rounded-xl p-2 text-left border border-transparent hover:border-primary/30 hover:bg-foreground/5 transition-colors"
                        >
                          <img
                            src={v.thumbnail_url}
                            alt={v.video_title}
                            loading="lazy"
                            className="w-24 h-14 rounded-lg object-cover flex-shrink-0"
                          />
                          <p className="text-xs font-medium line-clamp-3 text-foreground">{v.video_title}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ImmersiveVideoView;
