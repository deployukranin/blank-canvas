import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Bell, Shield, Palette, Check } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useTranslation } from 'react-i18next';

interface ColorTemplate {
  id: string;
  label: string;
  primary: string;
  accent: string;
  mode: 'dark' | 'light';
  preview: string;
}

const darkTemplates: ColorTemplate[] = [
  { id: 'purple', label: 'Purple', primary: '263 70% 58%', accent: '263 50% 25%', mode: 'dark', preview: 'bg-purple-500' },
  { id: 'red', label: 'Red', primary: '0 72% 51%', accent: '0 50% 25%', mode: 'dark', preview: 'bg-red-500' },
  { id: 'green', label: 'Green', primary: '142 71% 45%', accent: '142 50% 22%', mode: 'dark', preview: 'bg-green-500' },
  { id: 'blue', label: 'Blue', primary: '217 91% 60%', accent: '217 50% 25%', mode: 'dark', preview: 'bg-blue-500' },
  { id: 'pink', label: 'Pink', primary: '330 81% 60%', accent: '330 50% 25%', mode: 'dark', preview: 'bg-pink-500' },
  { id: 'yellow', label: 'Yellow', primary: '45 93% 47%', accent: '45 50% 25%', mode: 'dark', preview: 'bg-yellow-500' },
];

const lightTemplates: ColorTemplate[] = [
  { id: 'light-purple', label: 'Purple', primary: '263 70% 55%', accent: '263 40% 92%', mode: 'light', preview: 'bg-purple-500' },
  { id: 'light-red', label: 'Red', primary: '0 72% 50%', accent: '0 40% 92%', mode: 'light', preview: 'bg-red-500' },
  { id: 'light-green', label: 'Green', primary: '142 71% 40%', accent: '142 40% 92%', mode: 'light', preview: 'bg-green-500' },
  { id: 'light-blue', label: 'Blue', primary: '217 91% 55%', accent: '217 40% 92%', mode: 'light', preview: 'bg-blue-500' },
  { id: 'light-pink', label: 'Pink', primary: '330 81% 55%', accent: '330 40% 92%', mode: 'light', preview: 'bg-pink-500' },
  { id: 'light-yellow', label: 'Yellow', primary: '45 93% 40%', accent: '45 40% 92%', mode: 'light', preview: 'bg-yellow-500' },
];

const allTemplates = [...darkTemplates, ...lightTemplates];

const AdminConfiguracoes: React.FC = () => {
  const { toast } = useToast();
  const { config, updateColors } = useWhiteLabel();
  const { t } = useTranslation();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    publicIdeas: true,
    requireApprovalForIdeas: false,
  });

  // Find currently active template
  const activeTemplate = allTemplates.find(
    (tmpl) => tmpl.primary === config.colors.primary && tmpl.mode === (config.colors.mode || 'dark')
  ) || allTemplates[0];

  const handleSelectTemplate = (template: ColorTemplate) => {
    updateColors({
      primary: template.primary,
      accent: template.accent,
      background: template.mode === 'light' ? '0 0% 98%' : '0 0% 4%',
      mode: template.mode,
    });
    toast({
      title: t('admin.settings.themeSaved', 'Theme updated!'),
      description: `${template.label} (${template.mode}) template applied.`,
    });
  };

  const handleSave = () => {
    toast({
      title: t('admin.settings.saved', 'Settings saved!'),
      description: t('admin.settings.savedDesc', 'Changes applied successfully.'),
    });
  };

  return (
    <AdminLayout title={t('admin.settings.title', 'Settings')}>
      <div className="space-y-6 max-w-2xl">
        {/* Color Templates */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t('admin.settings.colorTheme', 'Color Theme')}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              {t('admin.settings.colorThemeDesc', 'Choose a color template for your platform.')}
            </p>

            {/* Dark Templates */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dark</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
              {darkTemplates.map((template) => {
                const isActive = activeTemplate.id === template.id;
                return (
                  <button key={template.id} onClick={() => handleSelectTemplate(template)}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                      isActive ? 'border-primary bg-primary/10 scale-105' : 'border-border/50 hover:border-border hover:bg-card/50'
                    }`}>
                    <div className={`w-10 h-10 rounded-full ${template.preview} shadow-lg`}>
                      {isActive && (
                        <div className="w-full h-full rounded-full flex items-center justify-center bg-black/30">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-foreground/80">{template.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Light Templates */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Light</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {lightTemplates.map((template) => {
                const isActive = activeTemplate.id === template.id;
                return (
                  <button key={template.id} onClick={() => handleSelectTemplate(template)}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                      isActive ? 'border-primary bg-primary/10 scale-105' : 'border-border/50 hover:border-border hover:bg-card/50'
                    }`}>
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center">
                      <div className={`w-6 h-6 rounded-full ${template.preview}`}>
                        {isActive && (
                          <div className="w-full h-full rounded-full flex items-center justify-center bg-black/20">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-foreground/80">{template.label}</span>
                  </button>
                );
              })}
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
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

        {/* Save Button */}
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
