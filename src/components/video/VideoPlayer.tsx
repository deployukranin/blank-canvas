import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  description?: string;
  poster?: string;
  className?: string;
  autoplay?: boolean;
  showPreview?: boolean;
  /**
   * Called when the YouTube iframe player navigates to another video (e.g. user clicks a suggested video).
   * If you pass this, the platform can keep the user inside the modal.
   */
  onYouTubeVideoIdChange?: (videoId: string) => void;
}

type YouTubePostMessage = {
  event?: string;
  info?: {
    videoData?: {
      video_id?: string;
    };
  };
};

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const isYouTubeUrl = (url: string): boolean => {
  return url.includes("youtube.com") || url.includes("youtu.be");
};

export const VideoPlayer = ({
  videoUrl,
  title,
  description,
  poster,
  className = "",
  autoplay = false,
  showPreview = true,
  onYouTubeVideoIdChange,
}: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(Boolean(autoplay));

  const youtubeId = isYouTubeUrl(videoUrl) ? extractYouTubeId(videoUrl) : null;

  // We listen to YouTube iframe postMessages so when a user clicks a suggested video inside the player,
  // we can sync that navigation back to the app (keeping them inside the platform).
  const expectedOrigin = useMemo(() => {
    // youtube embeds can come from multiple hostnames; accept both.
    return new Set(["https://www.youtube.com", "https://www.youtube-nocookie.com"]);
  }, []);

  const lastReportedVideoIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!youtubeId || !onYouTubeVideoIdChange) return;

    const handler = (evt: MessageEvent) => {
      if (typeof evt.origin !== "string" || !expectedOrigin.has(evt.origin)) return;

      let data: unknown = evt.data;
      if (typeof data === "string") {
        // YouTube sends JSON strings.
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      const msg = data as YouTubePostMessage;
      if (msg?.event !== "infoDelivery") return;

      const nextId = msg?.info?.videoData?.video_id;
      if (!nextId || nextId.length !== 11) return;

      if (lastReportedVideoIdRef.current === nextId) return;
      lastReportedVideoIdRef.current = nextId;
      onYouTubeVideoIdChange(nextId);
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [expectedOrigin, onYouTubeVideoIdChange, youtubeId]);

  // YouTube embed
  if (youtubeId) {
    const params = new URLSearchParams({
      modestbranding: "1",
      rel: "0",
      controls: "1",
      disablekb: "0",
      fs: "1",
      playsinline: "1",
      iv_load_policy: "3",
      autoplay: autoplay ? "1" : "0",
      // Needed for postMessage data + (optionally) API events
      enablejsapi: onYouTubeVideoIdChange ? "1" : "0",
      origin: window.location.origin,
    });

    return (
      <div className={`relative overflow-hidden rounded-xl ${className}`}>
        <div className="aspect-video bg-black">
          {showPreview && !isPlaying ? (
            <motion.div
              className="relative w-full h-full cursor-pointer group"
              onClick={() => setIsPlaying(true)}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <img
                src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                alt={title || "Video preview"}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to hqdefault if maxres doesn't exist
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                }}
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-20 h-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-2xl"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-10 h-10 text-white ml-1" fill="white" />
                </motion.div>
              </div>
              {title && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h4 className="font-semibold text-white text-sm">{title}</h4>
                  {description && <p className="text-white/70 text-xs mt-1 line-clamp-2">{description}</p>}
                </div>
              )}
            </motion.div>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?${params.toString()}`}
              title={title || "Video player"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          )}
        </div>
      </div>
    );
  }

  // Native video player for uploaded/direct videos
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <div className="aspect-video bg-black">
        <video
          src={videoUrl}
          poster={poster}
          controls
          playsInline
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={videoUrl} type="video/mp4" />
          Seu navegador não suporta o elemento de vídeo.
        </video>
      </div>
      {title && !isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
          <h4 className="font-semibold text-white text-sm">{title}</h4>
          {description && <p className="text-white/70 text-xs mt-1 line-clamp-2">{description}</p>}
        </div>
      )}
    </div>
  );
};

// Placeholder component when no video is set
export const VideoPlaceholder = ({
  title,
  description,
  className = "",
}: {
  title?: string;
  description?: string;
  className?: string;
}) => {
  const { t } = useTranslation();
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-white/60" />
        </div>
        <p className="text-white/60 text-sm text-center px-4">{t('storefront.noVideoConfigured')}</p>
        {title && <p className="text-white/40 text-xs mt-2">{title}</p>}
      </div>
    </div>
  );
};

