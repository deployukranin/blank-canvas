import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  QrCode,
  Zap,
  Check,
  Clock,
  Save,
  Loader2,
  ExternalLink,
  Link2,
  Link2Off,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { usePersistentConfig } from '@/hooks/use-persistent-config';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface PaymentConfig {
  activeGateway: 'stripe' | 'pix_manual' | null;
  pixManual: {
    keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
    key: string;
    receiverName: string;
    city: string;
  };
}

const defaultPaymentConfig: PaymentConfig = {
  activeGateway: null,
  pixManual: { keyType: 'cpf', key: '', receiverName: '', city: '' },
};

interface StripeConnectStatus {
  connected: boolean;
  onboarding_started?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  stripe_account_id?: string;
  email?: string;
}

const AdminPagamentosPix = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { store } = useTenant();
  const storeId = store?.id ?? null;
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus>({ connected: false });
  const [stripeLoading, setStripeLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [pixKeyError, setPixKeyError] = useState<string | null>(null);

  const {
    config,
    setConfig,
    isLoading,
    isSaving,
    saveNow,
  } = usePersistentConfig<PaymentConfig>({
    configKey: 'payment_config',
    defaultValue: defaultPaymentConfig,
    localStorageKey: 'paymentConfig',
    debounceMs: 3000,
    storeId,
  });

  // Check Stripe Connect status
  useEffect(() => {
    if (!storeId) return;
    const checkStatus = async () => {
      setStripeLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('stripe-connect-status', {
          body: { store_id: storeId },
        });
        if (!error && data) {
          setStripeStatus(data);
          // If connected and charges enabled, auto-set gateway
          if (data.connected && data.charges_enabled && config.activeGateway !== 'stripe') {
            setConfig(prev => ({ ...prev, activeGateway: 'stripe' as const }));
          }
        }
      } catch (err) {
        console.error('Error checking Stripe status:', err);
      } finally {
        setStripeLoading(false);
      }
    };
    checkStatus();
  }, [storeId]);

  const handleConnectStripe = async () => {
    if (!storeId) {
      toast({ title: 'Loja não encontrada', variant: 'destructive' });
      return;
    }
    setConnectingStripe(true);
    try {
      const returnUrl = window.location.href;
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding', {
        body: { store_id: storeId, return_url: returnUrl },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Stripe connect error:', err);
      toast({
        title: 'Erro ao conectar Stripe',
        description: err instanceof Error ? err.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleSavePix = async () => {
    if (!config.pixManual.key || !config.pixManual.receiverName || !config.pixManual.city) {
      toast({ title: 'Preencha todos os campos do PIX', variant: 'destructive' });
      return;
    }
    setConfig(prev => ({ ...prev, activeGateway: 'pix_manual' as const }));
    await saveNow();
    toast({ title: 'PIX Manual configurado e ativado!' });
  };

  const pixKeyLabels: Record<string, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    email: 'E-mail',
    phone: 'Celular',
    random: 'Chave Aleatória',
  };

  const pixKeyPlaceholders: Record<string, string> = {
    cpf: '12345678900',
    cnpj: '12345678000199',
    email: 'nome.sobrenome@exemplo.com.br',
    phone: '+5511987654321',
    random: '123e4567-e89b-12d3-a456-426614174000',
  };

  const pixKeyHints: Record<string, string> = {
    cpf: 'Formato: 123.456.789-00 (apenas os 11 números do documento)',
    cnpj: 'Formato: 12.345.678/0001-99 (apenas os 14 números)',
    email: 'Formato: nome.sobrenome@exemplo.com.br',
    phone: 'Formato: +5511987654321 (código do país +55, DDD e número)',
    random: 'Formato: 123e4567-e89b-12d3-a456-426614174000 (código gerado pelo banco)',
  };

  const pixKeyMaxLength: Record<string, number> = {
    cpf: 11,
    cnpj: 14,
    email: 77,
    phone: 14,
    random: 36,
  };

  const validatePixKey = (key: string, type: string): string | null => {
    if (!key) return 'Chave PIX é obrigatória';
    switch (type) {
      case 'cpf':
        if (!/^\d{11}$/.test(key)) return 'CPF deve conter exatamente 11 números';
        break;
      case 'cnpj':
        if (!/^\d{14}$/.test(key)) return 'CNPJ deve conter exatamente 14 números';
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return 'E-mail inválido';
        break;
      case 'phone':
        if (!/^\+55\d{10,11}$/.test(key)) return 'Celular deve seguir o formato +55XXXXXXXXXXX';
        break;
      case 'random':
        if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key))
          return 'Chave aleatória deve ser um UUID válido';
        break;
    }
    return null;
  };

  const [pixKeyError, setPixKeyError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <AdminLayout title={t('admin.payments', 'Pagamentos')}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Carregando configurações...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('admin.payments', 'Pagamentos')}>
      <div className="space-y-6 max-w-4xl">

        {/* Active gateway indicator */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Método de Pagamento Ativo</h3>
              <p className="text-lg font-semibold mt-1">
                {config.activeGateway === 'stripe' && '💳 Stripe Connect'}
                {config.activeGateway === 'pix_manual' && '📱 PIX Manual'}
                {!config.activeGateway && 'Não configurado'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Salvando...
                </span>
              )}
              <div className={`w-3 h-3 rounded-full ${config.activeGateway ? 'bg-green-500' : 'bg-muted'}`} />
            </div>
          </div>
        </GlassCard>

        {/* Payment Gateways */}
        <Tabs defaultValue={config.activeGateway === 'pix_manual' ? 'pix_manual' : 'stripe'} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="stripe" className="flex-1 gap-2">
              <CreditCard className="w-4 h-4" />
              Stripe Connect
            </TabsTrigger>
            <TabsTrigger value="pix_manual" className="flex-1 gap-2">
              <QrCode className="w-4 h-4" />
              PIX Manual
            </TabsTrigger>
            <TabsTrigger value="pix_auto" disabled className="flex-1 gap-2 opacity-40 cursor-not-allowed">
              <Zap className="w-4 h-4" />
              PIX Automático
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">Em breve</Badge>
            </TabsTrigger>
          </TabsList>

          {/* STRIPE CONNECT TAB */}
          <TabsContent value="stripe" className="mt-6">
            <GlassCard className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Stripe Connect
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Conecte sua conta Stripe e receba pagamentos diretamente. 100% do valor vai para você.
                  </p>
                </div>
                {stripeStatus.connected && (
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" /> Conectado
                  </Badge>
                )}
                {stripeStatus.onboarding_started && !stripeStatus.connected && (
                  <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                    <Clock className="w-3 h-3 mr-1" /> Pendente
                  </Badge>
                )}
              </div>

              {stripeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Verificando status...</span>
                </div>
              ) : stripeStatus.connected ? (
                <div className="space-y-4">
                  {/* Fully connected status */}
                  <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Link2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-600">Conta Stripe Ativa</p>
                        {stripeStatus.email && (
                          <p className="text-xs text-muted-foreground">{stripeStatus.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 rounded bg-background/50 text-center">
                        <div className="text-xs font-medium text-green-600">✓ Ativo</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Cobranças</div>
                      </div>
                      <div className="p-2 rounded bg-background/50 text-center">
                        <div className={`text-xs font-medium ${stripeStatus.payouts_enabled ? 'text-green-600' : 'text-amber-500'}`}>
                          {stripeStatus.payouts_enabled ? '✓ Ativo' : '⏳ Pendente'}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Saques</div>
                      </div>
                      <div className="p-2 rounded bg-background/50 text-center">
                        <div className="text-xs font-medium text-green-600">✓ Completo</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Cadastro</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Pagamentos são processados diretamente na sua conta Stripe (Direct Charges). Nenhuma taxa de plataforma é cobrada.
                    </p>
                  </div>
                </div>
              ) : stripeStatus.onboarding_started ? (
                <div className="space-y-4">
                  {/* Onboarding started but not complete */}
                  <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-500">Cadastro Pendente</p>
                        {stripeStatus.email && (
                          <p className="text-xs text-muted-foreground">{stripeStatus.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 rounded bg-background/50 text-center">
                        <div className={`text-xs font-medium ${stripeStatus.charges_enabled ? 'text-green-600' : 'text-amber-500'}`}>
                          {stripeStatus.charges_enabled ? '✓ Ativo' : '⏳ Pendente'}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Cobranças</div>
                      </div>
                      <div className="p-2 rounded bg-background/50 text-center">
                        <div className={`text-xs font-medium ${stripeStatus.payouts_enabled ? 'text-green-600' : 'text-amber-500'}`}>
                          {stripeStatus.payouts_enabled ? '✓ Ativo' : '⏳ Pendente'}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Saques</div>
                      </div>
                      <div className="p-2 rounded bg-background/50 text-center">
                        <div className={`text-xs font-medium ${stripeStatus.details_submitted ? 'text-green-600' : 'text-amber-500'}`}>
                          {stripeStatus.details_submitted ? '✓ Completo' : '⏳ Pendente'}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Cadastro</div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleConnectStripe} disabled={connectingStripe} className="w-full">
                    {connectingStripe ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4 mr-2" />
                    )}
                    Completar Cadastro no Stripe
                  </Button>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Complete seu cadastro no Stripe para começar a receber pagamentos.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Not connected */}
                  <div className="p-6 rounded-lg border-2 border-dashed border-border flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <Link2Off className="w-7 h-7 text-primary/60" />
                    </div>
                    <h4 className="font-medium">Conecte sua conta Stripe</h4>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      Ao conectar, você poderá aceitar cartões de crédito, débito e pagamentos internacionais. O dinheiro vai direto para sua conta.
                    </p>
                    <Button
                      onClick={handleConnectStripe}
                      disabled={connectingStripe}
                      className="mt-4"
                      size="lg"
                    >
                      {connectingStripe ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      {connectingStripe ? 'Redirecionando...' : 'Conectar Stripe'}
                    </Button>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Suas credenciais nunca são armazenadas na plataforma. A conexão é feita via OAuth seguro do Stripe.
                    </p>
                  </div>
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* MANUAL PIX TAB */}
          <TabsContent value="pix_manual" className="mt-6">
            <GlassCard className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    PIX Manual
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Um QR code com o valor da venda é gerado para o cliente. O pagamento vai direto para sua chave PIX. Você confirma manualmente.
                  </p>
                </div>
                {config.activeGateway === 'pix_manual' && (
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" /> Ativo
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Tipo de Chave PIX</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {Object.entries(pixKeyLabels).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          pixManual: { ...prev.pixManual, keyType: key as any }
                        }))}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                          config.pixManual.keyType === key
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-muted border-border text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Chave PIX</Label>
                  <Input
                    placeholder={
                      config.pixManual.keyType === 'email' ? 'seu@email.com' :
                      config.pixManual.keyType === 'phone' ? '+5511999999999' :
                      'Digite sua chave PIX'
                    }
                    value={config.pixManual.key}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      pixManual: { ...prev.pixManual, key: e.target.value }
                    }))}
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Recebedor</Label>
                    <Input
                      placeholder="Nome completo"
                      value={config.pixManual.receiverName}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        pixManual: { ...prev.pixManual, receiverName: e.target.value }
                      }))}
                      className="mt-1.5"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      placeholder="São Paulo"
                      value={config.pixManual.city}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        pixManual: { ...prev.pixManual, city: e.target.value }
                      }))}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSavePix} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar e Ativar'}
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          {/* AUTO PIX TAB (coming soon) */}
          <TabsContent value="pix_auto" className="mt-6">
            <GlassCard className="p-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-primary/50" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground">PIX Automático</h3>
                <p className="text-sm text-muted-foreground/60 mt-2 max-w-sm">
                  Confirmação automática de pagamento PIX com notificações instantâneas via webhook. Em breve.
                </p>
                <Badge variant="outline" className="mt-4">
                  <Clock className="w-3 h-3 mr-1" /> Em Breve
                </Badge>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminPagamentosPix;
