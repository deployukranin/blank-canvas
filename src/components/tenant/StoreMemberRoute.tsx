import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useStoreMembership } from '@/hooks/use-store-membership';
import { useUserRole } from '@/hooks/use-user-role';
import { Button } from '@/components/ui/button';

/**
 * Guards member-only tenant areas. A user is only allowed in when they hold a
 * membership for THIS store — accounts created in another store are treated as
 * plain visitors (super admins keep global access for support).
 */
export const StoreMemberRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { basePath } = useTenant();
  const { isMember, isBanned, isLoading } = useStoreMembership();
  const { isSuperAdmin, isLoading: rolesLoading } = useUserRole();
  const location = useLocation();

  if (authLoading || isLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isMember || isSuperAdmin()) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center border border-border rounded-2xl p-8 bg-card">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">
          {isBanned ? t('storeAccess.banned') : t('storeAccess.title')}
        </h1>
        {!isBanned && (
          <p className="text-sm text-muted-foreground mb-6">{t('storeAccess.description')}</p>
        )}
        {!isBanned && (
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link to={`${basePath}/login`} state={{ from: location.pathname }}>
                {isAuthenticated ? t('storeAccess.joinCta') : t('storeAccess.cta')}
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to={basePath || '/'}>{t('storeAccess.browse')}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreMemberRoute;
