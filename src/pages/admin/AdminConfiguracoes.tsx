import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Bell, Shield } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const AdminConfiguracoes: React.FC = () => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    publicIdeas: true,
    requireApprovalForIdeas: false,
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
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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
