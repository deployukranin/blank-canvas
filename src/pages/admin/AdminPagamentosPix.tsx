import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  QrCode,
  Zap,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  Clock,
  AlertCircle,
  Save,
  Loader2
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

export interface PaymentConfig {
  activeGateway: 'stripe' | 'pix_manual' | null;
  stripe: {
    publishableKey: string;
    secretKey: string;
  };
  pixManual: {
    keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
    key: string;
    receiverName: string;
    city: string;
  };
}

const defaultPaymentConfig: PaymentConfig = {
  activeGateway: null,
  stripe: { publishableKey: '', secretKey: '' },
  pixManual: { keyType: 'cpf', key: '', receiverName: '', city: '' },
};

const AdminPagamentosPix = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

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
  });

  const [showStripeSecret, setShowStripeSecret] = useState(false);

  const handleSaveStripe = async () => {
    if (!config.stripe.publishableKey || !config.stripe.secretKey) {
      toast({ title: 'Fill in all Stripe fields', variant: 'destructive' });
      return;
    }
    setConfig(prev => ({ ...prev, activeGateway: 'stripe' as const }));
    await saveNow();
    toast({ title: 'Stripe configured and activated!' });
  };

  const handleSavePix = async () => {
    if (!config.pixManual.key || !config.pixManual.receiverName || !config.pixManual.city) {
      toast({ title: 'Fill in all PIX fields', variant: 'destructive' });
      return;
    }
    setConfig(prev => ({ ...prev, activeGateway: 'pix_manual' as const }));
    await saveNow();
    toast({ title: 'Manual PIX configured and activated!' });
  };

  const pixKeyLabels: Record<string, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    email: 'E-mail',
    phone: 'Phone',
    random: 'Random Key',
  };

  if (isLoading) {
    return (
      <AdminLayout title={t('admin.payments', 'Payments')}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading payment settings...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('admin.payments', 'Payments')}>
      <div className="space-y-6 max-w-4xl">

        {/* Active gateway indicator */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Active Payment Method</h3>
              <p className="text-lg font-semibold mt-1">
                {config.activeGateway === 'stripe' && '💳 Stripe'}
                {config.activeGateway === 'pix_manual' && '📱 Manual PIX'}
                {!config.activeGateway && 'Not configured'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving...
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
              Stripe
            </TabsTrigger>
            <TabsTrigger value="pix_manual" className="flex-1 gap-2">
              <QrCode className="w-4 h-4" />
              Manual PIX
            </TabsTrigger>
            <TabsTrigger value="pix_auto" disabled className="flex-1 gap-2 opacity-40 cursor-not-allowed">
              <Zap className="w-4 h-4" />
              Auto PIX
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">Soon</Badge>
            </TabsTrigger>
          </TabsList>

          {/* STRIPE TAB */}
          <TabsContent value="stripe" className="mt-6">
            <GlassCard className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Stripe Integration
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Accept credit cards, debit cards, and international payments. Funds go directly to your Stripe account.
                  </p>
                </div>
                {config.activeGateway === 'stripe' && (
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" /> Active
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Publishable Key</Label>
                  <Input
                    placeholder="pk_live_..."
                    value={config.stripe.publishableKey}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      stripe: { ...prev.stripe, publishableKey: e.target.value }
                    }))}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Secret Key</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showStripeSecret ? 'text' : 'password'}
                      placeholder="sk_live_..."
                      value={config.stripe.secretKey}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        stripe: { ...prev.stripe, secretKey: e.target.value }
                      }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStripeSecret(!showStripeSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showStripeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Your secret key is stored securely in the database.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Get your keys from Stripe Dashboard
                </a>
                <Button onClick={handleSaveStripe} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save & Activate'}
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Stripe checkout integration coming soon. Configuration will be ready when Stripe payments go live.
                </p>
              </div>
            </GlassCard>
          </TabsContent>

          {/* MANUAL PIX TAB */}
          <TabsContent value="pix_manual" className="mt-6">
            <GlassCard className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    Manual PIX
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    A QR code with the sale amount is generated for the customer. Payment goes directly to your PIX key. You confirm payment manually.
                  </p>
                </div>
                {config.activeGateway === 'pix_manual' && (
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" /> Active
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label>PIX Key Type</Label>
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
                  <Label>PIX Key</Label>
                  <Input
                    placeholder={
                      config.pixManual.keyType === 'email' ? 'your@email.com' :
                      config.pixManual.keyType === 'phone' ? '+5511999999999' :
                      'Enter your PIX key'
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
                    <Label>Receiver Name</Label>
                    <Input
                      placeholder="Full name"
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
                    <Label>City</Label>
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
                  {isSaving ? 'Saving...' : 'Save & Activate'}
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
                <h3 className="text-lg font-semibold text-muted-foreground">Automatic PIX</h3>
                <p className="text-sm text-muted-foreground/60 mt-2 max-w-sm">
                  Automatic PIX payment confirmation with instant webhook notifications. Coming soon.
                </p>
                <Badge variant="outline" className="mt-4">
                  <Clock className="w-3 h-3 mr-1" /> Coming Soon
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
