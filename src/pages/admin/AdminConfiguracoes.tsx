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
import { useTranslation } from 'react-i18next';

const AdminConfiguracoes: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    publicIdeas: true,
    requireApprovalForIdeas: false,
  });

  const handleSave = () => {
    toast({
      title: t('admin.settings.saved', 'Settings saved!'),
      description: t('admin.settings.savedDesc', 'Changes applied successfully.'),
    });
  };

  return (
    <AdminLayout title={t('admin.settings.title', 'Settings')}>
      <div className="space-y-6 max-w-2xl">
        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t('admin.settings.notifications', 'Notifications')}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('admin.settings.emailNotifications', 'Email Notifications')}</Label>
                  <p className="text-sm text-muted-foreground">{t('admin.settings.emailNotificationsDesc', 'Receive alerts for new orders')}</p>
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t('admin.settings.contentSettings', 'Content Settings')}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('admin.settings.publicIdeas', 'Public Ideas')}</Label>
                  <p className="text-sm text-muted-foreground">{t('admin.settings.publicIdeasDesc', 'Allow visitors to see ideas')}</p>
                </div>
                <Switch
                  checked={settings.publicIdeas}
                  onCheckedChange={(checked) => setSettings({ ...settings, publicIdeas: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('admin.settings.approveIdeas', 'Approve Ideas')}</Label>
                  <p className="text-sm text-muted-foreground">{t('admin.settings.approveIdeasDesc', 'Ideas need approval before showing')}</p>
                </div>
                <Switch
                  checked={settings.requireApprovalForIdeas}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireApprovalForIdeas: checked })}
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            {t('admin.settings.save', 'Save Settings')}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminConfiguracoes;
