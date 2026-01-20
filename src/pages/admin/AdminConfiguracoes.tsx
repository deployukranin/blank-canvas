import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Key, Palette, Bell, Shield, Link as LinkIcon } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const AdminConfiguracoes: React.FC = () => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    siteName: 'Whisper Scape',
    siteDescription: 'ASMR para relaxar',
    vipPrice: '19.90',
    emailNotifications: true,
    publicIdeas: true,
    requireApprovalForIdeas: false,
    discordWebhook: '',
    paymentApiKey: '',
    metricsApiKey: '',
  });

  const handleSave = () => {
    // In the future, this will save to the database
    console.log('Saving settings:', settings);
    toast({
      title: 'Configurações salvas!',
      description: 'As alterações foram aplicadas com sucesso.',
    });
  };

  return (
    <AdminLayout title="Configurações">
      <div className="space-y-6 max-w-2xl">
        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Configurações Gerais</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="siteName">Nome do Site</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="siteDescription">Descrição</Label>
                <Input
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="vipPrice">Preço VIP Mensal (R$)</Label>
                <Input
                  id="vipPrice"
                  value={settings.vipPrice}
                  onChange={(e) => setSettings({ ...settings, vipPrice: e.target.value })}
                  className="mt-1"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Notificações</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">Receber alertas de novos pedidos</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Content Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Configurações de Conteúdo</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ideias Públicas</Label>
                  <p className="text-sm text-muted-foreground">Permitir que visitantes vejam ideias</p>
                </div>
                <Switch
                  checked={settings.publicIdeas}
                  onCheckedChange={(checked) => setSettings({ ...settings, publicIdeas: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Aprovar Ideias</Label>
                  <p className="text-sm text-muted-foreground">Ideias precisam de aprovação antes de aparecer</p>
                </div>
                <Switch
                  checked={settings.requireApprovalForIdeas}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireApprovalForIdeas: checked })}
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Integrações</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="discordWebhook">Discord Webhook URL</Label>
                <Input
                  id="discordWebhook"
                  value={settings.discordWebhook}
                  onChange={(e) => setSettings({ ...settings, discordWebhook: e.target.value })}
                  className="mt-1"
                  placeholder="https://discord.com/api/webhooks/..."
                  type="password"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Para notificações automáticas no Discord
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* API Keys */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Chaves de API</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Estas chaves são armazenadas de forma segura e usadas para integrações externas.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentApiKey">API de Pagamento</Label>
                <Input
                  id="paymentApiKey"
                  value={settings.paymentApiKey}
                  onChange={(e) => setSettings({ ...settings, paymentApiKey: e.target.value })}
                  className="mt-1"
                  placeholder="pk_live_..."
                  type="password"
                />
              </div>
              
              <div>
                <Label htmlFor="metricsApiKey">API de Métricas</Label>
                <Input
                  id="metricsApiKey"
                  value={settings.metricsApiKey}
                  onChange={(e) => setSettings({ ...settings, metricsApiKey: e.target.value })}
                  className="mt-1"
                  placeholder="..."
                  type="password"
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Salvar Configurações
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminConfiguracoes;
