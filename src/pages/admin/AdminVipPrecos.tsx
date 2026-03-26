import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Crown, Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  defaultVipConfig,
  saveVipConfig,
  type VipConfig,
  type VipPlan,
} from '@/lib/vip-config';

const AdminVipPrecos = () => {
  const { i18n } = useTranslation();
  const { 
    config, 
    setConfig, 
    isLoading, 
    isSaving, 
    saveNow 
  } = usePersistentConfig<VipConfig>({
    configKey: 'vip_config',
    defaultValue: defaultVipConfig,
    localStorageKey: 'vipConfig',
    debounceMs: 2000,
  });

  // Keep local cache updated
  useEffect(() => {
    if (!isLoading) {
      saveVipConfig(config);
    }
  }, [config, isLoading]);

  const handleSave = async () => {
    await saveNow();
  };

  const addPlan = () => {
    const newPlan: VipPlan = {
      id: `plan-${Date.now()}`,
      name: 'Novo Plano',
      type: 'monthly',
      price: 29.90,
      description: 'Descrição do plano',
      features: ['Recurso 1', 'Recurso 2'],
    };
    setConfig(prev => ({ ...prev, plans: [...prev.plans, newPlan] }));
  };

  const updatePlan = (index: number, field: keyof VipPlan, value: string | number | string[]) => {
    setConfig(prev => {
      const newPlans = [...prev.plans];
      newPlans[index] = { ...newPlans[index], [field]: value };
      return { ...prev, plans: newPlans };
    });
  };

  const removePlan = (index: number) => {
    setConfig(prev => {
      const newPlans = prev.plans.filter((_, i) => i !== index);
      return { ...prev, plans: newPlans };
    });
  };

  const addFeature = (planIndex: number) => {
    setConfig(prev => {
      const newPlans = [...prev.plans];
      newPlans[planIndex].features = [...newPlans[planIndex].features, 'Novo recurso'];
      return { ...prev, plans: newPlans };
    });
  };

  const updateFeature = (planIndex: number, featureIndex: number, value: string) => {
    setConfig(prev => {
      const newPlans = [...prev.plans];
      newPlans[planIndex].features[featureIndex] = value;
      return { ...prev, plans: newPlans };
    });
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    setConfig(prev => {
      const newPlans = [...prev.plans];
      newPlans[planIndex].features = newPlans[planIndex].features.filter((_, i) => i !== featureIndex);
      return { ...prev, plans: newPlans };
    });
  };

  const formatCurrency = (value: number) => {
    const isBR = i18n.language?.startsWith('pt');
    return new Intl.NumberFormat(isBR ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: isBR ? 'BRL' : 'USD',
    }).format(value);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Preços VIP">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Carregando configurações...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Preços VIP">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Configure os planos e preços das assinaturas VIP
            </p>
            {isSaving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Salvando...
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addPlan}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Plano
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar no servidor'}
            </Button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid gap-6 md:grid-cols-2">
          {config.plans.map((plan, planIndex) => (
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
                  <h3 className="font-semibold">Plano {planIndex + 1}</h3>
                  <Badge variant="outline" className="ml-auto">
                    {plan.type === 'monthly' ? 'Mensal' : plan.type === 'quarterly' ? 'Trimestral' : 'Anual'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nome</label>
                    <Input
                      value={plan.name}
                      onChange={e => updatePlan(planIndex, 'name', e.target.value)}
                      placeholder="Nome do plano"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tipo</label>
                    <Select
                      value={plan.type}
                      onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => updatePlan(planIndex, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Preço (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min={1}
                      value={plan.price}
                      onChange={e => updatePlan(planIndex, 'price', parseFloat(e.target.value) || 0)}
                      className={plan.price < 10 ? 'border-destructive' : ''}
                    />
                    {plan.price < 10 && (
                      <p className="text-xs text-destructive mt-1">Valor mínimo: R$ 10,00</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Descrição</label>
                    <Textarea
                      value={plan.description}
                      onChange={e => updatePlan(planIndex, 'description', e.target.value)}
                      placeholder="Descrição do plano"
                      className="min-h-[60px]"
                    />
                  </div>

                  {/* Features */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Recursos Inclusos
                      </label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addFeature(planIndex)}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
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
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(plan.price)}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.type === 'monthly' ? '/mês' : plan.type === 'quarterly' ? '/trimestre' : '/ano'}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {config.plans.length === 0 && (
          <GlassCard className="p-12 text-center">
            <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">Nenhum plano VIP cadastrado</p>
            <Button onClick={addPlan}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Plano
            </Button>
          </GlassCard>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminVipPrecos;
