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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      toast({ title: t('adminPayments.errors.storeNotFound'), variant: 'destructive' });
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
        title: t('adminPayments.errors.stripeConnectError'),
        description: err instanceof Error ? err.message : t('adminPayments.errors.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleSavePix = async () => {
    if (!config.pixManual.key || !config.pixManual.receiverName || !config.pixManual.city) {
      toast({ title: t('adminPayments.errors.fillAllPixFields'), variant: 'destructive' });
      return;
    }
    const error = validatePixKey(config.pixManual.key, config.pixManual.keyType);
    if (error) {
      setPixKeyError(error);
      toast({ title: error, variant: 'destructive' });
      return;
    }
    setConfig(prev => ({ ...prev, activeGateway: 'pix_manual' as const }));
    await saveNow();
    toast({ title: t('adminPayments.pixManualConfigured') });
  };

  const pixKeyLabels: Record<string, string> = {
    cpf: t('adminPayments.pixKeyLabels.cpf'),
    cnpj: t('adminPayments.pixKeyLabels.cnpj'),
    email: t('adminPayments.pixKeyLabels.email'),
    phone: t('adminPayments.pixKeyLabels.phone'),
    random: t('adminPayments.pixKeyLabels.random'),
  };

  const pixKeyPlaceholders: Record<string, string> = {
    cpf: '12345678900',
    cnpj: '12345678000199',
    email: 'nome.sobrenome@exemplo.com.br',
    phone: '+5511987654321',
    random: '123e4567-e89b-12d3-a456-426614174000',
  };

  const pixKeyHints: Record<string, string> = {
    cpf: t('adminPayments.pixKeyHints.cpf'),
    cnpj: t('adminPayments.pixKeyHints.cnpj'),
    email: t('adminPayments.pixKeyHints.email'),
    phone: t('adminPayments.pixKeyHints.phone'),
    random: t('adminPayments.pixKeyHints.random'),
  };

  const pixKeyMaxLength: Record<string, number> = {
    cpf: 11,
    cnpj: 14,
    email: 77,
    phone: 14,
    random: 36,
  };

  const validatePixKey = (key: string, type: string): string | null => {
    if (!key) return t('adminPayments.errors.pixKeyRequired');
    switch (type) {
      case 'cpf':
        if (!/^\d{11}$/.test(key)) return t('adminPayments.errors.invalidCpf');
        break;
      case 'cnpj':
        if (!/^\d{14}$/.test(key)) return t('adminPayments.errors.invalidCnpj');
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return t('adminPayments.errors.invalidEmail');
        break;
      case 'phone':
        if (!/^\+55\d{10,11}$/.test(key)) return t('adminPayments.errors.invalidPhone');
        break;
      case 'random':
        if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key))
          return t('adminPayments.errors.invalidRandom');
        break;
    }
    return null;
  };


  if (isLoading) {
    return (
      <AdminLayout title={t('adminPayments.title')}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">{t('adminPayments.loadingConfig')}</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('adminPayments.title')}>
      <div className="space-y-6 max-w-4xl">

        {/* Active gateway indicator */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{t('adminPayments.activeMethod')}</h3>
              <p className="text-lg font-semibold mt-1">
                {config.activeGateway === 'stripe' && `💳 ${t('adminPayments.stripeConnect')}`}
                {config.activeGateway === 'pix_manual' && `📱 ${t('adminPayments.pixManual')}`}
                {!config.activeGateway && t('adminPayments.notConfigured')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> {t('adminPayments.saving')}
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
              {t('adminPayments.stripeConnect')}
            </TabsTrigger>
            <TabsTrigger value="pix_manual" className="flex-1 gap-2">
              <QrCode className="w-4 h-4" />
              {t('adminPayments.pixManual')}
            </TabsTrigger>
            <TabsTrigger value="pix_auto" disabled className="flex-1 gap-2 opacity-40 cursor-not-allowed">
              <Zap className="w-4 h-4" />
              {t('adminPayments.pixAuto')}
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">{t('adminPayments.comingSoon')}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* STRIPE CONNECT TAB */}
          <TabsContent value="stripe" className="mt-6">
            <GlassCard className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    {t('adminPayments.stripeConnect')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('adminPayments.stripeDescription')}
                  </p>
                </div>
                {stripeStatus.connected && (
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" /> {t('adminPayments.connected')}
                  </Badge>
                )}
                {stripeStatus.onboarding_started && !stripeStatus.connected && (
                  <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                    <Clock className="w-3 h-3 mr-1" /> {t('adminPayments.pending')}
                  </Badge>
                )}
              </div>

              {stripeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">{t('adminPayments.checkingStatus')}</span>
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
                        <p className="font-medium text-green-600">{t('adminPayments.stripeAccountActive')}</p>
                        {stripeStatus.email && (
                          <p className="text-xs text-muted-foreground">{stripeStatus.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 rounded bg-background/50 text-center">
                        <div className="text-xs font-medium text-green-600">{t('adminPayments.activeShort')}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{t('adminPayments.charges')}</div>
                      </div>
                      <div className="p-2 rounded bg-background/50 text-center">
                        <div className={`text-xs font-medium ${stripeStatus.payouts_enabled ? 'text-green-600' : 'text-amber-500'}`}>
                          {stripeStatus.payouts_enabled ? t('adminPayments.activeShort') : t('adminPayments.pendingShort')}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{t('adminPayments.payouts')}</div>
                      </div>
                      <div className="p-2 rounded bg-background/50 text-center">
                        <div className="text-xs font-medium text-green-600">{t('adminPayments.completeShort')}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{t('adminPayments.registration')}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {t('adminPayments.directChargesNote')}
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
                        <p className="font-medium text-amber-500">{t('adminPayments.registrationPending')}</p>
                        {stripeStatus.email && (
                          <p className="text-xs text-muted-foreground">{stripeStatus.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 rounded bg-background/50 text-center">
                        <div className={`text-xs font-medium ${stripeStatus.charges_enabled ? 'text-green-600' : 'text-amber-500'}`}>
                          {stripeStatus.charges_enabled ? t('adminPayments.activeShort') : t('adminPayments.pendingShort')}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{t('adminPayments.charges')}</div>
                      </div>
                      <div className="p-2 rounded bg-background/50 text-center">
                        <div className={`text-xs font-medium ${stripeStatus.payouts_enabled ? 'text-green-600' : 'text-amber-500'}`}>
                          {stripeStatus.payouts_enabled ? t('adminPayments.activeShort') : t('adminPayments.pendingShort')}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{t('adminPayments.payouts')}</div>
                      </div>
                      <div className="p-2 rounded bg-background/50 text-center">
                        <div className={`text-xs font-medium ${stripeStatus.details_submitted ? 'text-green-600' : 'text-amber-500'}`}>
                          {stripeStatus.details_submitted ? t('adminPayments.completeShort') : t('adminPayments.pendingShort')}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{t('adminPayments.registration')}</div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleConnectStripe} disabled={connectingStripe} className="w-full">
                    {connectingStripe ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4 mr-2" />
                    )}
                    {t('adminPayments.completeStripeRegistration')}
                  </Button>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {t('adminPayments.completeStripeNote')}
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
                    <h4 className="font-medium">{t('adminPayments.connectStripeAccount')}</h4>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      {t('adminPayments.connectStripeDescription')}
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
                      {connectingStripe ? t('adminPayments.redirecting') : t('adminPayments.connectStripe')}
                    </Button>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {t('adminPayments.stripeSecurityNote')}
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
                    {t('adminPayments.pixManual')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('adminPayments.pixManualDescription')}
                  </p>
                </div>
                {config.activeGateway === 'pix_manual' && (
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" /> {t('adminPayments.active')}
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label>{t('adminPayments.pixKeyType')}</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {Object.entries(pixKeyLabels).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setPixKeyError(null);
                          setConfig(prev => ({
                            ...prev,
                            pixManual: { ...prev.pixManual, keyType: key as any, key: '' }
                          }));
                        }}
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
                  <Label>{t('adminPayments.pixKey')}</Label>
                  <Input
                    placeholder={pixKeyPlaceholders[config.pixManual.keyType] || t('adminPayments.pixKeyPlaceholderDefault')}
                    value={config.pixManual.key}
                    maxLength={pixKeyMaxLength[config.pixManual.keyType] || 77}
                    onChange={(e) => {
                      setPixKeyError(null);
                      let value = e.target.value;
                      if (config.pixManual.keyType === 'cpf' || config.pixManual.keyType === 'cnpj') {
                        value = value.replace(/\D/g, '');
                      }
                      setConfig(prev => ({
                        ...prev,
                        pixManual: { ...prev.pixManual, key: value }
                      }));
                    }}
                    className={`mt-1.5 ${pixKeyError ? 'border-destructive' : ''}`}
                  />
                  <p className={`text-xs mt-1 ${pixKeyError ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {pixKeyError || pixKeyHints[config.pixManual.keyType]}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('adminPayments.receiverName')}</Label>
                    <Input
                      placeholder={t('adminPayments.fullName')}
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
                    <Label>{t('adminPayments.state')}</Label>
                    <Select
                      value={config.pixManual.city}
                      onValueChange={(value) => setConfig(prev => ({
                        ...prev,
                        pixManual: { ...prev.pixManual, city: value }
                      }))}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder={t('adminPayments.selectState')} />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
                          'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
                          'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
                        ].map(uf => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSavePix} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? t('adminPayments.saving') : t('adminPayments.saveAndActivate')}
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
                <h3 className="text-lg font-semibold text-muted-foreground">{t('adminPayments.pixAuto')}</h3>
                <p className="text-sm text-muted-foreground/60 mt-2 max-w-sm">
                  {t('adminPayments.pixAutoDescription')}
                </p>
                <Badge variant="outline" className="mt-4">
                  <Clock className="w-3 h-3 mr-1" /> {t('adminPayments.comingSoonBadge')}
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
