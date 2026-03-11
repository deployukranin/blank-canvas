import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Youtube, Store, Plus, Trash2, Users } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';
import { useYouTubeVideos } from '@/hooks/use-youtube-videos';
import { YouTubeCategoryManager } from '@/components/video/YouTubeCategoryManager';

// Mock stores — same source as CEOLojas
const availableStores = [
  { id: '1', name: 'ASMR Luna Store' },
  { id: '2', name: 'Relaxing Vibes Shop' },
  { id: '3', name: 'Whisper Dreams' },
];

interface StoreChannel {
  id: string;
  creatorName: string;
  channelId: string;
}

const CEOIntegracoes = () => {
  const { config, updateYouTube } = useWhiteLabel();

  const [selectedStoreId, setSelectedStoreId] = useState<string>(availableStores[0]?.id ?? '');
  const selectedStore = availableStores.find((s) => s.id === selectedStoreId);

  // Per-store integrations from config
  const storeIntegrations = config.youtube?.storeIntegrations ?? {};

  const currentIntegration = storeIntegrations[selectedStoreId] ?? {
    channels: [],
    categories: config.youtube?.categories ?? [],
    videoCategoryMap: config.youtube?.videoCategoryMap ?? {},
  };

  const [channels, setChannels] = useState<StoreChannel[]>(currentIntegration.channels);
  const [categories, setCategories] = useState(currentIntegration.categories ?? []);
  const [videoCategoryMap, setVideoCategoryMap] = useState(currentIntegration.videoCategoryMap ?? {});

  // YouTube global settings
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
  });

  // When store selection changes, load that store's data
  const handleStoreChange = (storeId: string) => {
    // Save current store state first
    saveCurrentStoreState();
    setSelectedStoreId(storeId);
    const integration = storeIntegrations[storeId] ?? {
      channels: [],
      categories: config.youtube?.categories ?? [],
      videoCategoryMap: {},
    };
    setChannels(integration.channels);
    setCategories(integration.categories ?? []);
    setVideoCategoryMap(integration.videoCategoryMap ?? {});
  };

  // First active channel for video preview
  const activeChannelId = channels[0]?.channelId?.trim() || '';
  const { data: ytData } = useYouTubeVideos({
    channelId: activeChannelId,
    enabled: Boolean(activeChannelId) && Boolean(youtubeDraft.enabled),
  });
  const videos = useMemo(() => ytData?.videos ?? [], [ytData]);

  // Channel CRUD
  const addChannel = () => {
    setChannels((prev) => [
      ...prev,
      { id: crypto.randomUUID(), creatorName: '', channelId: '' },
    ]);
  };

  const updateChannel = (id: string, updates: Partial<StoreChannel>) => {
    setChannels((prev) => prev.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch)));
  };

  const removeChannel = (id: string) => {
    setChannels((prev) => prev.filter((ch) => ch.id !== id));
  };

  const saveCurrentStoreState = () => {
    const updatedIntegrations = {
      ...storeIntegrations,
      [selectedStoreId]: {
        channels,
        categories,
        videoCategoryMap,
      },
    };
    return updatedIntegrations;
  };

  const handleSave = () => {
    const updatedIntegrations = {
      ...storeIntegrations,
      [selectedStoreId]: {
        channels,
        categories,
        videoCategoryMap,
      },
    };

    // Set first channel as the global channelId for backward compat
    const firstChannel = channels[0]?.channelId?.trim() || '';

    updateYouTube({
      ...youtubeDraft,
      channelId: firstChannel,
      categories,
      videoCategoryMap,
      storeIntegrations: updatedIntegrations as any,
    });
    toast.success('Integrações salvas!');
  };

  return (
    <CEOLayout title="Integrações">
      <div className="space-y-8 max-w-4xl">

        {/* Store Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                <Store className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">Selecione a Loja</h3>
                <p className="text-sm text-muted-foreground">
                  Configure os canais do YouTube e categorias de cada loja separadamente.
                </p>
              </div>
            </div>

            <Select value={selectedStoreId} onValueChange={handleStoreChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma loja" />
              </SelectTrigger>
              <SelectContent>
                {availableStores.map((store) => {
                  const integration = storeIntegrations[store.id];
                  const channelCount = integration?.channels?.length ?? 0;
                  return (
                    <SelectItem key={store.id} value={store.id}>
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-amber-400" />
                        <span>{store.name}</span>
                        {channelCount > 0 && (
                          <Badge variant="outline" className="text-[10px] ml-1">
                            {channelCount} canal{channelCount !== 1 ? 'is' : ''}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </GlassCard>
        </motion.div>

        {/* Channels for selected store */}
        {selectedStore && (
          <motion.div
            key={selectedStoreId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <GlassCard>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                    <Youtube className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">
                      Canais — {selectedStore.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione os Channel IDs dos criadores de conteúdo desta loja.
                    </p>
                  </div>
                </div>
                <Button onClick={addChannel} size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>

              {channels.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Nenhum criador configurado para esta loja
                  </p>
                  <Button onClick={addChannel} variant="outline" className="mt-3 gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Criador
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {channels.map((ch, idx) => (
                    <motion.div
                      key={ch.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="rounded-xl border border-border bg-card/50 p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <Youtube className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Input
                            value={ch.creatorName}
                            onChange={(e) =>
                              updateChannel(ch.id, { creatorName: e.target.value })
                            }
                            placeholder="Nome do criador"
                            className="h-8 text-sm font-medium"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeChannel(ch.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div>
                        <Input
                          value={ch.channelId}
                          onChange={(e) =>
                            updateChannel(ch.id, { channelId: e.target.value })
                          }
                          placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
                          className="font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Channel ID do YouTube (começa com{' '}
                          <code className="bg-muted px-1 rounded">UC</code>)
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* YouTube Global Config */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <Youtube className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">
                    Configurações Gerais YouTube
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Galeria, exibição e funcionalidades de vídeo
                  </p>
                </div>
              </div>
              <Switch
                checked={youtubeDraft.enabled}
                onCheckedChange={(checked) =>
                  setYoutubeDraft((prev) => ({ ...prev, enabled: checked }))
                }
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
                        onCheckedChange={(checked) =>
                          setYoutubeDraft((prev) => ({ ...prev, searchEnabled: checked }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Limite por categoria</Label>
                    <Input
                      inputMode="numeric"
                      value={
                        youtubeDraft.categoryPreviewLimit === null
                          ? ''
                          : String(youtubeDraft.categoryPreviewLimit)
                      }
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) {
                          setYoutubeDraft((prev) => ({
                            ...prev,
                            categoryPreviewLimit: null,
                          }));
                          return;
                        }
                        const n = Number(raw);
                        if (Number.isFinite(n) && n >= 1) {
                          setYoutubeDraft((prev) => ({
                            ...prev,
                            categoryPreviewLimit: Math.floor(n),
                          }));
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
                        onCheckedChange={(checked) =>
                          setYoutubeDraft((prev) => ({
                            ...prev,
                            continueWatchingEnabled: checked,
                          }))
                        }
                      />
                    </div>
                    <Input
                      inputMode="numeric"
                      value={String(youtubeDraft.continueWatchingLimit ?? 12)}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n >= 1)
                          setYoutubeDraft((prev) => ({
                            ...prev,
                            continueWatchingLimit: Math.floor(n),
                          }));
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
                        onCheckedChange={(checked) =>
                          setYoutubeDraft((prev) => ({ ...prev, trendingEnabled: checked }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        inputMode="numeric"
                        value={String(youtubeDraft.trendingDays ?? 7)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n >= 1)
                            setYoutubeDraft((prev) => ({
                              ...prev,
                              trendingDays: Math.floor(n),
                            }));
                        }}
                        placeholder="7"
                      />
                      <Input
                        inputMode="numeric"
                        value={String(youtubeDraft.trendingLimit ?? 8)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n >= 1)
                            setYoutubeDraft((prev) => ({
                              ...prev,
                              trendingLimit: Math.floor(n),
                            }));
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
                          setYoutubeDraft((prev) => ({
                            ...prev,
                            newBadgeDays: Math.floor(n),
                          }));
                      }}
                      placeholder="7"
                    />
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Per-store Categories */}
        {Boolean(activeChannelId) && youtubeDraft.enabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <YouTubeCategoryManager
              videos={videos}
              draft={{ categories: categories as any, videoCategoryMap }}
              onChange={(next) => {
                setCategories(next.categories);
                setVideoCategoryMap(next.videoCategoryMap);
              }}
              onSave={() => {
                handleSave();
                toast.success('Categorias salvas!');
              }}
            />
          </motion.div>
        )}

        {/* Save */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end"
        >
          <Button
            onClick={handleSave}
            className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 hover:from-amber-400 hover:to-amber-500"
          >
            <Save className="w-4 h-4" />
            Salvar Integrações
          </Button>
        </motion.div>
      </div>
    </CEOLayout>
  );
};

export default CEOIntegracoes;
