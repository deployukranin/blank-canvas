import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Crown, Sparkles, Loader2, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTenant } from '@/contexts/TenantContext';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePersistentConfig } from '@/hooks/use-persistent-config';
import {
  getDefaultVipConfig,
  saveVipConfig,
  translateDefaultsToLang,
  type VipConfig,
  type VipPlan,
} from '@/lib/vip-config';

const MONTHS_MAP = { monthly: 1, quarterly: 3, yearly: 12 } as const;

const AdminVipPrecos = () => {
  const { t, i18n } = useTranslation();
  const isBR = i18n.language?.startsWith('pt');
  const { store } = useTenant();

  const {
    config,
    setConfig,
    isLoading,
    isSaving,
    saveNow,
  } = usePersistentConfig<VipConfig>({
    configKey: 'vip_config',
    defaultValue: getDefaultVipConfig(i18n.language),
    localStorageKey: 'vipConfig',
    debounceMs: 2000,
    storeId: store?.id,
    seedDefaultsIfMissing: true,
  });

  useEffect(() => {
    if (!isLoading) saveVipConfig(config);
  }, [config, isLoading]);

  // Translate plan copy whenever language changes — any value still matching a
  // known default in pt/en/es gets converted to the active locale.
  useEffect(() => {
    if (isLoading) return;
    const migrated = translateDefaultsToLang(config, i18n.language);
    if (JSON.stringify(migrated) !== JSON.stringify(config)) {
      setConfig(migrated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, i18n.language]);

  const formatCurrency = (value: number, currency: 'BRL' | 'USD' = 'BRL') => {
    const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  };

  // Find the monthly plan price as baseline for savings calculation
  const monthlyBasePrice = useMemo(() => {
    const monthlyPlan = config.plans.find(p => p.type === 'monthly');
    return monthlyPlan ? monthlyPlan.price : null;
  }, [config.plans]);

  const calcSavings = (plan: VipPlan) => {
    if (!monthlyBasePrice || monthlyBasePrice <= 0 || plan.type === 'monthly') return null;
    const months = MONTHS_MAP[plan.type];
    const fullPrice = monthlyBasePrice * months;
    const savings = ((fullPrice - plan.price) / fullPrice) * 100;
    const perMonth = plan.price / months;
    return savings > 0 ? { percent: Math.round(savings), perMonth } : null;
  };

  const handleSave = () => saveNow();

  const addPlan = () => {
    const newPlan: VipPlan = {
      id: `plan-${Date.now()}`,
      name: isBR ? 'Novo Plano' : 'New Plan',
      type: 'monthly',
      price: 29.90,
      currency: isBR ? 'BRL' : 'USD',
      description: isBR ? 'Descrição do plano' : 'Plan description',
      features: [isBR ? 'Recurso 1' : 'Feature 1', isBR ? 'Recurso 2' : 'Feature 2'],
    };
    setConfig(prev => ({ ...prev, plans: [...prev.plans, newPlan] }));
  };

  const updatePlan = (index: number, field: keyof VipPlan, value: string | number | string[]) => {
    setConfig(prev => {
      const newPlans = [...prev.plans];
      newPlans[index] = { ...newPlans[index], [field]: value } as VipPlan;
      return { ...prev, plans: newPlans };
    });
  };

  const removePlan = (index: number) => {
    setConfig(prev => ({ ...prev, plans: prev.plans.filter((_, i) => i !== index) }));
  };

  const addFeature = (planIndex: number) => {
    setConfig(prev => {
      const newPlans = [...prev.plans];
      newPlans[planIndex] = {
        ...newPlans[planIndex],
        features: [...newPlans[planIndex].features, t('vipPricing.newFeature')],
      };
      return { ...prev, plans: newPlans };
    });
  };

  const updateFeature = (planIndex: number, featureIndex: number, value: string) => {
    setConfig(prev => {
      const newPlans = [...prev.plans];
      const features = [...newPlans[planIndex].features];
      features[featureIndex] = value;
      newPlans[planIndex] = { ...newPlans[planIndex], features };
      return { ...prev, plans: newPlans };
    });
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    setConfig(prev => {
      const newPlans = [...prev.plans];
      newPlans[planIndex] = {
        ...newPlans[planIndex],
        features: newPlans[planIndex].features.filter((_, i) => i !== featureIndex),
      };
      return { ...prev, plans: newPlans };
    });
  };

  const typeLabel = (type: string) => t(`vipPricing.${type}`);
  const periodLabel = (type: string) =>
    type === 'monthly' ? t('vipPricing.perMonth') : type === 'quarterly' ? t('vipPricing.perQuarter') : t('vipPricing.perYear');

  if (isLoading) {
    return (
      <AdminLayout title={t('vipPricing.title')}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">{t('common.loading')}</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('vipPricing.title')}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{t('vipPricing.subtitle')}</p>
            {isSaving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t('vipPricing.saving')}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addPlan}>
              <Plus className="w-4 h-4 mr-2" />
              {t('vipPricing.newPlan')}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? t('vipPricing.saving') : t('vipPricing.saveToServer')}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {config.plans.map((plan, planIndex) => {
            const savings = calcSavings(plan);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: planIndex * 0.1 }}
              >
                <GlassCard className="p-6 relative">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 text-destructive hover:text-destructive"
                    onClick={() => removePlan(planIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">{t('vipPricing.plan')} {planIndex + 1}</h3>
                    <Badge variant="outline" className="ml-auto">{typeLabel(plan.type)}</Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">{t('vipPricing.name')}</label>
                      <Input
                        value={plan.name}
                        onChange={e => updatePlan(planIndex, 'name', e.target.value)}
                        placeholder={t('vipPricing.planName')}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">{t('vipPricing.type')}</label>
                      <Select
                        value={plan.type}
                        onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => updatePlan(planIndex, 'type', value)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">{t('vipPricing.monthly')}</SelectItem>
                          <SelectItem value="quarterly">{t('vipPricing.quarterly')}</SelectItem>
                          <SelectItem value="yearly">{t('vipPricing.yearly')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-sm font-medium mb-1 block">{t('vipPricing.currency', 'Moeda')}</label>
                        <Select
                          value={plan.currency || 'BRL'}
                          onValueChange={(value: 'BRL' | 'USD') => updatePlan(planIndex, 'currency', value)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BRL">BRL (R$)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium mb-1 block">
                          {t('vipPricing.price')} ({plan.currency || 'BRL'})
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min={1}
                          value={plan.price}
                          onChange={e => updatePlan(planIndex, 'price', parseFloat(e.target.value) || 0)}
                          className={plan.price < 10 ? 'border-destructive' : ''}
                        />
                        {plan.price < 10 && (
                          <p className="text-xs text-destructive mt-1">{t('vipPricing.minValue')}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">{t('vipPricing.description')}</label>
                      <Textarea
                        value={plan.description}
                        onChange={e => updatePlan(planIndex, 'description', e.target.value)}
                        placeholder={t('vipPricing.descriptionPlaceholder')}
                        className="min-h-[60px]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          {t('vipPricing.includedFeatures')}
                        </label>
                        <Button size="sm" variant="ghost" onClick={() => addFeature(planIndex)} className="h-7 text-xs">
                          <Plus className="w-3 h-3 mr-1" />
                          {t('vipPricing.add')}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <Input
                              value={feature}
                              onChange={e => updateFeature(planIndex, featureIndex, e.target.value)}
                              className="flex-1 h-8 text-sm"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeFeature(planIndex, featureIndex)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">{t('vipPricing.preview')}:</p>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(plan.price)}</p>
                      <p className="text-xs text-muted-foreground">{periodLabel(plan.type)}</p>
                      {savings && (
                        <div className="mt-2 flex flex-col items-center gap-1">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {t('vipPricing.savings', { percent: savings.percent })}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {t('vipPricing.equivalentMonth', { value: formatCurrency(savings.perMonth) })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {config.plans.length === 0 && (
          <GlassCard className="p-12 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">{t('vipPricing.noPlans')}</p>
            <Button onClick={addPlan}>
              <Plus className="w-4 h-4 mr-2" />
              {t('vipPricing.createFirst')}
            </Button>
          </GlassCard>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminVipPrecos;
