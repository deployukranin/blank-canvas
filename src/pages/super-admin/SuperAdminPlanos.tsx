import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Save, DollarSign, Percent, ToggleRight, Hash } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { loadConfig, saveConfig } from '@/lib/config-storage';
import { toast } from 'sonner';

export interface PlanCapabilities {
  customStore?: boolean;
  customDomain?: boolean;
  vipSubscriptions?: boolean;
  community?: boolean;
  customsOrders?: boolean;
  advancedMetrics?: boolean;
  whiteLabelFull?: boolean;
  prioritySupport?: boolean;
  dedicatedOnboarding?: boolean;
  zeroPlatformFee?: boolean;
  apiAccess?: boolean;
  dailyBackup?: boolean;
}

export interface PlanLimits {
  maxUsers?: number; // 0 or undefined = unlimited
  maxVideos?: number;
  maxVipPosts?: number;
  maxAdmins?: number;
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
  capabilities?: PlanCapabilities;
  limits?: PlanLimits;
  highlight?: boolean;
  discount?: string;
}

const CAPABILITY_LABELS: { key: keyof PlanCapabilities; pt: string; en: string; es: string }[] = [
  { key: 'customStore', pt: 'Loja personalizada', en: 'Custom store', es: 'Tienda personalizada' },
  { key: 'customDomain', pt: 'Domínio personalizado', en: 'Custom domain', es: 'Dominio personalizado' },
  { key: 'vipSubscriptions', pt: 'Assinaturas VIP', en: 'VIP subscriptions', es: 'Suscripciones VIP' },
  { key: 'community', pt: 'Comunidade integrada', en: 'Integrated community', es: 'Comunidad integrada' },
  { key: 'customsOrders', pt: 'Vídeos personalizados', en: 'Custom video orders', es: 'Videos a pedido' },
  { key: 'advancedMetrics', pt: 'Métricas avançadas', en: 'Advanced metrics', es: 'Métricas avanzadas' },
  { key: 'whiteLabelFull', pt: 'White-label total', en: 'Full white-label', es: 'White-label total' },
  { key: 'prioritySupport', pt: 'Suporte prioritário', en: 'Priority support', es: 'Soporte prioritario' },
  { key: 'dedicatedOnboarding', pt: 'Onboarding dedicado', en: 'Dedicated onboarding', es: 'Onboarding dedicado' },
  { key: 'zeroPlatformFee', pt: '0% taxa da plataforma', en: '0% platform fee', es: '0% tarifa de plataforma' },
  { key: 'apiAccess', pt: 'Acesso à API', en: 'API access', es: 'Acceso a API' },
  { key: 'dailyBackup', pt: 'Backup diário', en: 'Daily backup', es: 'Backup diario' },
];

const LIMIT_LABELS: { key: keyof PlanLimits; pt: string; en: string; es: string }[] = [
  { key: 'maxUsers', pt: 'Máx. de usuários', en: 'Max users', es: 'Máx. usuarios' },
  { key: 'maxVideos', pt: 'Máx. de vídeos', en: 'Max videos', es: 'Máx. videos' },
  { key: 'maxVipPosts', pt: 'Máx. de posts VIP', en: 'Max VIP posts', es: 'Máx. publicaciones VIP' },
  { key: 'maxAdmins', pt: 'Máx. de admins', en: 'Max admins', es: 'Máx. admins' },
];

