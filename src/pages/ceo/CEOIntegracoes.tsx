import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Youtube } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';
import { useYouTubeVideos } from '@/hooks/use-youtube-videos';
import { YouTubeCategoryManager } from '@/components/video/YouTubeCategoryManager';
import { AdminCredentialsManager } from '@/components/ceo/AdminCredentialsManager';

const CEOIntegracoes = () => {
  const { config, updateYouTube } = useWhiteLabel();

  const [youtubeDraft, setYoutubeDraft] = useState({
    enabled: config.youtube?.enabled ?? true,
    channelId: config.youtube?.channelId ?? "",
    searchEnabled: config.youtube?.searchEnabled ?? true,
    categoryPreviewLimit: config.youtube?.categoryPreviewLimit ?? 8,

    continueWatchingEnabled: config.youtube?.continueWatchingEnabled ?? true,
    continueWatchingLimit: config.youtube?.continueWatchingLimit ?? 12,

    newBadgeDays: config.youtube?.newBadgeDays ?? 7,

    trendingEnabled: config.youtube?.trendingEnabled ?? true,
    trendingDays: config.youtube?.trendingDays ?? 7,
    trendingLimit: config.youtube?.trendingLimit ?? 8,

    categories: config.youtube?.categories ?? [],
    videoCategoryMap: config.youtube?.videoCategoryMap ?? {},
  });

  const channelId = youtubeDraft.channelId.trim();

  const { data: ytData } = useYouTubeVideos({
    channelId,
    enabled: Boolean(channelId) && Boolean(youtubeDraft.enabled),
  });

  const videos = useMemo(() => ytData?.videos ?? [], [ytData]);

  const handleSave = () => {
    updateYouTube(youtubeDraft);
    toast.success("Configurações de integrações salvas!");
  };

  return (
    <CEOLayout title="Integrações Externas">
      <div className="space-y-8 max-w-4xl">

        {/* YouTube */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <Youtube className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">YouTube</h3>
                  <p className="text-sm text-muted-foreground">Galeria de vídeos do influenciador</p>
                </div>
              </div>
              <Switch
                checked={youtubeDraft.enabled}
                onCheckedChange={(checked) => setYoutubeDraft((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>

            {youtubeDraft.enabled && (
              <div className="space-y-6 pt-4 border-t border-border">
                <div>
                  <Label className="text-sm">Channel ID</Label>
                  <Input
                    value={youtubeDraft.channelId}
                    onChange={(e) => setYoutubeDraft((prev) => ({ ...prev, channelId: e.target.value }))}
                    placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use o Channel ID (começa com <span className="font-mono">UC</span>). Isso alimenta a galeria em{" "}
                    <span className="font-mono">/galeria-videos</span>.
                  </p>
                </div>

                {/* Galeria (UI) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Busca por título</Label>
                        <p className="text-xs text-muted-foreground">Mostra o campo de busca na Comunidade.</p>
                      </div>
                      <Switch
                        checked={youtubeDraft.searchEnabled}
                        onCheckedChange={(checked) => setYoutubeDraft((prev) => ({ ...prev, searchEnabled: checked }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Limite por categoria</Label>
                    <Input
                      inputMode="numeric"
                      value={youtubeDraft.categoryPreviewLimit === null ? "" : String(youtubeDraft.categoryPreviewLimit)}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) {
                          setYoutubeDraft((prev) => ({ ...prev, categoryPreviewLimit: null }));
                          return;
                        }
                        const n = Number(raw);
                        if (Number.isFinite(n) && n >= 1) {
                          setYoutubeDraft((prev) => ({ ...prev, categoryPreviewLimit: Math.floor(n) }));
                        }
                      }}
                      placeholder="8 (vazio = sem limite)"
                    />
                    <p className="text-xs text-muted-foreground">Exibe "Ver mais" quando houver mais vídeos.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Continuar assistindo</Label>
                        <p className="text-xs text-muted-foreground">Mostra histórico por usuário na Comunidade.</p>
                      </div>
                      <Switch
                        checked={youtubeDraft.continueWatchingEnabled}
                        onCheckedChange={(checked) =>
                          setYoutubeDraft((prev) => ({ ...prev, continueWatchingEnabled: checked }))
                        }
                      />
                    </div>
                    <Input
                      inputMode="numeric"
                      value={String(youtubeDraft.continueWatchingLimit ?? 12)}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n >= 1) {
                          setYoutubeDraft((prev) => ({ ...prev, continueWatchingLimit: Math.floor(n) }));
                        }
                      }}
                      placeholder="12"
                    />
                    <p className="text-xs text-muted-foreground">Quantos vídeos mostrar nessa seção.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Categoria "Em alta"</Label>
                        <p className="text-xs text-muted-foreground">Ordena por visualizações no app.</p>
                      </div>
                      <Switch
                        checked={youtubeDraft.trendingEnabled}
                        onCheckedChange={(checked) => setYoutubeDraft((prev) => ({ ...prev, trendingEnabled: checked }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        inputMode="numeric"
                        value={String(youtubeDraft.trendingDays ?? 7)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n >= 1) {
                            setYoutubeDraft((prev) => ({ ...prev, trendingDays: Math.floor(n) }));
                          }
                        }}
                        placeholder="7"
                      />
                      <Input
                        inputMode="numeric"
                        value={String(youtubeDraft.trendingLimit ?? 8)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n >= 1) {
                            setYoutubeDraft((prev) => ({ ...prev, trendingLimit: Math.floor(n) }));
                          }
                        }}
                        placeholder="8"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Dias (esq) e limite de vídeos (dir).</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Badge "Novo" (dias)</Label>
                    <Input
                      inputMode="numeric"
                      value={String(youtubeDraft.newBadgeDays ?? 7)}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n >= 1) {
                          setYoutubeDraft((prev) => ({ ...prev, newBadgeDays: Math.floor(n) }));
                        }
                      }}
                      placeholder="7"
                    />
                    <p className="text-xs text-muted-foreground">Mostra "Novo" em vídeos publicados recentemente.</p>
                  </div>
                </div>

                {Boolean(channelId) && (
                  <YouTubeCategoryManager
                    videos={videos}
                    draft={{
                      categories: youtubeDraft.categories,
                      videoCategoryMap: youtubeDraft.videoCategoryMap,
                    }}
                    onChange={(next) =>
                      setYoutubeDraft((prev) => ({
                        ...prev,
                        categories: next.categories,
                        videoCategoryMap: next.videoCategoryMap,
                      }))
                    }
                    onSave={() => {
                      updateYouTube(youtubeDraft);
                      toast.success("Categorias salvas!");
                    }}
                  />
                )}

                <div className="flex items-center justify-end pt-2">
                  <Button
                    onClick={() => {
                      updateYouTube(youtubeDraft);
                      toast.success("Configuração do YouTube salva!");
                    }}
                    className="gap-2 bg-gradient-to-r from-primary to-accent"
                  >
                    <Save className="w-4 h-4" />
                    Salvar YouTube
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Admin Credentials */}
        <AdminCredentialsManager />

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end"
        >
          <Button onClick={handleSave} className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
            <Save className="w-4 h-4" />
            Salvar Todas as Integrações
          </Button>
        </motion.div>
      </div>
    </CEOLayout>
  );
};

export default CEOIntegracoes;
