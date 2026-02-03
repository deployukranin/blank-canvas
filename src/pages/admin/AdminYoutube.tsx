import { useState, useEffect } from "react";
import { Youtube, RefreshCw } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useYouTubeVideos } from "@/hooks/use-youtube-videos";
import {
  YouTubeCategoryManager,
  type YouTubeCategorizationDraft,
} from "@/components/video/YouTubeCategoryManager";

const STORAGE_KEY_CHANNEL = "admin_youtube_channel_id";
const STORAGE_KEY_CATEGORIES = "admin_youtube_categories";

const AdminYoutube = () => {
  const { toast } = useToast();
  const [channelId, setChannelId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_CHANNEL) || "";
  });
  const [tempChannelId, setTempChannelId] = useState(channelId);
  const [isSaving, setIsSaving] = useState(false);

  const [categorizationDraft, setCategorizationDraft] = useState<YouTubeCategorizationDraft>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { categories: [], videoCategoryMap: {} };
      }
    }
    return { categories: [], videoCategoryMap: {} };
  });

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useYouTubeVideos({
    channelId,
    enabled: Boolean(channelId),
  });

  const videos = data?.videos || [];

  const handleSaveChannel = () => {
    const trimmed = tempChannelId.trim();
    if (!trimmed) {
      toast({
        title: "Erro",
        description: "Por favor, insira o ID do canal do YouTube",
        variant: "destructive",
      });
      return;
    }
    setChannelId(trimmed);
    localStorage.setItem(STORAGE_KEY_CHANNEL, trimmed);
    toast({
      title: "Canal salvo",
      description: "O ID do canal foi salvo com sucesso",
    });
  };

  const handleSaveCategories = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categorizationDraft));
      toast({
        title: "Categorias salvas",
        description: "As configurações de categorias foram salvas com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Falha ao salvar as categorias",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title="YouTube">
      <div className="space-y-6">
        {/* Channel Configuration */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Youtube className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Canal do YouTube</h3>
              <p className="text-sm text-muted-foreground">
                Configure o canal para buscar os vídeos
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel-id">ID do Canal</Label>
              <div className="flex gap-2">
                <Input
                  id="channel-id"
                  value={tempChannelId}
                  onChange={(e) => setTempChannelId(e.target.value)}
                  placeholder="Ex: UCo83ZB3UusOv9-Bx5UxOoJA"
                  className="flex-1"
                />
                <Button onClick={handleSaveChannel}>
                  Salvar Canal
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O ID do canal pode ser encontrado na URL do canal do YouTube
              </p>
            </div>

            {channelId && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm">
                  <span className="text-muted-foreground">Canal configurado: </span>
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {channelId}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  Atualizar Vídeos
                </Button>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Video Stats */}
        {channelId && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-lg">Vídeos do Canal</h3>
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? "Carregando vídeos..."
                    : error
                    ? "Erro ao carregar vídeos"
                    : `${videos.length} vídeos encontrados`}
                </p>
              </div>
              {videos.length > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{videos.length}</p>
                  <p className="text-xs text-muted-foreground">vídeos</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                Erro ao carregar vídeos. Verifique se o ID do canal está correto.
              </div>
            )}

            {/* Recent videos preview */}
            {videos.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium mb-3">Vídeos recentes:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {videos.slice(0, 5).map((video) => (
                    <div key={video.video_id} className="space-y-1">
                      <img
                        src={video.thumbnail_url}
                        alt={video.video_title}
                        className="w-full aspect-video rounded-md object-cover"
                      />
                      <p className="text-xs line-clamp-2">{video.video_title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {/* Category Manager */}
        {channelId && videos.length > 0 && (
          <YouTubeCategoryManager
            videos={videos}
            draft={categorizationDraft}
            onChange={setCategorizationDraft}
            onSave={handleSaveCategories}
            isSaving={isSaving}
          />
        )}

        {/* Empty state */}
        {!channelId && (
          <GlassCard className="p-12 text-center">
            <Youtube className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum canal configurado</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Configure o ID do canal do YouTube acima para começar a gerenciar os vídeos e suas categorias.
            </p>
          </GlassCard>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminYoutube;
