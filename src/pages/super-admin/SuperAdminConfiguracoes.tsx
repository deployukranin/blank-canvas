import React, { useState, useEffect } from 'react';
import { Shield, Globe, Bell, Save, Loader2 } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { loadConfig, saveConfig } from '@/lib/config-storage';

interface PlatformSettings {
  platformName: string;
  platformDomain: string;
  trialDays: number;
  autoSuspendExpired: boolean;
  newSignupsEnabled: boolean;
  maintenanceMode: boolean;
  alertNewCreator: boolean;
  alertTrialExpiring: boolean;
}

const defaults: PlatformSettings = {
  platformName: 'WhisperScape',
  platformDomain: '',
  trialDays: 7,
  autoSuspendExpired: false,
  newSignupsEnabled: true,
  maintenanceMode: false,
  alertNewCreator: true,
  alertTrialExpiring: true,
};

const SuperAdminConfiguracoes: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<PlatformSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await loadConfig<PlatformSettings>('platform_settings');
      if (data) setSettings({ ...defaults, ...data });
      setLoading(false);
    })();
  }, []);

  const update = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveConfig('platform_settings', settings);
    setSaving(false);
    if (ok) toast.success(t('superAdmin.settingsSaved'));
    else toast.error('Erro ao salvar configurações');
  };

  if (loading) {
    return (
      <SuperAdminLayout title={t('superAdmin.settings')}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title={t('superAdmin.settings')}>
      <div className="space-y-6 max-w-2xl">
        <GlassCard className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            {t('superAdmin.platformSettings')}
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('superAdmin.saasName')}</Label>
              <Input id="name" value={settings.platformName} onChange={e => update('platformName', e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="domain">{t('superAdmin.mainDomain')}</Label>
              <Input id="domain" placeholder="mysaas.com" value={settings.platformDomain} onChange={e => update('platformDomain', e.target.value)} className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{t('superAdmin.subdomainHint')}</p>
            </div>
            <div>
              <Label htmlFor="trial">{t('superAdmin.trialDays')}</Label>
              <Input id="trial" type="number" min={1} max={90} value={settings.trialDays} onChange={e => update('trialDays', Number(e.target.value))} className="mt-1.5 w-24" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            {t('superAdmin.securityAccess')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('superAdmin.newCreatorSignups')}</p>
                <p className="text-xs text-muted-foreground">{t('superAdmin.allowNewCreators')}</p>
              </div>
              <Switch checked={settings.newSignupsEnabled} onCheckedChange={v => update('newSignupsEnabled', v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('superAdmin.autoSuspendTrials')}</p>
                <p className="text-xs text-muted-foreground">{t('superAdmin.autoSuspendDesc')}</p>
              </div>
              <Switch checked={settings.autoSuspendExpired} onCheckedChange={v => update('autoSuspendExpired', v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('superAdmin.maintenanceMode')}</p>
                <p className="text-xs text-muted-foreground">{t('superAdmin.maintenanceDesc')}</p>
              </div>
              <Switch checked={settings.maintenanceMode} onCheckedChange={v => update('maintenanceMode', v)} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            {t('superAdmin.notificationsTitle')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('superAdmin.newCreatorAlert')}</p>
                <p className="text-xs text-muted-foreground">{t('superAdmin.newCreatorAlertDesc')}</p>
              </div>
              <Switch checked={settings.alertNewCreator} onCheckedChange={v => update('alertNewCreator', v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('superAdmin.trialExpiringAlert')}</p>
                <p className="text-xs text-muted-foreground">{t('superAdmin.trialExpiringAlertDesc')}</p>
              </div>
              <Switch checked={settings.alertTrialExpiring} onCheckedChange={v => update('alertTrialExpiring', v)} />
            </div>
          </div>
        </GlassCard>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('superAdmin.saveSettings')}
        </Button>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminConfiguracoes;
