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

const DEFAULT_CATEGORIES: YouTubeCategorizationDraft["categories"] = [
  // 1. Mouth & Voice
  { id: "mouth-voice", name: "Mouth & Voice", icon: "👄", order: 1, keywords: [
    "sussurro", "whispering", "soft spoken", "fala suave", "mouth sounds", "sons de boca",
    "tongue click", "cliques de língua", "inaudible", "inaudível", "eating", "mukbang",
    "chewing", "crunching", "mastigação", "saliva", "ear to ear"
  ]},
  // 2. Tapping & Scratching
  { id: "tapping-scratching", name: "Tapping & Scratching", icon: "🤏", order: 2, keywords: [
    "tapping", "batidinha", "scratching", "arranhar", "crinkle", "amassar",
    "brushing", "escovação", "page turning", "virar páginas", "typing", "teclado",
    "keyboard", "wood tapping", "glass tapping", "paper"
  ]},
  // 3. Personal Attention & Roleplay
  { id: "personal-attention", name: "Personal Attention", icon: "🧑‍⚕️", order: 3, keywords: [
    "personal attention", "atenção pessoal", "roleplay", "encenação", "cranial nerve",
    "nervos cranianos", "haircut", "corte de cabelo", "makeup", "maquiagem",
    "ear cleaning", "limpando ouvido", "spa", "doctor", "medical", "skincare"
  ]},
  // 4. Video Styles
  { id: "video-styles", name: "Video Styles", icon: "🎬", order: 4, keywords: [
    "no talking", "sem fala", "fast and aggressive", "rápido e agressivo", "slow",
    "lento", "gentle", "calmo", "sleep", "dormir", "sleep aid", "lofi",
    "high quality", "4k", "binaural", "3dio"
  ]},
  // 5. Visual & Misc
  { id: "visual-misc", name: "Visual & Misc", icon: "✨", order: 5, keywords: [
    "hand movements", "movimentos de mão", "light trigger", "gatilhos de luz",
    "flashlight", "lanterna", "liquid", "líquido", "water", "spray",
    "foam", "espuma", "soap", "sabonete", "sticky", "pegajoso",
    "tape", "velcro", "shaving cream"
  ]},
];

const AdminYoutube = () => {
  const { toast } = useToast();
  const { config, updateYouTube } = useWhiteLabel();
  const channelId = config.youtube?.channelId?.trim() || "";
  const [isSaving, setIsSaving] = useState(false);

  const existingCategories = config.youtube?.categories;
  const initialCategories = existingCategories && existingCategories.length > 0
    ? existingCategories
    : DEFAULT_CATEGORIES;

  const [categorizationDraft, setCategorizationDraft] = useState<YouTubeCategorizationDraft>(() => ({
    categories: initialCategories,
    videoCategoryMap: config.youtube?.videoCategoryMap || {},
    autoCategorizeEnabled: (config.youtube as any)?.autoCategorizeEnabled ?? false,
  }));

  // Sync draft with context when config changes (but keep defaults if no saved categories)
  useEffect(() => {
    const savedCategories = config.youtube?.categories;
    setCategorizationDraft({
      categories: savedCategories && savedCategories.length > 0 ? savedCategories : DEFAULT_CATEGORIES,
      videoCategoryMap: config.youtube?.videoCategoryMap || {},
      autoCategorizeEnabled: (config.youtube as any)?.autoCategorizeEnabled ?? false,
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
        autoCategorizeEnabled: categorizationDraft.autoCategorizeEnabled,
      } as any);
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
        {/* Video Stats */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Youtube className="w-6 h-6 text-red-500" />
              </div>
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
              Erro ao carregar vídeos. Verifique se o ID do canal está correto no Painel CEO.
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
