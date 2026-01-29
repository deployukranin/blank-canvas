import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Send,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  CreditCard,
  Video,
  MessageSquare,
  UserCheck,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Percent,
  Heart,
  Repeat,
  Activity,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MetricsPreview {
  users: { total: number; newInPeriod: number; activeInPeriod: number };
  payments: { total: number; revenueTotal: number; totalInPeriod: number };
  videos: { totalViews: number; totalReactions: number; completionRate: number };
  community: { totalChatMessages: number; messagesInPeriod: number };
  influencers: { total: number; active: number; syncedWithWoovi: number };
  business?: {
    conversionRate: number;
    ltv: number;
    arpu: number;
    payingCustomers: number;
    averageTicket: number;
    repeatPurchaseRate: number;
    engagementRate: number;
    videoEngagementRate: number;
    revenueGrowthRate: number;
    userGrowthRate: number;
    influencerContributionRate: number;
  };
}

export const MetricsExportManager = () => {
  const { config, updateToken } = useWhiteLabel();
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [metricsPreview, setMetricsPreview] = useState<MetricsPreview | null>(null);
  const [lastSendResult, setLastSendResult] = useState<{ success: boolean; message: string; time: string } | null>(null);

  const metricsExport = config.tokens.metricsExport || {
    enabled: false,
    apiUrl: '',
    apiKey: '',
    period: '30days',
    autoSendEnabled: false,
    autoSendInterval: 60,
    lastSentAt: undefined,
  };

  const updateMetricsExport = (updates: Partial<typeof metricsExport>) => {
    updateToken('metricsExport', updates);
  };

  const loadPreview = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-metrics', {
        body: {
          period: metricsExport.period || '30days',
          previewOnly: true,
        },
        headers: { 'X-Dev-Mode': 'true' },
      });

      if (error) throw error;

      if (data?.success && data?.data?.metrics) {
        setMetricsPreview(data.data.metrics);
        toast.success('Preview das métricas carregado!');
      }
    } catch (err) {
      console.error('Error loading metrics preview:', err);
      toast.error('Erro ao carregar preview das métricas');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMetrics = async () => {
    if (!metricsExport.apiUrl || !metricsExport.apiKey) {
      toast.error('Configure a URL e API Key antes de enviar');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-metrics', {
        body: {
          period: metricsExport.period || '30days',
          apiUrl: metricsExport.apiUrl,
          apiKey: metricsExport.apiKey,
          previewOnly: false,
        },
        headers: { 'X-Dev-Mode': 'true' },
      });

      if (error) throw error;

      if (data?.success) {
        const now = new Date().toISOString();
        updateMetricsExport({ lastSentAt: now });
        setLastSendResult({
          success: true,
          message: 'Métricas enviadas com sucesso!',
          time: now,
        });
        toast.success('Métricas enviadas com sucesso!');
      } else {
        setLastSendResult({
          success: false,
          message: data?.error || 'Erro desconhecido',
          time: new Date().toISOString(),
        });
        toast.error(data?.error || 'Erro ao enviar métricas');
      }
    } catch (err: any) {
      console.error('Error sending metrics:', err);
      setLastSendResult({
        success: false,
        message: err.message || 'Erro ao enviar',
        time: new Date().toISOString(),
      });
      toast.error('Erro ao enviar métricas');
    } finally {
      setIsSending(false);
    }
  };

  // Auto-refresh preview when period changes
  useEffect(() => {
    if (metricsExport.enabled) {
      loadPreview();
    }
  }, [metricsExport.period, metricsExport.enabled]);

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <GlassCard>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Exportação de Métricas</h3>
              <p className="text-sm text-muted-foreground">Envie métricas da plataforma para painel externo</p>
            </div>
          </div>
          <Switch
            checked={metricsExport.enabled}
            onCheckedChange={(checked) => updateMetricsExport({ enabled: checked })}
          />
        </div>

        {metricsExport.enabled && (
          <div className="space-y-6 pt-4 border-t border-border">
            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">URL do Painel Externo</Label>
                <Input
                  value={metricsExport.apiUrl}
                  onChange={(e) => updateMetricsExport({ apiUrl: e.target.value })}
                  placeholder="https://meu-painel.com/api/v1/metrics"
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm">API Key</Label>
                <div className="relative mt-2">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={metricsExport.apiKey}
                    onChange={(e) => updateMetricsExport({ apiKey: e.target.value })}
                    placeholder="Sua API Key"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Period and Auto-send */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Período</Label>
                <Select
                  value={metricsExport.period || '30days'}
                  onValueChange={(value) => updateMetricsExport({ period: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="30days">Últimos 30 dias</SelectItem>
                    <SelectItem value="90days">Últimos 90 dias</SelectItem>
                    <SelectItem value="all">Todo o período</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Envio Automático</Label>
                    <p className="text-xs text-muted-foreground">Envia métricas periodicamente</p>
                  </div>
                  <Switch
                    checked={metricsExport.autoSendEnabled}
                    onCheckedChange={(checked) => updateMetricsExport({ autoSendEnabled: checked })}
                  />
                </div>
                {metricsExport.autoSendEnabled && (
                  <Select
                    value={String(metricsExport.autoSendInterval || 60)}
                    onValueChange={(value) => updateMetricsExport({ autoSendInterval: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">A cada 15 minutos</SelectItem>
                      <SelectItem value="30">A cada 30 minutos</SelectItem>
                      <SelectItem value="60">A cada 1 hora</SelectItem>
                      <SelectItem value="360">A cada 6 horas</SelectItem>
                      <SelectItem value="1440">A cada 24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={loadPreview}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Visualizar Métricas
              </Button>
              <Button
                onClick={sendMetrics}
                disabled={isSending || !metricsExport.apiUrl || !metricsExport.apiKey}
                className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar Agora
              </Button>
            </div>

            {/* Last Send Status */}
            {(lastSendResult || metricsExport.lastSentAt) && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                lastSendResult?.success !== false ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
              }`}>
                {lastSendResult?.success !== false ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm">
                  {lastSendResult?.success !== false ? 'Último envio: ' : 'Falha no envio: '}
                  {lastSendResult?.message || ''}
                  {metricsExport.lastSentAt && !lastSendResult && (
                    <span className="text-muted-foreground ml-1">
                      ({formatDate(metricsExport.lastSentAt)})
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Metrics Preview */}
            {metricsPreview && (
              <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Preview das Métricas ({metricsExport.period === 'today' ? 'Hoje' : 
                    metricsExport.period === '7days' ? 'Últimos 7 dias' :
                    metricsExport.period === '30days' ? 'Últimos 30 dias' :
                    metricsExport.period === '90days' ? 'Últimos 90 dias' : 'Todo o período'})
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* Users */}
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 text-purple-400 text-xs mb-1">
                      <Users className="w-3 h-3" />
                      Usuários
                    </div>
                    <div className="text-lg font-bold">{metricsPreview.users.total.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      +{metricsPreview.users.newInPeriod} novos
                    </div>
                  </div>

                  {/* Payments */}
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
                      <CreditCard className="w-3 h-3" />
                      Receita
                    </div>
                    <div className="text-lg font-bold">{formatCurrency(metricsPreview.payments.revenueTotal)}</div>
                    <div className="text-xs text-muted-foreground">
                      {metricsPreview.payments.totalInPeriod} transações
                    </div>
                  </div>

                  {/* Videos */}
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 text-blue-400 text-xs mb-1">
                      <Video className="w-3 h-3" />
                      Vídeos
                    </div>
                    <div className="text-lg font-bold">{metricsPreview.videos.totalViews.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {metricsPreview.videos.totalReactions} reações
                    </div>
                  </div>

                  {/* Chat */}
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-center gap-2 text-orange-400 text-xs mb-1">
                      <MessageSquare className="w-3 h-3" />
                      Chat
                    </div>
                    <div className="text-lg font-bold">{metricsPreview.community.totalChatMessages.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      +{metricsPreview.community.messagesInPeriod} no período
                    </div>
                  </div>

                  {/* Influencers */}
                  <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                    <div className="flex items-center gap-2 text-pink-400 text-xs mb-1">
                      <UserCheck className="w-3 h-3" />
                      Influencers
                    </div>
                    <div className="text-lg font-bold">{metricsPreview.influencers.active}</div>
                    <div className="text-xs text-muted-foreground">
                      {metricsPreview.influencers.syncedWithWoovi} sincronizados
                    </div>
                  </div>
                </div>

                {/* Business Metrics Section */}
                {metricsPreview.business && (
                  <>
                    <div className="flex items-center gap-2 text-sm font-medium mt-4 pt-4 border-t border-border">
                      <TrendingUp className="w-4 h-4" />
                      Métricas de Negócio
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {/* Conversion Rate */}
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1">
                          <Target className="w-3 h-3" />
                          Taxa de Conversão
                        </div>
                        <div className="text-lg font-bold">{metricsPreview.business.conversionRate}%</div>
                        <div className="text-xs text-muted-foreground">
                          usuários → clientes
                        </div>
                      </div>

                      {/* LTV */}
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
                          <DollarSign className="w-3 h-3" />
                          LTV
                        </div>
                        <div className="text-lg font-bold">{formatCurrency(metricsPreview.business.ltv)}</div>
                        <div className="text-xs text-muted-foreground">
                          valor por cliente
                        </div>
                      </div>

                      {/* ARPU */}
                      <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <div className="flex items-center gap-2 text-violet-400 text-xs mb-1">
                          <Users className="w-3 h-3" />
                          ARPU
                        </div>
                        <div className="text-lg font-bold">{formatCurrency(metricsPreview.business.arpu)}</div>
                        <div className="text-xs text-muted-foreground">
                          receita por usuário
                        </div>
                      </div>

                      {/* Average Ticket */}
                      <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1">
                          <CreditCard className="w-3 h-3" />
                          Ticket Médio
                        </div>
                        <div className="text-lg font-bold">{formatCurrency(metricsPreview.business.averageTicket)}</div>
                        <div className="text-xs text-muted-foreground">
                          {metricsPreview.business.payingCustomers} clientes
                        </div>
                      </div>

                      {/* Repeat Purchase Rate */}
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <div className="flex items-center gap-2 text-rose-400 text-xs mb-1">
                          <Repeat className="w-3 h-3" />
                          Recorrência
                        </div>
                        <div className="text-lg font-bold">{metricsPreview.business.repeatPurchaseRate}%</div>
                        <div className="text-xs text-muted-foreground">
                          compras repetidas
                        </div>
                      </div>

                      {/* Engagement Rate */}
                      <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <div className="flex items-center gap-2 text-indigo-400 text-xs mb-1">
                          <Heart className="w-3 h-3" />
                          Engajamento
                        </div>
                        <div className="text-lg font-bold">{metricsPreview.business.engagementRate}%</div>
                        <div className="text-xs text-muted-foreground">
                          usuários ativos
                        </div>
                      </div>

                      {/* Video Engagement Rate */}
                      <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
                        <div className="flex items-center gap-2 text-sky-400 text-xs mb-1">
                          <Activity className="w-3 h-3" />
                          Engajamento Vídeos
                        </div>
                        <div className="text-lg font-bold">{metricsPreview.business.videoEngagementRate}%</div>
                        <div className="text-xs text-muted-foreground">
                          reações por view
                        </div>
                      </div>

                      {/* Revenue Growth */}
                      <div className={`p-3 rounded-lg ${metricsPreview.business.revenueGrowthRate >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border`}>
                        <div className={`flex items-center gap-2 ${metricsPreview.business.revenueGrowthRate >= 0 ? 'text-green-400' : 'text-red-400'} text-xs mb-1`}>
                          {metricsPreview.business.revenueGrowthRate >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          Crescimento Receita
                        </div>
                        <div className="text-lg font-bold">
                          {metricsPreview.business.revenueGrowthRate >= 0 ? '+' : ''}{metricsPreview.business.revenueGrowthRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          vs período anterior
                        </div>
                      </div>

                      {/* User Growth */}
                      <div className={`p-3 rounded-lg ${metricsPreview.business.userGrowthRate >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border`}>
                        <div className={`flex items-center gap-2 ${metricsPreview.business.userGrowthRate >= 0 ? 'text-green-400' : 'text-red-400'} text-xs mb-1`}>
                          {metricsPreview.business.userGrowthRate >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          Crescimento Usuários
                        </div>
                        <div className="text-lg font-bold">
                          {metricsPreview.business.userGrowthRate >= 0 ? '+' : ''}{metricsPreview.business.userGrowthRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          vs período anterior
                        </div>
                      </div>

                      {/* Influencer Contribution */}
                      <div className="p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
                        <div className="flex items-center gap-2 text-fuchsia-400 text-xs mb-1">
                          <Percent className="w-3 h-3" />
                          Split Influencers
                        </div>
                        <div className="text-lg font-bold">{metricsPreview.business.influencerContributionRate}%</div>
                        <div className="text-xs text-muted-foreground">
                          da receita
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-sm text-muted-foreground">
                O painel externo deve implementar um endpoint <code className="font-mono bg-background/50 px-1 rounded">POST</code> que aceita o header <code className="font-mono bg-background/50 px-1 rounded">X-API-Key</code> e recebe um JSON com as métricas.
              </p>
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};
