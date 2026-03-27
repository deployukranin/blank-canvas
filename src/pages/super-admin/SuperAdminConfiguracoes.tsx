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
import { useTranslation } from 'react-i18next';

const SuperAdminConfiguracoes: React.FC = () => {
  const { t } = useTranslation();
  const [platformName, setPlatformName] = useState('WhisperScape');
  const [platformDomain, setPlatformDomain] = useState('');
  const [trialDays, setTrialDays] = useState(7);
  const [autoSuspendExpired, setAutoSuspendExpired] = useState(false);
  const [newSignupsEnabled, setNewSignupsEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = () => {
    toast.success(t('superAdmin.settingsSaved'));
  };

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
              <Input id="name" value={platformName} onChange={e => setPlatformName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="domain">{t('superAdmin.mainDomain')}</Label>
              <Input id="domain" placeholder="mysaas.com" value={platformDomain} onChange={e => setPlatformDomain(e.target.value)} className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{t('superAdmin.subdomainHint')}</p>
            </div>
            <div>
              <Label htmlFor="trial">{t('superAdmin.trialDays')}</Label>
              <Input id="trial" type="number" min={1} max={90} value={trialDays} onChange={e => setTrialDays(Number(e.target.value))} className="mt-1.5 w-24" />
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
              <Switch checked={newSignupsEnabled} onCheckedChange={setNewSignupsEnabled} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('superAdmin.autoSuspendTrials')}</p>
                <p className="text-xs text-muted-foreground">{t('superAdmin.autoSuspendDesc')}</p>
              </div>
              <Switch checked={autoSuspendExpired} onCheckedChange={setAutoSuspendExpired} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('superAdmin.maintenanceMode')}</p>
                <p className="text-xs text-muted-foreground">{t('superAdmin.maintenanceDesc')}</p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
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
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('superAdmin.trialExpiringAlert')}</p>
                <p className="text-xs text-muted-foreground">{t('superAdmin.trialExpiringAlertDesc')}</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </GlassCard>

        <Button onClick={handleSave} className="w-full gap-2">
          <Save className="w-4 h-4" />
          {t('superAdmin.saveSettings')}
        </Button>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminConfiguracoes;