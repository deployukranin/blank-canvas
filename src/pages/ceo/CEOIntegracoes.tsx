import { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Link2,
  Database,
  CreditCard,
  HeadphonesIcon,
  Package,
  Save,
  TestTube,
  CheckCircle2,
  XCircle,
  Loader2,
  Percent,
  Eye,
  EyeOff,
  Youtube,
  Shield,
  Download,
  Upload,
  Users,
  RefreshCw,
  Plus,
  Trash2,
  Info,
  Wallet,
} from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';
import { useYouTubeVideos } from '@/hooks/use-youtube-videos';
import { YouTubeCategoryManager } from '@/components/video/YouTubeCategoryManager';
import { exportConfig, importConfig } from '@/lib/config-export';
import { supabase } from '@/integrations/supabase/client';

interface TokenInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSecret?: boolean;
}

const TokenInput = ({ label, value, onChange, placeholder, isSecret = true }: TokenInputProps) => {
  const [showValue, setShowValue] = useState(false);

  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="relative mt-2">
        <Input
          type={isSecret && !showValue ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setShowValue(!showValue)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

interface Influencer {
  id: string;
  name: string;
  pix_key: string;
  pix_key_type: string;
  split_percentage: number;
  is_active: boolean;
  woovi_subaccount_id: string | null;
}

const SubaccountManager = () => {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchInfluencers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('influencers')
      .select('id, name, pix_key, pix_key_type, split_percentage, is_active, woovi_subaccount_id')
      .order('name');

    if (!error && data) {
      setInfluencers(data as Influencer[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const handleSyncSubaccounts = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subaccount', {
        body: { action: 'sync' },
        headers: { 'X-Dev-Mode': 'true' },
      });

      if (error) {
        toast.error('Erro ao sincronizar subcontas');
        console.error(error);
      } else {
        toast.success(`Sincronizado! ${data.synced} criadas, ${data.failed} falhas`);
        await fetchInfluencers();
      }
    } catch (err) {
      toast.error('Erro ao sincronizar subcontas');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateSubaccount = async (influencer: Influencer) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-subaccount', {
        body: {
          action: 'create',
          pixKey: influencer.pix_key,
          name: influencer.name,
          influencerId: influencer.id,
        },
        headers: { 'X-Dev-Mode': 'true' },
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Erro ao criar subconta');
      } else {
        toast.success('Subconta criada com sucesso!');
        await fetchInfluencers();
      }
    } catch (err) {
      toast.error('Erro ao criar subconta');
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <GlassCard>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Subcontas PIX (Influencers)</h3>
              <p className="text-sm text-muted-foreground">Gerencie as subcontas para split automático</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncSubaccounts}
            disabled={isSyncing}
            className="gap-2"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sincronizar com Woovi
          </Button>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-sm text-muted-foreground">
              As subcontas permitem que os pagamentos sejam divididos automaticamente antes de cair nas contas.
              Cada influencer precisa ter uma subconta na Woovi para receber sua parte do split.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : influencers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum influencer cadastrado</p>
              <p className="text-sm">Cadastre influencers no painel admin para gerenciar subcontas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Nome</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Chave PIX</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Split</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {influencers.map((influencer) => (
                    <tr key={influencer.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-3 px-2">
                        <div className="font-medium">{influencer.name}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-sm font-mono text-muted-foreground">
                          {influencer.pix_key_type}: {influencer.pix_key.slice(0, 15)}...
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm font-bold text-accent">{influencer.split_percentage}%</span>
                      </td>
                      <td className="py-3 px-2">
                        {influencer.woovi_subaccount_id ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Sincronizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                            <XCircle className="w-3 h-3" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {!influencer.woovi_subaccount_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateSubaccount(influencer)}
                            className="gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Criar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

const CEOIntegracoes = () => {
  const { config, updateToken, testConnection, updateYouTube, setConfig } = useWhiteLabel();
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectionResults, setConnectionResults] = useState<Record<string, { success: boolean; message: string }>>({}); 
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleTest = async (tokenKey: "supabase" | "openpix" | "support" | "accountStock" | "moderation") => {
    setTestingConnection(tokenKey);
    const result = await testConnection(tokenKey);
    setConnectionResults((prev) => ({ ...prev, [tokenKey]: result }));
    setTestingConnection(null);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleSave = () => {
    updateYouTube(youtubeDraft);
    toast.success("Configurações de integrações salvas!");
  };

  const handleExport = () => {
    exportConfig(config);
    toast.success("Configurações exportadas com sucesso!");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedConfig = await importConfig(file);
      setConfig(importedConfig);
      toast.success("Configurações importadas com sucesso! Recarregando...");
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Reload to apply all changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao importar configurações");
    }
  };

  return (
    <CEOLayout title="Integrações Externas">
      <div className="space-y-8 max-w-4xl">
        {/* Export/Import Actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3"
        >
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Configurações
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar Configurações
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </motion.div>
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
                    <p className="text-xs text-muted-foreground">Exibe “Ver mais” quando houver mais vídeos.</p>
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
                        <Label className="text-sm">Categoria “Em alta”</Label>
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
                    <Label className="text-sm">Badge “Novo” (dias)</Label>
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
                    <p className="text-xs text-muted-foreground">Mostra “Novo” em vídeos publicados recentemente.</p>
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

        {/* Supabase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Database className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">Supabase</h3>
                  <p className="text-sm text-muted-foreground">Banco de dados e autenticação</p>
                </div>
              </div>
              <Switch
                checked={config.tokens.supabase.enabled}
                onCheckedChange={(checked) => updateToken('supabase', { enabled: checked })}
              />
            </div>

            {config.tokens.supabase.enabled && (
              <div className="space-y-4 pt-4 border-t border-border">
                <TokenInput
                  label="URL do Projeto"
                  value={config.tokens.supabase.url}
                  onChange={(value) => updateToken('supabase', { url: value })}
                  placeholder="https://xxx.supabase.co"
                  isSecret={false}
                />
                <TokenInput
                  label="Anon Key"
                  value={config.tokens.supabase.anonKey}
                  onChange={(value) => updateToken('supabase', { anonKey: value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                />
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest('supabase')}
                    disabled={testingConnection === 'supabase'}
                    className="gap-2"
                  >
                    {testingConnection === 'supabase' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Testar Conexão
                  </Button>
                  {connectionResults.supabase && (
                    <span
                      className={`flex items-center gap-1 text-sm ${
                        connectionResults.supabase.success
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {connectionResults.supabase.success ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {connectionResults.supabase.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* OpenPix/Woovi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">OpenPix / Woovi</h3>
                  <p className="text-sm text-muted-foreground">Gateway de pagamentos PIX</p>
                </div>
              </div>
              <Switch
                checked={config.tokens.openpix.enabled}
                onCheckedChange={(checked) => updateToken('openpix', { enabled: checked })}
              />
            </div>

            {config.tokens.openpix.enabled && (
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TokenInput
                    label="App ID (API Key)"
                    value={config.tokens.openpix.appId}
                    onChange={(value) => updateToken('openpix', { appId: value })}
                    placeholder="Seu App ID da OpenPix"
                  />
                  <TokenInput
                    label="Webhook Secret"
                    value={config.tokens.openpix.webhookSecret}
                    onChange={(value) => updateToken('openpix', { webhookSecret: value })}
                    placeholder="Secret para validar webhooks"
                  />
                </div>

                {/* Environment Selection */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Percent className="w-5 h-5 text-blue-400" />
                    <span className="font-medium">Ambiente</span>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="openpix-environment"
                        checked={config.tokens.openpix.environment === 'sandbox'}
                        onChange={() => updateToken('openpix', { environment: 'sandbox' })}
                        className="accent-blue-500"
                      />
                      <span className="text-sm">Sandbox (Testes)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="openpix-environment"
                        checked={config.tokens.openpix.environment === 'production'}
                        onChange={() => updateToken('openpix', { environment: 'production' })}
                        className="accent-blue-500"
                      />
                      <span className="text-sm">Production (Real)</span>
                    </label>
                  </div>
                </div>

                {/* Platform PIX Configuration */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="w-5 h-5 text-primary" />
                    <span className="font-medium">Conta Principal da Plataforma</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Configure sua chave PIX principal. Esta conta receberá a porcentagem da plataforma e terá as taxas da OpenPix descontadas.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Tipo da Chave PIX</Label>
                      <Select
                        value={config.tokens.openpix.platformPixKeyType || 'RANDOM'}
                        onValueChange={(value) => updateToken('openpix', { platformPixKeyType: value as 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM' })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CPF">CPF</SelectItem>
                          <SelectItem value="CNPJ">CNPJ</SelectItem>
                          <SelectItem value="EMAIL">E-mail</SelectItem>
                          <SelectItem value="PHONE">Telefone</SelectItem>
                          <SelectItem value="RANDOM">Chave Aleatória</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Chave PIX</Label>
                      <Input
                        value={config.tokens.openpix.platformPixKey || ''}
                        onChange={(e) => updateToken('openpix', { platformPixKey: e.target.value })}
                        placeholder="Sua chave PIX"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Nome do Titular</Label>
                    <Input
                      value={config.tokens.openpix.platformName || ''}
                      onChange={(e) => updateToken('openpix', { platformName: e.target.value })}
                      placeholder="Nome completo ou razão social"
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Split Configuration */}
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Percent className="w-5 h-5 text-accent" />
                    <span className="font-medium">Configuração de Split</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm">Porcentagem da Plataforma</Label>
                        <span className="text-sm font-mono font-bold text-primary">
                          {config.tokens.openpix.defaultSplitPercentage || 20}%
                        </span>
                      </div>
                      <Slider
                        value={[config.tokens.openpix.defaultSplitPercentage || 20]}
                        onValueChange={(value) => updateToken('openpix', { defaultSplitPercentage: value[0] })}
                        min={5}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>5%</span>
                        <span>50%</span>
                      </div>
                    </div>

                    {/* Split Preview */}
                    <div className="p-3 rounded-lg bg-background/50 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium">Exemplo de Split (R$ 100,00)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded bg-primary/10">
                          <p className="text-xs text-muted-foreground">Plataforma</p>
                          <p className="font-bold text-primary">
                            R$ {((100 * (config.tokens.openpix.defaultSplitPercentage || 20)) / 100).toFixed(2)}
                          </p>
                        </div>
                        <div className="p-2 rounded bg-accent/10">
                          <p className="text-xs text-muted-foreground">Influencer</p>
                          <p className="font-bold text-accent">
                            R$ {((100 * (100 - (config.tokens.openpix.defaultSplitPercentage || 20))) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        * Taxa OpenPix (~1.29%) descontada da conta da plataforma
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div>
                        <Label className="text-sm">Taxa OpenPix descontada da plataforma</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Quando ativo, a taxa é descontada da sua conta principal
                        </p>
                      </div>
                      <Switch
                        checked={config.tokens.openpix.platformPaysOpenPixFee ?? true}
                        onCheckedChange={(checked) => updateToken('openpix', { platformPaysOpenPixFee: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTest('openpix')}
                    disabled={testingConnection === 'openpix'}
                    className="gap-2"
                  >
                    {testingConnection === 'openpix' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Testar Conexão
                  </Button>
                  {connectionResults.openpix && (
                    <span className={`flex items-center gap-1 text-sm ${connectionResults.openpix.success ? 'text-green-400' : 'text-red-400'}`}>
                      {connectionResults.openpix.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {connectionResults.openpix.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Subcontas / Influencers PIX */}
        {config.tokens.openpix.enabled && (
          <SubaccountManager />
        )}

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <HeadphonesIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">Suporte Externo</h3>
                  <p className="text-sm text-muted-foreground">Sistema de tickets e atendimento</p>
                </div>
              </div>
              <Switch
                checked={config.tokens.support.enabled}
                onCheckedChange={(checked) => updateToken('support', { enabled: checked })}
              />
            </div>

            {config.tokens.support.enabled && (
              <div className="space-y-4 pt-4 border-t border-border">
                <TokenInput
                  label="Token de Acesso"
                  value={config.tokens.support.token}
                  onChange={(value) => updateToken('support', { token: value })}
                  placeholder="Seu token de API"
                />
                <TokenInput
                  label="Webhook URL"
                  value={config.tokens.support.webhookUrl}
                  onChange={(value) => updateToken('support', { webhookUrl: value })}
                  placeholder="https://..."
                  isSecret={false}
                />
                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTest('support')}
                    disabled={testingConnection === 'support'}
                    className="gap-2"
                  >
                    {testingConnection === 'support' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Testar Conexão
                  </Button>
                  {connectionResults.support && (
                    <span className={`flex items-center gap-1 text-sm ${connectionResults.support.success ? 'text-green-400' : 'text-red-400'}`}>
                      {connectionResults.support.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {connectionResults.support.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Account Stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">Estoque de Contas</h3>
                  <p className="text-sm text-muted-foreground">Gerenciamento de contas da loja</p>
                </div>
              </div>
              <Switch
                checked={config.tokens.accountStock.enabled}
                onCheckedChange={(checked) => updateToken('accountStock', { enabled: checked })}
              />
            </div>

            {config.tokens.accountStock.enabled && (
              <div className="space-y-4 pt-4 border-t border-border">
                <TokenInput
                  label="URL da API"
                  value={config.tokens.accountStock.apiUrl}
                  onChange={(value) => updateToken('accountStock', { apiUrl: value })}
                  placeholder="https://api.seuservidor.com/v1"
                  isSecret={false}
                />
                <TokenInput
                  label="API Key"
                  value={config.tokens.accountStock.apiKey}
                  onChange={(value) => updateToken('accountStock', { apiKey: value })}
                  placeholder="Sua API Key"
                />
                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTest('accountStock')}
                    disabled={testingConnection === 'accountStock'}
                    className="gap-2"
                  >
                    {testingConnection === 'accountStock' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Testar Conexão
                  </Button>
                  {connectionResults.accountStock && (
                    <span className={`flex items-center gap-1 text-sm ${connectionResults.accountStock.success ? 'text-green-400' : 'text-red-400'}`}>
                      {connectionResults.accountStock.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {connectionResults.accountStock.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Moderation Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <GlassCard>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">Painel de Moderação</h3>
                  <p className="text-sm text-muted-foreground">Enviar denúncias e suporte para projeto externo</p>
                </div>
              </div>
              <Switch
                checked={config.tokens.moderation.enabled}
                onCheckedChange={(checked) => updateToken('moderation', { enabled: checked })}
              />
            </div>

            {config.tokens.moderation.enabled && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Configure a URL e API Key do projeto de moderação para enviar denúncias e tickets de suporte automaticamente.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No projeto de moderação, crie um registro em <code className="font-mono bg-background/50 px-1 rounded">connected_projects</code> com a API Key gerada.
                  </p>
                </div>
                
                <TokenInput
                  label="URL da API de Moderação"
                  value={config.tokens.moderation.apiUrl}
                  onChange={(value) => updateToken('moderation', { apiUrl: value })}
                  placeholder="https://seu-projeto-moderacao.supabase.co"
                  isSecret={false}
                />
                <TokenInput
                  label="API Key"
                  value={config.tokens.moderation.apiKey}
                  onChange={(value) => updateToken('moderation', { apiKey: value })}
                  placeholder="Chave gerada no projeto de moderação"
                />
                <div className="flex items-center gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTest('moderation')}
                    disabled={testingConnection === 'moderation'}
                    className="gap-2"
                  >
                    {testingConnection === 'moderation' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Testar Conexão
                  </Button>
                  {connectionResults.moderation && (
                    <span className={`flex items-center gap-1 text-sm ${connectionResults.moderation.success ? 'text-green-400' : 'text-red-400'}`}>
                      {connectionResults.moderation.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {connectionResults.moderation.message}
                    </span>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

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
