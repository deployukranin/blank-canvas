import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/use-user-role';
import { Forbidden } from './Forbidden';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children }) => {
  const { session, isLoading: authLoading } = useAuth();
  const { isSuperAdmin, isLoading: rolesLoading } = useUserRole();
  const location = useLocation();

  if (authLoading || (session && rolesLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Verificando acesso...</div>
      </div>
    );
  }

  // Not logged in → send to super admin login
  if (!session) {
    return <Navigate to="/admin-master/login" state={{ from: location.pathname }} replace />;
  }

  // Logged in but not a super admin → explicit 403
  if (!isSuperAdmin()) {
    return (
      <Forbidden
        message="Esta área é restrita ao Super Admin da plataforma."
        homeHref="/"
      />
    );
  }

  return <>{children}</>;
};
