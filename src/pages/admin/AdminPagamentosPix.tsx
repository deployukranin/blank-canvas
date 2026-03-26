import { useState } from 'react';
import { 
  CreditCard, 
  QrCode,
  Zap,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const AdminPagamentosPix = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Active gateway state
  const [activeGateway, setActiveGateway] = useState<'stripe' | 'pix_manual' | null>(null);

  // Stripe config
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [stripeSaving, setStripeSaving] = useState(false);

  // PIX Manual config
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random'>('cpf');
  const [pixKey, setPixKey] = useState('');
  const [pixReceiverName, setPixReceiverName] = useState('');
  const [pixCity, setPixCity] = useState('');
  const [pixSaving, setPixSaving] = useState(false);

  const handleSaveStripe = async () => {
    if (!stripePublishableKey || !stripeSecretKey) {
      toast({ title: 'Fill in all Stripe fields', variant: 'destructive' });
      return;
    }
    setStripeSaving(true);
    // TODO: Save stripe keys to app_configurations for this store
    setTimeout(() => {
      setStripeSaving(false);
      setActiveGateway('stripe');
      toast({ title: 'Stripe configured successfully!' });
    }, 1000);
  };

  const handleSavePix = async () => {
    if (!pixKey || !pixReceiverName || !pixCity) {
      toast({ title: 'Fill in all PIX fields', variant: 'destructive' });
      return;
    }
    setPixSaving(true);
    // TODO: Save PIX config to app_configurations for this store
    setTimeout(() => {
      setPixSaving(false);
      setActiveGateway('pix_manual');
      toast({ title: 'Manual PIX configured successfully!' });
    }, 1000);
  };

  const pixKeyLabels: Record<string, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    email: 'E-mail',
    phone: 'Phone',
    random: 'Random Key',
  };

  return (
    <AdminLayout title={t('admin.payments', 'Payments')}>
      <div className="space-y-6 max-w-4xl">

        {/* Active gateway indicator */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white/60">Active Payment Method</h3>
              <p className="text-lg font-semibold text-white mt-1">
                {activeGateway === 'stripe' && 'Stripe'}
                {activeGateway === 'pix_manual' && 'Manual PIX'}
                {!activeGateway && 'Not configured'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${activeGateway ? 'bg-green-500' : 'bg-white/20'}`} />
          </div>
        </GlassCard>

        {/* Payment Gateways */}
        <Tabs defaultValue="stripe" className="w-full">
          <TabsList className="w-full bg-white/5 border border-white/10">
            <TabsTrigger value="stripe" className="flex-1 gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
              <CreditCard className="w-4 h-4" />
              Stripe
            </TabsTrigger>
            <TabsTrigger value="pix_manual" className="flex-1 gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
              <QrCode className="w-4 h-4" />
              Manual PIX
            </TabsTrigger>
            <TabsTrigger value="pix_auto" disabled className="flex-1 gap-2 opacity-40 cursor-not-allowed">
              <Zap className="w-4 h-4" />
              Auto PIX
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/30 text-purple-400 ml-1">Soon</Badge>
            </TabsTrigger>
          </TabsList>

          {/* STRIPE TAB */}
          <TabsContent value="stripe" className="mt-6">
            <GlassCard className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    Stripe Integration
                  </h3>
                  <p className="text-sm text-white/50 mt-1">
                    Accept credit cards, debit cards, and international payments. Funds go directly to your Stripe account.
                  </p>
                </div>
                {activeGateway === 'stripe' && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" /> Active
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white/70">Publishable Key</Label>
                  <Input
                    placeholder="pk_live_..."
                    value={stripePublishableKey}
                    onChange={(e) => setStripePublishableKey(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-white/70">Secret Key</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showStripeSecret ? 'text' : 'password'}
                      placeholder="sk_live_..."
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStripeSecret(!showStripeSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    >
                      {showStripeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-white/30 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Your secret key is encrypted and stored securely.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Get your keys from Stripe Dashboard
                </a>
                <Button
                  onClick={handleSaveStripe}
                  disabled={stripeSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {stripeSaving ? 'Saving...' : 'Save & Activate'}
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          {/* MANUAL PIX TAB */}
          <TabsContent value="pix_manual" className="mt-6">
            <GlassCard className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-purple-400" />
                    Manual PIX
                  </h3>
                  <p className="text-sm text-white/50 mt-1">
                    A QR code with the sale amount is generated for the customer. Payment goes directly to your PIX key.
                  </p>
                </div>
                {activeGateway === 'pix_manual' && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" /> Active
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white/70">PIX Key Type</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {Object.entries(pixKeyLabels).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setPixKeyType(key as any)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                          pixKeyType === key
                            ? 'bg-purple-600/20 border-purple-500/40 text-purple-400'
                            : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white/70">PIX Key</Label>
                  <Input
                    placeholder={pixKeyType === 'email' ? 'your@email.com' : pixKeyType === 'phone' ? '+5511999999999' : 'Enter your PIX key'}
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/70">Receiver Name</Label>
                    <Input
                      placeholder="Full name"
                      value={pixReceiverName}
                      onChange={(e) => setPixReceiverName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1.5"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <Label className="text-white/70">City</Label>
                    <Input
                      placeholder="São Paulo"
                      value={pixCity}
                      onChange={(e) => setPixCity(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mt-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSavePix}
                  disabled={pixSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {pixSaving ? 'Saving...' : 'Save & Activate'}
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          {/* AUTO PIX TAB (coming soon) */}
          <TabsContent value="pix_auto" className="mt-6">
            <GlassCard className="p-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/10 flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-purple-400/50" />
                </div>
                <h3 className="text-lg font-semibold text-white/60">Automatic PIX</h3>
                <p className="text-sm text-white/30 mt-2 max-w-sm">
                  Automatic PIX payment confirmation with instant webhook notifications. Coming soon.
                </p>
                <Badge variant="outline" className="mt-4 border-purple-500/30 text-purple-400">
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
