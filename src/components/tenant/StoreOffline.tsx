import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const StoreOffline = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.trial.offlineTitle')}</h1>
        <p className="text-muted-foreground">{t('admin.trial.offlineDesc')}</p>
      </div>
    </div>
  );
};
