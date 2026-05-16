import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/use-user-role';
import { Forbidden } from './Forbidden';

interface PartnerRouteProps { children: React.ReactNode }

export const PartnerRoute: React.FC<PartnerRouteProps> = ({ children }) => {
  const { session, isLoading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRole();
  const location = useLocation();

  if (authLoading || (session && rolesLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Verificando acesso...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin-master/login" state={{ from: location.pathname }} replace />;
  }

  if (!hasRole('partner')) {
    return <Forbidden message="Esta área é restrita aos Parceiros da plataforma." homeHref="/" />;
  }

  return <>{children}</>;
};
