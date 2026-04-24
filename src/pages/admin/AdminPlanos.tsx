import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, CreditCard, QrCode, Zap } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlanConfig {
  id: string;
  name_pt: string;
  name_en: string;
  name_es: string;
  period: 'monthly' | 'quarterly' | 'annual';
  priceBRL: number;
  priceUSD: number;
  stripe_price_id_brl?: string;
  stripe_price_id_usd?: string;
  features_pt: string[];
  features_en: string[];
  features_es: string[];
  highlight?: boolean;
  discount?: string;
}

const AdminPlanos: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'stripe' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const isBRL = i18n.language?.startsWith('pt');
  const lang = i18n.language?.startsWith('pt') ? 'pt' : i18n.language?.startsWith('es') ? 'es' : 'en';

  useEffect(() => {
    const init = async () => {
      const userId = session?.user?.id;
      if (!userId) { setIsLoading(false); return; }

      // Resolve store
      const { data: adminStore } = await supabase
        .from('store_admins')
        .select('store_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      let resolvedStoreId = adminStore?.store_id ?? null;
      if (!resolvedStoreId) {
        const { data: ownedStore } = await supabase
          .from('stores')
          .select('id')
          .eq('created_by', userId)
          .limit(1)
          .maybeSingle();
        resolvedStoreId = ownedStore?.id ?? null;
      }

      if (resolvedStoreId) {
        setStoreId(resolvedStoreId);
        const { data: store } = await supabase
          .from('stores')
          .select('plan_type, plan_expires_at')
          .eq('id', resolvedStoreId)
          .maybeSingle();
        if (store) {
          setCurrentPlan(store.plan_type);
          setPlanExpiresAt(store.plan_expires_at);
        }
      }

      // Load plans from app_configurations
      const { data: planConfig } = await supabase
        .from('app_configurations')
        .select('config_value')
        .eq('config_key', 'platform_plans')
        .is('store_id', null)
        .maybeSingle();

      if (planConfig?.config_value) {
        const parsed = planConfig.config_value as unknown as PlanConfig[];
        if (Array.isArray(parsed)) setPlans(parsed);
      }

      setIsLoading(false);
    };
    init();
  }, [session?.user?.id]);

  const getPlanName = (plan: PlanConfig) => {
    if (lang === 'pt') return plan.name_pt;
    if (lang === 'es') return plan.name_es;
    return plan.name_en;
  };

  const getPlanFeatures = (plan: PlanConfig) => {
    if (lang === 'pt') return plan.features_pt;
    if (lang === 'es') return plan.features_es;
    return plan.features_en;
  };

  const formatPrice = (plan: PlanConfig) => {
    if (isBRL) return `R$ ${plan.priceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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

  const handlePayment = async () => {
    if (!selectedPlan || !paymentMethod || !storeId) return;

    if (paymentMethod === 'pix') {
      toast.info(t('admin.plans.pixInstructions', 'PIX para planos da plataforma em breve. Use Stripe por enquanto.'));
      return;
    }

    setIsCheckingOut(true);
    try {
      const returnBase = window.location.origin + window.location.pathname;
      const { data, error } = await supabase.functions.invoke('platform-subscription-checkout', {
        body: {
          store_id: storeId,
          plan_id: selectedPlan,
          currency: isBRL ? 'brl' : 'usd',
          success_url: `${returnBase}?subscription=success`,
          cancel_url: `${returnBase}?subscription=cancelled`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err instanceof Error ? err.message : t('common.error', 'Erro'));
    } finally {
      setIsCheckingOut(false);
    }
  };

  const isTrial = currentPlan === 'trial';

  // Detect return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('subscription');
    if (status === 'success') {
      toast.success(t('admin.plans.subscriptionSuccess', 'Assinatura ativada! Pode levar alguns segundos para atualizar.'));
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'cancelled') {
      toast.info(t('admin.plans.subscriptionCancelled', 'Assinatura cancelada.'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [t]);

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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
          </div>
        ) : plans.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground">
              {t('admin.plans.noPlans', 'Nenhum plano configurado. Aguarde a configuração do administrador.')}
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan, index) => (
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
                  onClick={() => { setSelectedPlan(plan.id); setPaymentMethod(null); }}
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
                    <h3 className="text-lg font-bold text-foreground">{getPlanName(plan)}</h3>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-foreground">{formatPrice(plan)}</span>
                      <span className="text-sm text-muted-foreground">{getPeriodLabel(plan.period)}</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {getPlanFeatures(plan).map((feature, i) => (
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
                    onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan.id); setPaymentMethod(null); }}
                  >
                    {selectedPlan === plan.id
                      ? t('admin.plans.selected', 'Selecionado')
                      : t('admin.plans.select', 'Selecionar')}
                  </Button>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Payment method */}
        {selectedPlan && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-6 space-y-5">
              <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                {t('admin.plans.paymentMethod', 'Método de Pagamento')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <p className="font-medium text-foreground">Stripe</p>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.plans.stripeDesc', 'Cartão de crédito / débito (assinatura recorrente)')}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all opacity-60 ${
                    paymentMethod === 'pix'
                      ? 'border-primary bg-primary/10'
                      : 'border-border/30 hover:border-primary/30 bg-foreground/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <QrCode className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">
                        PIX
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {t('admin.plans.comingSoon', 'Em breve')}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.plans.pixDesc', 'Pagamento manual via QR Code')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
                disabled={!paymentMethod || isCheckingOut}
                onClick={handlePayment}
              >
                {isCheckingOut
                  ? t('common.loading', 'Carregando...')
                  : paymentMethod === 'stripe'
                  ? t('admin.plans.payWithStripe', 'Continuar para Stripe')
                  : paymentMethod === 'pix'
                  ? t('admin.plans.payWithPix', 'Pagar com PIX')
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
