import React, { useState } from 'react';
import { Settings, Shield, Globe, Bell, Save } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const SuperAdminConfiguracoes: React.FC = () => {
  const [platformName, setPlatformName] = useState('WhisperScape');
  const [platformDomain, setPlatformDomain] = useState('');
  const [trialDays, setTrialDays] = useState(7);
  const [autoSuspendExpired, setAutoSuspendExpired] = useState(false);
  const [newSignupsEnabled, setNewSignupsEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso');
  };

  return (
    <SuperAdminLayout title="Configurações">
      <div className="space-y-6 max-w-2xl">
        {/* Platform */}
        <GlassCard className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            Plataforma
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Plataforma SaaS</Label>
              <Input id="name" value={platformName} onChange={e => setPlatformName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="domain">Domínio Principal</Label>
              <Input id="domain" placeholder="meusaas.com" value={platformDomain} onChange={e => setPlatformDomain(e.target.value)} className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">Subdomínios serão criados como criador.meusaas.com</p>
            </div>
            <div>
              <Label htmlFor="trial">Dias de Trial para novos criadores</Label>
              <Input id="trial" type="number" min={1} max={90} value={trialDays} onChange={e => setTrialDays(Number(e.target.value))} className="mt-1.5 w-24" />
            </div>
          </div>
        </GlassCard>

        {/* Security */}
        <GlassCard className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            Segurança & Acesso
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Novos cadastros de criadores</p>
                <p className="text-xs text-muted-foreground">Permitir que novos criadores se cadastrem</p>
              </div>
              <Switch checked={newSignupsEnabled} onCheckedChange={setNewSignupsEnabled} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Suspender trials expirados</p>
                <p className="text-xs text-muted-foreground">Suspender automaticamente plataformas com trial expirado</p>
              </div>
              <Switch checked={autoSuspendExpired} onCheckedChange={setAutoSuspendExpired} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Modo manutenção</p>
                <p className="text-xs text-muted-foreground">Bloquear acesso de todos os tenants temporariamente</p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
          </div>
        </GlassCard>

        {/* Notifications */}
        <GlassCard className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            Notificações
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Alerta de novo criador</p>
                <p className="text-xs text-muted-foreground">Receber notificação quando um criador se cadastrar</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Alerta de trial expirando</p>
                <p className="text-xs text-muted-foreground">Notificar 2 dias antes do trial expirar</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </GlassCard>

        <Button onClick={handleSave} className="w-full gap-2">
          <Save className="w-4 h-4" />
          Salvar Configurações
        </Button>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminConfiguracoes;
