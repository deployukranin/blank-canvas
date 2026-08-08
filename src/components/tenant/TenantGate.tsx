import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreMembership } from '@/hooks/use-store-membership';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StoreOffline } from './StoreOffline';

interface TenantStoreNotFoundProps {
  slug: string;
}

const TenantStoreNotFound = ({ slug }: TenantStoreNotFoundProps) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-foreground mb-3">404</h1>
        <p className="text-muted-foreground mb-2">{t('admin.trial.notFoundDesc', { slug })}</p>
        <p className="text-sm text-muted-foreground">{t('admin.trial.notFoundHint')}</p>
      </div>
    </div>
  );
};


import { isTrialExpired } from '@/lib/trial';


/**
 * Wraps tenant-scoped pages. Shows loading/error states while resolving store.
 */
export const TenantGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug, store, isLoading, error } = useTenant();
  const { user } = useAuth();
  useStoreMembership();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !store) {
    return <TenantStoreNotFound slug={slug || ''} />;
  }

  // If trial expired, only allow store creator/admin through (for admin panel)
  if (isTrialExpired(store)) {
    const isStoreOwner = user?.id && store.created_by === user.id;
    if (!isStoreOwner) {
      return <StoreOffline />;
    }
  }

  return <>{children}</>;
};
