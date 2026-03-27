import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, CreditCard, QrCode, Zap, Shield, Headphones, Star } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlanConfig {
  id: string;
  name: string;
  period: 'monthly' | 'quarterly' | 'annual';
  priceBRL: number;
  priceUSD: number;
  features: string[];
  highlight?: boolean;
  discount?: string;
}

const getPlans = (t: any): PlanConfig[] => [
  {
    id: 'monthly',
    name: t('admin.plans.monthly'),
    period: 'monthly',
    priceBRL: 49.90,
    priceUSD: 9.90,
    features: [
      t('admin.plans.features.customPlatform'),
      t('admin.plans.features.fullAdminPanel'),
      t('admin.plans.features.pixStripePayments'),
      t('admin.plans.features.upTo500Users'),
      t('admin.plans.features.emailSupport'),
    ],
  },
  {
    id: 'quarterly',
    name: t('admin.plans.quarterly'),
    period: 'quarterly',
    priceBRL: 129.90,
    priceUSD: 24.90,
    features: [
      t('admin.plans.features.allMonthly'),
      t('admin.plans.features.upTo2000Users'),
      t('admin.plans.features.customDomain'),
      t('admin.plans.features.prioritySupport'),
      t('admin.plans.features.advancedReports'),
    ],
    highlight: true,
    discount: '-13%',
  },
  {
    id: 'annual',
    name: t('admin.plans.annual'),
    period: 'annual',
    priceBRL: 449.90,
    priceUSD: 89.90,
    features: [
      t('admin.plans.features.allQuarterly'),
      t('admin.plans.features.unlimitedUsers'),
      t('admin.plans.features.customAPI'),
      t('admin.plans.features.vipSupport'),
      t('admin.plans.features.premiumAnalytics'),
      t('admin.plans.features.dailyBackup'),
    ],
    discount: '-25%',
  },
];

const AdminPlanos: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'stripe' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isBRL = i18n.language?.startsWith('pt');

  useEffect(() => {
    const fetchStorePlan = async () => {
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: adminStore } = await supabase
        .from('store_admins')
        .select('store_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      let storeId = adminStore?.store_id;
      if (!storeId) {
        const { data: ownedStore } = await supabase
          .from('stores')
          .select('id')
          .eq('created_by', userId)
          .limit(1)
          .maybeSingle();
        storeId = ownedStore?.id;
      }

      if (storeId) {
        const { data: store } = await supabase
          .from('stores')
          .select('plan_type, plan_expires_at')
          .eq('id', storeId)
          .maybeSingle();

        if (store) {
          setCurrentPlan(store.plan_type);
          setPlanExpiresAt(store.plan_expires_at);
        }
      }
      setIsLoading(false);
    };

    fetchStorePlan();
  }, [session?.user?.id]);

  const formatPrice = (plan: PlanConfig) => {
    if (isBRL) {
      return `R$ ${plan.priceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return `$ ${plan.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'monthly': return isBRL ? '/mês' : '/mo';
      case 'quarterly': return isBRL ? '/trimestre' : '/quarter';
      case 'annual': return isBRL ? '/ano' : '/year';
      default: return '';
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setPaymentMethod(null);
  };

  const handlePayment = () => {
    if (!selectedPlan || !paymentMethod) return;

    if (paymentMethod === 'stripe') {
      toast.info(t('admin.plans.stripeComingSoon', 'Stripe integration coming soon! Contact support.'));
    } else {
      toast.info(t('admin.plans.pixInstructions', 'PIX payment instructions sent. Check your email.'));
    }
  };

  const isTrial = currentPlan === 'trial';

  return (
    <AdminLayout title={t('admin.plans.title', 'Planos')}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Current plan info */}
        {!isLoading && currentPlan && (
          <GlassCard className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  {isTrial ? <Zap className="w-5 h-5 text-primary" /> : <Crown className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {isTrial
                      ? t('admin.plans.currentTrial', 'Plano Trial')
                      : t('admin.plans.currentPlan', 'Plano Ativo')}
                  </p>
                  {planExpiresAt && (
                    <p className="text-sm text-muted-foreground">
                      {isTrial
                        ? t('admin.plans.trialExpires', 'Trial expira em {{date}}', {
                            date: new Date(planExpiresAt).toLocaleDateString(isBRL ? 'pt-BR' : 'en-US'),
                          })
                        : t('admin.plans.renewsAt', 'Renova em {{date}}', {
                            date: new Date(planExpiresAt).toLocaleDateString(isBRL ? 'pt-BR' : 'en-US'),
                          })}
                    </p>
                  )}
                </div>
              </div>
              {isTrial && (
                <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-medium">
                  Trial
                </span>
              )}
            </div>
          </GlassCard>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getPlans(t).map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard
                className={`p-6 relative cursor-pointer transition-all hover:scale-[1.02] ${
                  plan.highlight ? 'border-primary/40 ring-1 ring-primary/20' : ''
                } ${selectedPlan === plan.id ? 'ring-2 ring-primary border-primary/60' : ''}`}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.discount && (
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {plan.discount}
                  </span>
                )}

                {plan.highlight && (
                  <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                    {t('admin.plans.popular', 'Popular')}
                  </span>
                )}

                <div className="text-center mb-5">
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-foreground">{formatPrice(plan)}</span>
                    <span className="text-sm text-muted-foreground">{getPeriodLabel(plan.period)}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    selectedPlan === plan.id
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-foreground/10 hover:bg-foreground/15 text-foreground'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan.id);
                  }}
                >
                  {selectedPlan === plan.id
                    ? t('admin.plans.selected', 'Selecionado')
                    : t('admin.plans.select', 'Selecionar')}
                </Button>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Payment method selection */}
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-6 space-y-5">
              <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                {t('admin.plans.paymentMethod', 'Método de Pagamento')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PIX */}
                <div
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'pix'
                      ? 'border-primary bg-primary/10'
                      : 'border-border/30 hover:border-primary/30 bg-foreground/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <QrCode className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">PIX</p>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.plans.pixDesc', 'Pagamento instantâneo via QR Code')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stripe */}
                <div
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'stripe'
                      ? 'border-primary bg-primary/10'
                      : 'border-border/30 hover:border-primary/30 bg-foreground/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">
                        Stripe
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {t('admin.plans.comingSoon', 'Em breve')}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.plans.stripeDesc', 'Cartão de crédito / débito')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
                disabled={!paymentMethod}
                onClick={handlePayment}
              >
                {paymentMethod === 'pix'
                  ? t('admin.plans.payWithPix', 'Pagar com PIX')
                  : paymentMethod === 'stripe'
                  ? t('admin.plans.payWithStripe', 'Pagar com Stripe')
                  : t('admin.plans.selectMethod', 'Selecione um método')}
              </Button>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPlanos;