const defaultPlans: PlanConfig[] = [
  {
    id: 'basic',
    name_pt: 'Básico',
    name_en: 'Basic',
    name_es: 'Básico',
    period: 'monthly',
    priceBRL: 49.90,
    priceUSD: 9.90,
    features_pt: ['Plataforma personalizada', 'Painel admin completo', 'Pagamentos PIX + Stripe', 'Até 500 usuários', 'Suporte por email'],
    features_en: ['Custom platform', 'Full admin panel', 'PIX + Stripe payments', 'Up to 500 users', 'Email support'],
    features_es: ['Plataforma personalizada', 'Panel admin completo', 'Pagos PIX + Stripe', 'Hasta 500 usuarios', 'Soporte por email'],
  },
  {
    id: 'pro',
    name_pt: 'Profissional',
    name_en: 'Professional',
    name_es: 'Profesional',
    period: 'monthly',
    priceBRL: 129.90,
    priceUSD: 24.90,
    features_pt: ['Tudo do Básico', 'Até 2.000 usuários', 'Domínio personalizado', 'Suporte prioritário', 'Relatórios avançados'],
    features_en: ['All Basic features', 'Up to 2,000 users', 'Custom domain', 'Priority support', 'Advanced reports'],
    features_es: ['Todo del Básico', 'Hasta 2.000 usuarios', 'Dominio personalizado', 'Soporte prioritario', 'Reportes avanzados'],
    highlight: true,
  },
  {
    id: 'premium',
    name_pt: 'Premium',
    name_en: 'Premium',
    name_es: 'Premium',
    period: 'monthly',
    priceBRL: 249.90,
    priceUSD: 49.90,
    features_pt: ['Tudo do Profissional', 'Usuários ilimitados', 'API personalizada', 'Suporte VIP 24h', 'Analytics premium', 'Backup diário'],
    features_en: ['All Professional features', 'Unlimited users', 'Custom API', 'VIP 24h support', 'Premium analytics', 'Daily backup'],
    features_es: ['Todo del Profesional', 'Usuarios ilimitados', 'API personalizada', 'Soporte VIP 24h', 'Analytics premium', 'Backup diario'],
  },
];

