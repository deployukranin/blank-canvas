import { useState, useEffect } from "react";
import { Youtube } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useYouTubeVideos } from "@/hooks/use-youtube-videos";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";
import {
  YouTubeCategoryManager,
  type YouTubeCategorizationDraft,
} from "@/components/video/YouTubeCategoryManager";

const AdminYoutube = () => {
  const { toast } = useToast();
  const { config, updateYouTube } = useWhiteLabel();
  const channelId = config.youtube?.channelId?.trim() || "";
  const [isSaving, setIsSaving] = useState(false);

  const [categorizationDraft, setCategorizationDraft] = useState<YouTubeCategorizationDraft>(() => ({
    categories: config.youtube?.categories || [],
    videoCategoryMap: config.youtube?.videoCategoryMap || {},
  }));

  // Sync draft with context when config changes
  useEffect(() => {
    setCategorizationDraft({
      categories: config.youtube?.categories || [],
      videoCategoryMap: config.youtube?.videoCategoryMap || {},
    });
  }, [config.youtube?.categories, config.youtube?.videoCategoryMap]);

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

  const handleSaveCategories = async () => {
    setIsSaving(true);
    try {
      updateYouTube({
        ...config.youtube,
        categories: categorizationDraft.categories,
        videoCategoryMap: categorizationDraft.videoCategoryMap,
      });
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

  // Empty state when channel is not configured
  if (!channelId) {
    return (
      <AdminLayout title="YouTube">
        <GlassCard className="p-12 text-center">
          <Youtube className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Canal não configurado</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            O ID do canal do YouTube deve ser configurado no Painel CEO em Integrações.
          </p>
        </GlassCard>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="YouTube">
      <div className="space-y-6">
        {/* Channel Info */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Youtube className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">Categorias de Vídeos</h3>
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? "Carregando vídeos..."
                    : error
                    ? "Erro ao carregar vídeos"
                    : `${videos.length} vídeos disponíveis para categorizar`}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              Erro ao carregar vídeos. Verifique se o ID do canal está correto no Painel CEO.
            </div>
          )}
        </GlassCard>

        {/* Category Manager */}
        {videos.length > 0 && (
          <YouTubeCategoryManager
            videos={videos}
            draft={categorizationDraft}
            onChange={setCategorizationDraft}
            onSave={handleSaveCategories}
            isSaving={isSaving}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminYoutube;
