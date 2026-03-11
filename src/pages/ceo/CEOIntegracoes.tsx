import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Youtube, Store, Plus, Trash2 } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';
import { useYouTubeVideos } from '@/hooks/use-youtube-videos';
import { YouTubeCategoryManager } from '@/components/video/YouTubeCategoryManager';

interface StoreChannel {
  id: string;
  storeName: string;
  channelId: string;
  enabled: boolean;
}

const CEOIntegracoes = () => {
  const { config, updateYouTube } = useWhiteLabel();

  // Per-store channel IDs (stored in youtube config)
  const [storeChannels, setStoreChannels] = useState<StoreChannel[]>(() => {
    const saved = config.youtube?.storeChannels as StoreChannel[] | undefined;
    if (Array.isArray(saved) && saved.length > 0) return saved;
    // Migrate from single channelId
    if (config.youtube?.channelId) {
      return [{ id: '1', storeName: 'Loja Principal', channelId: config.youtube.channelId, enabled: true }];
    }
    return [];
  });

  const [youtubeDraft, setYoutubeDraft] = useState({
    enabled: config.youtube?.enabled ?? true,
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

  // Active channel = first enabled store channel
  const activeChannel = storeChannels.find(sc => sc.enabled);
  const channelId = activeChannel?.channelId?.trim() || '';

  const { data: ytData } = useYouTubeVideos({
    channelId,
    enabled: Boolean(channelId) && Boolean(youtubeDraft.enabled),
  });

  const videos = useMemo(() => ytData?.videos ?? [], [ytData]);

  // Store channel CRUD
  const addStoreChannel = () => {
    const newChannel: StoreChannel = {
      id: crypto.randomUUID(),
      storeName: '',
      channelId: '',
      enabled: storeChannels.length === 0,
    };
    setStoreChannels(prev => [...prev, newChannel]);
  };

  const updateStoreChannel = (id: string, updates: Partial<StoreChannel>) => {
    setStoreChannels(prev => prev.map(sc => {
      if (sc.id !== id) return sc;
      return { ...sc, ...updates };
    }));
  };

  const setActiveChannel = (id: string) => {
    setStoreChannels(prev => prev.map(sc => ({ ...sc, enabled: sc.id === id })));
  };

  const removeStoreChannel = (id: string) => {
    setStoreChannels(prev => {
      const filtered = prev.filter(sc => sc.id !== id);
      // If removed was active and others exist, activate first
      if (filtered.length > 0 && !filtered.some(sc => sc.enabled)) {
        filtered[0].enabled = true;
      }
      return filtered;
    });
  };

  const handleSave = () => {
    const activeStore = storeChannels.find(sc => sc.enabled);
    updateYouTube({
      ...youtubeDraft,
      channelId: activeStore?.channelId?.trim() || '',
      storeChannels: storeChannels as any,
    });
    toast.success("Integrações salvas!");
  };

  return (
    <CEOLayout title="Integrações">
      <div className="space-y-8 max-w-4xl">

        {/* Store YouTube Channels */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                  <Store className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">Canais por Loja</h3>
                  <p className="text-sm text-muted-foreground">Configure o Channel ID do YouTube de cada loja. Apenas 1 canal fica ativo por vez.</p>
                </div>
              </div>
              <Button onClick={addStoreChannel} size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </div>

            {storeChannels.length === 0 ? (
              <div className="text-center py-8">
                <Youtube className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum canal configurado</p>
                <Button onClick={addStoreChannel} variant="outline" className="mt-3 gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Canal
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {storeChannels.map((sc) => (
                  <div
                    key={sc.id}
                    className={`rounded-xl border p-4 transition-all ${
                      sc.enabled
                        ? 'border-amber-500/40 bg-amber-500/5 ring-1 ring-amber-500/20'
                        : 'border-border bg-card/50 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sc.enabled ? 'bg-amber-500/20' : 'bg-muted/40'}`}>
                        <Youtube className={`w-4 h-4 ${sc.enabled ? 'text-amber-400' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Input
                          value={sc.storeName}
                          onChange={(e) => updateStoreChannel(sc.id, { storeName: e.target.value })}
                          placeholder="Nome da loja"
                          className="h-8 text-sm font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {sc.enabled ? (
                          <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-400 bg-amber-500/10 text-xs">
                            Ativo
                          </Badge>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setActiveChannel(sc.id)} className="text-xs h-7">
                            Ativar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeStoreChannel(sc.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Input
                        value={sc.channelId}
                        onChange={(e) => updateStoreChannel(sc.id, { channelId: e.target.value })}
                        placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
                        className="font-mono text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Channel ID do YouTube (começa com <code className="bg-muted px-1 rounded">UC</code>)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* YouTube Config */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <Youtube className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">Configurações YouTube</h3>
                  <p className="text-sm text-muted-foreground">Galeria, categorias e exibição de vídeos</p>
                </div>
              </div>
              <Switch
                checked={youtubeDraft.enabled}
                onCheckedChange={(checked) => setYoutubeDraft((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>

            {youtubeDraft.enabled && (
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Busca por título</Label>
                        <p className="text-xs text-muted-foreground">Campo de busca na Comunidade.</p>
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
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Continuar assistindo</Label>
                        <p className="text-xs text-muted-foreground">Histórico por usuário.</p>
                      </div>
                      <Switch
                        checked={youtubeDraft.continueWatchingEnabled}
                        onCheckedChange={(checked) => setYoutubeDraft((prev) => ({ ...prev, continueWatchingEnabled: checked }))}
                      />
                    </div>
                    <Input
                      inputMode="numeric"
                      value={String(youtubeDraft.continueWatchingLimit ?? 12)}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n >= 1)
                          setYoutubeDraft((prev) => ({ ...prev, continueWatchingLimit: Math.floor(n) }));
                      }}
                      placeholder="12"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Categoria "Em alta"</Label>
                        <p className="text-xs text-muted-foreground">Ordena por visualizações.</p>
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
                          if (Number.isFinite(n) && n >= 1)
                            setYoutubeDraft((prev) => ({ ...prev, trendingDays: Math.floor(n) }));
                        }}
                        placeholder="7"
                      />
                      <Input
                        inputMode="numeric"
                        value={String(youtubeDraft.trendingLimit ?? 8)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n >= 1)
                            setYoutubeDraft((prev) => ({ ...prev, trendingLimit: Math.floor(n) }));
                        }}
                        placeholder="8"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Dias (esq) e limite (dir).</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Badge "Novo" (dias)</Label>
                    <Input
                      inputMode="numeric"
                      value={String(youtubeDraft.newBadgeDays ?? 7)}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n >= 1)
                          setYoutubeDraft((prev) => ({ ...prev, newBadgeDays: Math.floor(n) }));
                      }}
                      placeholder="7"
                    />
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
                      handleSave();
                      toast.success("Categorias salvas!");
                    }}
                  />
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Save */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex justify-end">
          <Button onClick={handleSave} className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 hover:from-amber-400 hover:to-amber-500">
            <Save className="w-4 h-4" />
            Salvar Integrações
          </Button>
        </motion.div>
      </div>
    </CEOLayout>
  );
};

export default CEOIntegracoes;
