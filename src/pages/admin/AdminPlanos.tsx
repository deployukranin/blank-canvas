import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, CreditCard, Zap, HardDrive } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getPublicOrigin, publicUrl } from '@/lib/public-url';

interface PlanLimits {
  maxUsers?: number;
  maxVideos?: number;
  maxVipPosts?: number;
  maxAdmins?: number;
  storageGB?: number; // 0 = unlimited
}

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
  limits?: PlanLimits;
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
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);


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

  const getStorageLabel = (plan: PlanConfig) => {
    const gb = plan.limits?.storageGB;
    if (gb === undefined || gb === null) return null;
    if (gb <= 0) return t('admin.plans.storageUnlimited', 'Armazenamento ilimitado');
    return t('admin.plans.storageGB', '{{gb}} GB de armazenamento', { gb });
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

  const handlePayment = async (planId: string) => {
    if (!planId || !storeId || checkoutPlanId) return;

    setCheckoutPlanId(planId);
    try {
      const returnBase = getPublicOrigin() + window.location.pathname;
      const { data, error } = await supabase.functions.invoke('platform-subscription-checkout', {
        body: {
          store_id: storeId,
          plan_id: planId,
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
      setCheckoutPlanId(null);
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
                  className={`p-6 relative transition-all ${
                    plan.highlight ? 'border-primary/40 ring-1 ring-primary/20' : ''
                  }`}
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

                  {getStorageLabel(plan) && (
                    <div className="mb-5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <HardDrive className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground">{getStorageLabel(plan)}</span>
                      </div>
                      <p className="mt-1 text-center text-[10px] leading-tight text-muted-foreground whitespace-nowrap">
                        {t('admin.plans.storageHelp', 'Armazenamento para conteúdos e assets da sua loja.')}
                      </p>
                    </div>
                  )}


                  <ul className="space-y-2.5 mb-6">
                    {getPlanFeatures(plan).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={currentPlan === plan.id || checkoutPlanId !== null}
                    onClick={() => handlePayment(plan.id)}
                  >
                    {currentPlan === plan.id ? (
                      t('admin.plans.currentPlanBadge', 'Plano atual')
                    ) : checkoutPlanId === plan.id ? (
                      t('common.loading', 'Carregando...')
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        {t('admin.plans.payWithStripe', 'Assinar com Stripe')}
                      </span>
                    )}
                  </Button>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminPlanos;
