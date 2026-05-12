import { useEffect, useMemo, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";
import { useYouTubeVideos } from "@/hooks/use-youtube-videos";
import { VideoGalleryByCategory } from "@/components/video/VideoGalleryByCategory";
import { VideoWatchModal } from "@/components/video/VideoWatchModal";
import { ContinueWatching } from "@/components/video/ContinueWatching";
type VideoGalleryPanelProps = {
  className?: string;
};

const normalizeForSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const VideoGalleryPanel = ({ className }: VideoGalleryPanelProps) => {
  const { config } = useWhiteLabel();
  const channelId = config.youtube?.channelId?.trim() || "";

  const { data, isLoading, error } = useYouTubeVideos({
    channelId,
    enabled: Boolean(channelId) && Boolean(config.youtube?.enabled),
  });

  const videos = useMemo(() => data?.videos ?? [], [data]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [startAtSeconds, setStartAtSeconds] = useState<number | undefined>(undefined);
  const [query, setQuery] = useState("");

  const handleSelectVideo = useCallback((videoId: string, startAt?: number) => {
    setSelectedVideoId(videoId);
    setStartAtSeconds(startAt);
  }, []);

  const searchEnabled = config.youtube?.searchEnabled ?? true;
  const categoryPreviewLimit = config.youtube?.categoryPreviewLimit ?? 8;

  const filteredVideos = useMemo(() => {
    if (!searchEnabled) return videos;
    const q = normalizeForSearch(query);
    if (!q) return videos;

    return videos.filter((v) => normalizeForSearch(v.video_title).includes(q));
  }, [query, searchEnabled, videos]);

  useEffect(() => {
    if (!selectedVideoId) return;
    const stillExists = filteredVideos.some((v) => v.video_id === selectedVideoId);
    if (!stillExists) setSelectedVideoId(null);
  }, [filteredVideos, selectedVideoId]);

  const selectedVideo = useMemo(
    () => filteredVideos.find((v) => v.video_id === selectedVideoId) ?? null,
    [filteredVideos, selectedVideoId]
  );

  const title = config.youtube?.enabled ? `Galeria de Vídeos de ${config.siteName}` : "Para Você";

  const categorization = useMemo(
    () => ({
      categories: config.youtube?.categories ?? [],
      videoCategoryMap: config.youtube?.videoCategoryMap ?? {},
    }),
    [config.youtube?.categories, config.youtube?.videoCategoryMap]
  );

  return (
    <>
      <div className={className ?? "space-y-4"}>
        {/* Continue Watching Section */}
        {config.youtube?.enabled && channelId && videos.length > 0 && (
          <ContinueWatching
            videos={videos}
            onSelectVideo={handleSelectVideo}
            className="mb-4"
          />
        )}

        <header className="space-y-3">
          <div className="space-y-1">
            <h1 className="font-display text-lg font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">Assista sem sair da plataforma.</p>
          </div>

          {searchEnabled && config.youtube?.enabled && channelId && !error ? (
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar vídeo pelo título..."
                className="pl-9"
                aria-label="Buscar vídeos"
              />
            </div>
          ) : null}
        </header>

        {!config.youtube?.enabled ? (
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              A galeria de vídeos ainda não está habilitada para este influenciador.
            </p>
          </div>
        ) : !channelId ? (
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              Falta configurar o <span className="font-medium">channelId</span> do YouTube no White Label.
            </p>
          </div>
        ) : error ? (
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {error.message?.includes("quota") || error.message?.includes("Quota")
                ? "⚠️ Limite diário da API do YouTube atingido. Os vídeos estarão disponíveis novamente amanhã."
                : "Não foi possível carregar os vídeos agora. Tente novamente mais tarde."}
            </p>
          </div>
        ) : (
          <VideoGalleryByCategory
            videos={filteredVideos}
            isLoading={isLoading}
            onSelect={(videoId) => handleSelectVideo(videoId)}
            categorization={categorization}
            categoryPreviewLimit={categoryPreviewLimit}
          />
        )}
      </div>

      <VideoWatchModal
        open={Boolean(selectedVideo)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVideoId(null);
            setStartAtSeconds(undefined);
          }
        }}
        videos={filteredVideos}
        selectedVideo={selectedVideo}
        onSelectVideo={(videoId) => handleSelectVideo(videoId)}
        startAtSeconds={startAtSeconds}
      />
    </>
  );
};
