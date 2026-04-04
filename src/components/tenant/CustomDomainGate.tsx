import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import NotFound from '@/pages/NotFound';

/**
 * Gate component for routes that only work on custom domains (slug-free URLs).
 * On platform hosts, these routes would conflict with reserved routes,
 * so we fall through to NotFound.
 */
const CustomDomainGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCustomDomain, store, isLoading, error } = useTenant();

  // On platform hosts, these slug-free tenant routes don't apply
  if (!isCustomDomain) {
    return null; // Let React Router try other routes
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !store) {
    return <NotFound />;
  }

  return <>{children}</>;
};

export default CustomDomainGate;
