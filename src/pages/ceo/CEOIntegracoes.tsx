import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Youtube, ShoppingBag, Tag, ExternalLink, Plus, Trash2, Package } from 'lucide-react';
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

interface ExampleProduct {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  emoji: string;
}

// Emojis populares para produtos
const productEmojis = [
  '🎬', '🎵', '✨', '▶️', '🎭', '📦', '🎮', '📱', '💻', '🎧',
  '📺', '🎪', '🎯', '🎨', '📚', '🎁', '💎', '👑', '⭐', '🌟',
];

const defaultProducts: ExampleProduct[] = [
  { id: '1', name: 'Netflix Premium', originalPrice: 55.90, salePrice: 11.18, emoji: '🎬' },
  { id: '2', name: 'Spotify Premium', originalPrice: 34.90, salePrice: 6.98, emoji: '🎵' },
  { id: '3', name: 'Disney+', originalPrice: 43.90, salePrice: 8.78, emoji: '✨' },
  { id: '4', name: 'YouTube Premium', originalPrice: 45.90, salePrice: 9.18, emoji: '▶️' },
  { id: '5', name: 'HBO Max', originalPrice: 49.90, salePrice: 9.98, emoji: '🎭' },
  { id: '6', name: 'Amazon Prime', originalPrice: 19.90, salePrice: 3.98, emoji: '📦' },
];

const CEOIntegracoes = () => {
  const { config, updateYouTube, updateShopify } = useWhiteLabel();

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

  const [shopifyDraft, setShopifyDraft] = useState({
    enabled: config.shopify?.enabled ?? false,
    storeUrl: config.shopify?.storeUrl ?? '',
    couponCode: config.shopify?.couponCode ?? '',
    couponLabel: config.shopify?.couponLabel ?? 'Use o cupom',
    exampleProducts: config.shopify?.exampleProducts ?? defaultProducts,
  });

  const channelId = youtubeDraft.channelId.trim();

  const { data: ytData } = useYouTubeVideos({
    channelId,
    enabled: Boolean(channelId) && Boolean(youtubeDraft.enabled),
  });

  const videos = useMemo(() => ytData?.videos ?? [], [ytData]);

  const handleSave = () => {
    updateYouTube(youtubeDraft);
    updateShopify(shopifyDraft);
    toast.success("Configurações de integrações salvas!");
  };

  const handleSaveShopify = () => {
    updateShopify(shopifyDraft);
    toast.success("Configurações da Loja Parceira salvas!");
  };

  return (
    <CEOLayout title="Integrações Externas">
      <div className="space-y-8 max-w-4xl">

        {/* Loja Parceira */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">Loja Parceira</h3>
                  <p className="text-sm text-muted-foreground">Configure a loja externa e cupom de desconto</p>
                </div>
              </div>
              <Switch
                checked={shopifyDraft.enabled}
                onCheckedChange={(checked) => setShopifyDraft((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>

            {shopifyDraft.enabled && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <Label className="text-sm flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    URL da Loja
                  </Label>
                  <Input
                    value={shopifyDraft.storeUrl}
                    onChange={(e) => setShopifyDraft((prev) => ({ ...prev, storeUrl: e.target.value }))}
                    placeholder="https://minhaloja.com.br"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    URL completa da loja parceira (será aberta em nova aba).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Código do Cupom
                    </Label>
                    <Input
                      value={shopifyDraft.couponCode}
                      onChange={(e) => setShopifyDraft((prev) => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                      placeholder="MEUCUPOM30"
                      className="mt-2 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Texto do Cupom</Label>
                    <Input
                      value={shopifyDraft.couponLabel}
                      onChange={(e) => setShopifyDraft((prev) => ({ ...prev, couponLabel: e.target.value }))}
                      placeholder="Use o cupom"
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Example Products Section */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <Label className="text-sm font-medium">Produtos Exemplo</Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newProduct: ExampleProduct = {
                          id: Date.now().toString(),
                          name: 'Novo Produto',
                          originalPrice: 29.90,
                          salePrice: 5.98,
                          emoji: '📦',
                        };
                        setShopifyDraft((prev) => ({
                          ...prev,
                          exampleProducts: [...prev.exampleProducts, newProduct],
                        }));
                      }}
                      className="gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Produtos exibidos na página /loja. Configure preço original e preço de venda.
                  </p>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {shopifyDraft.exampleProducts.map((product, index) => (
                      <div key={product.id} className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-3">
                        {/* Row 1: Emoji picker and name */}
                        <div className="flex items-center gap-2">
                          {/* Emoji selector */}
                          <div className="flex flex-col gap-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 text-2xl">
                              {product.emoji}
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-1">
                            <Input
                              value={product.name}
                              onChange={(e) => {
                                const updated = [...shopifyDraft.exampleProducts];
                                updated[index] = { ...updated[index], name: e.target.value };
                                setShopifyDraft((prev) => ({ ...prev, exampleProducts: updated }));
                              }}
                              placeholder="Nome do produto"
                              className="font-medium"
                            />
                          </div>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updated = shopifyDraft.exampleProducts.filter((_, i) => i !== index);
                              setShopifyDraft((prev) => ({ ...prev, exampleProducts: updated }));
                            }}
                            className="text-destructive hover:text-destructive shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Row 2: Emoji picker */}
                        <div className="flex flex-wrap gap-1">
                          {productEmojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                const updated = [...shopifyDraft.exampleProducts];
                                updated[index] = { ...updated[index], emoji };
                                setShopifyDraft((prev) => ({ ...prev, exampleProducts: updated }));
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                                product.emoji === emoji 
                                  ? 'bg-primary/30 ring-2 ring-primary' 
                                  : 'bg-muted/30 hover:bg-muted/50'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        {/* Row 3: Prices */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Preço Original</Label>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">R$</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={product.originalPrice}
                                onChange={(e) => {
                                  const updated = [...shopifyDraft.exampleProducts];
                                  updated[index] = { ...updated[index], originalPrice: parseFloat(e.target.value) || 0 };
                                  setShopifyDraft((prev) => ({ ...prev, exampleProducts: updated }));
                                }}
                                className="text-muted-foreground"
                                placeholder="55.90"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-primary font-medium">Preço de Venda</Label>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-primary">R$</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={product.salePrice}
                                onChange={(e) => {
                                  const updated = [...shopifyDraft.exampleProducts];
                                  updated[index] = { ...updated[index], salePrice: parseFloat(e.target.value) || 0 };
                                  setShopifyDraft((prev) => ({ ...prev, exampleProducts: updated }));
                                }}
                                className="border-primary/50 focus:ring-primary"
                                placeholder="11.18"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <Button
                    onClick={handleSaveShopify}
                    className="gap-2 bg-gradient-to-r from-primary to-accent"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Loja
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* YouTube */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
