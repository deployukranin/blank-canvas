import { motion } from 'framer-motion';
import { Settings, Globe, Bell as BellIcon, Shield } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { toast } from 'sonner';

const CEOConfiguracoes = () => {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    salesNotifications: true,
    weeklyReport: true,
    companyName: '',
    companyEmail: '',
  });

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <CEOLayout title="Configurações">
      <div className="space-y-6 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold">Dados da Empresa</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Nome da Empresa</Label>
                <Input
                  placeholder="Minha Empresa LTDA"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email de Contato</Label>
                <Input
                  placeholder="contato@empresa.com"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <BellIcon className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold">Notificações</h3>
            </div>
            <div className="space-y-4">
              {[
                { key: 'emailAlerts' as const, label: 'Alertas por Email', desc: 'Receber alertas críticos por email' },
                { key: 'salesNotifications' as const, label: 'Notificações de Vendas', desc: 'Ser notificado a cada nova venda' },
                { key: 'weeklyReport' as const, label: 'Relatório Semanal', desc: 'Receber resumo semanal das métricas' },
              ].map((item, i) => (
                <div key={item.key}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={settings[item.key]}
                      onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Settings className="w-4 h-4" />
            Salvar Configurações
          </Button>
        </div>
      </div>
    </CEOLayout>
  );
};

export default CEOConfiguracoes;