const SuperAdminPlanos: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [plans, setPlans] = useState<PlanConfig[]>(defaultPlans);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const lang = i18n.language?.startsWith('pt') ? 'pt' : i18n.language?.startsWith('es') ? 'es' : 'en';

  useEffect(() => {
    const fetchPlans = async () => {
      const parsed = await loadConfig<PlanConfig[]>('platform_plans');
      if (Array.isArray(parsed) && parsed.length > 0) {
        setPlans(parsed);
      }
      setIsLoading(false);
    };
    fetchPlans();
  }, []);

  const updatePlan = (index: number, field: keyof PlanConfig, value: any) => {
    setPlans(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateFeature = (planIndex: number, featureIndex: number, langKey: string, value: string) => {
    setPlans(prev => {
      const updated = [...prev];
      const featuresKey = `features_${langKey}` as keyof PlanConfig;
      const features = [...(updated[planIndex][featuresKey] as string[])];
      features[featureIndex] = value;
      updated[planIndex] = { ...updated[planIndex], [featuresKey]: features };
      return updated;
    });
  };

  const addFeature = (planIndex: number) => {
    setPlans(prev => {
      const updated = [...prev];
      updated[planIndex] = {
        ...updated[planIndex],
        features_pt: [...updated[planIndex].features_pt, ''],
        features_en: [...updated[planIndex].features_en, ''],
        features_es: [...updated[planIndex].features_es, ''],
      };
      return updated;
    });
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    setPlans(prev => {
      const updated = [...prev];
      updated[planIndex] = {
        ...updated[planIndex],
        features_pt: updated[planIndex].features_pt.filter((_, i) => i !== featureIndex),
        features_en: updated[planIndex].features_en.filter((_, i) => i !== featureIndex),
        features_es: updated[planIndex].features_es.filter((_, i) => i !== featureIndex),
      };
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const ok = await saveConfig('platform_plans', plans);
      if (!ok) throw new Error('save failed');
      toast.success(t('superAdmin.planConfig.saved', 'Planos salvos com sucesso!'));
    } catch (err) {
      console.error(err);
      toast.error(t('superAdmin.planConfig.error', 'Erro ao salvar planos'));
    } finally {
      setIsSaving(false);
    }
  };

  const getNameField = (plan: PlanConfig) => {
    if (lang === 'pt') return plan.name_pt;
    if (lang === 'es') return plan.name_es;
    return plan.name_en;
  };

  const getFeatures = (plan: PlanConfig) => {
    if (lang === 'pt') return plan.features_pt;
    if (lang === 'es') return plan.features_es;
    return plan.features_en;
  };

  const getFeaturesKey = () => `features_${lang}` as 'features_pt' | 'features_en' | 'features_es';
  const getNameKey = () => `name_${lang}` as 'name_pt' | 'name_en' | 'name_es';

  if (isLoading) {
    return (
      <SuperAdminLayout title={t('superAdmin.planConfig.title', 'Configurar Planos')}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title={t('superAdmin.planConfig.title', 'Configurar Planos')}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50">
            {t('superAdmin.planConfig.description', 'Configure os planos de assinatura que os criadores podem contratar.')}
          </p>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4" />
            {isSaving ? t('common.loading') : t('common.save')}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {plans.map((plan, planIndex) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: planIndex * 0.1 }}
            >
              <GlassCard className={`p-6 ${plan.highlight ? 'border-purple-500/30 ring-1 ring-purple-500/20' : ''}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{getNameField(plan)}</h3>
                    <span className="text-xs text-white/40 uppercase">{plan.period}</span>
                  </div>
                  {plan.discount && (
                    <span className="ml-auto px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-xs font-bold">
                      {plan.discount}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                  {/* Name */}
                  <div>
                    <Label className="text-white/60 text-xs">
                      {t('superAdmin.planConfig.planName', 'Nome do plano')} ({lang.toUpperCase()})
                    </Label>
                    <Input
                      value={(plan[getNameKey()] as string)}
                      onChange={e => updatePlan(planIndex, getNameKey(), e.target.value)}
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>

                  {/* Price BRL */}
                  <div>
                    <Label className="text-white/60 text-xs flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> {t('superAdmin.planConfig.priceBRL', 'Preço BRL (R$)')}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={plan.priceBRL}
                      onChange={e => updatePlan(planIndex, 'priceBRL', parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>

                  {/* Price USD */}
                  <div>
                    <Label className="text-white/60 text-xs flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> {t('superAdmin.planConfig.priceUSD', 'Preço USD ($)')}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={plan.priceUSD}
                      onChange={e => updatePlan(planIndex, 'priceUSD', parseFloat(e.target.value) || 0)}
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <Label className="text-white/60 text-xs flex items-center gap-1">
                      <Percent className="w-3 h-3" /> {t('superAdmin.planConfig.discount', 'Desconto (badge)')}
                    </Label>
                    <Input
                      value={plan.discount || ''}
                      onChange={e => updatePlan(planIndex, 'discount', e.target.value || undefined)}
                      placeholder="-13%"
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>

                  {/* Highlight */}
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plan.highlight || false}
                        onChange={e => updatePlan(planIndex, 'highlight', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-white/70">
                        {t('superAdmin.planConfig.highlight', 'Destacar como popular')}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Stripe Price IDs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <div className="md:col-span-2 flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Stripe Recurring Price IDs</span>
                  </div>
                  <div>
                    <Label className="text-white/60 text-xs">Price ID (BRL)</Label>
                    <Input
                      value={plan.stripe_price_id_brl || ''}
                      onChange={e => updatePlan(planIndex, 'stripe_price_id_brl', e.target.value)}
                      placeholder="price_1Abc...XYZ"
                      className="bg-white/5 border-white/10 text-white mt-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-white/60 text-xs">Price ID (USD)</Label>
                    <Input
                      value={plan.stripe_price_id_usd || ''}
                      onChange={e => updatePlan(planIndex, 'stripe_price_id_usd', e.target.value)}
                      placeholder="price_1Abc...XYZ"
                      className="bg-white/5 border-white/10 text-white mt-1 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Features */}
                <div>
                  <Label className="text-white/60 text-xs mb-2 block">
                    {t('superAdmin.planConfig.features', 'Recursos')} ({lang.toUpperCase()})
                  </Label>
                  <div className="space-y-2">
                    {getFeatures(plan).map((feature, fIndex) => (
                      <div key={fIndex} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={e => updateFeature(planIndex, fIndex, lang, e.target.value)}
                          className="bg-white/5 border-white/10 text-white text-sm"
                          placeholder={`${t('superAdmin.planConfig.feature', 'Recurso')} ${fIndex + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(planIndex, fIndex)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addFeature(planIndex)}
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs"
                    >
                      + {t('superAdmin.planConfig.addFeature', 'Adicionar recurso')}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4" />
            {isSaving ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminPlanos;
