import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/use-user-role';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children }) => {
  const { session, isLoading: authLoading } = useAuth();
  const { isSuperAdmin, isLoading: rolesLoading } = useUserRole();

  if (authLoading || (session && rolesLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Verificando acesso...</div>
      </div>
    );
  }

  if (!session || !isSuperAdmin()) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
