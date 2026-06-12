import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/use-user-role';
import { Forbidden } from './Forbidden';

interface AdminMasterRouteProps {
  children: React.ReactNode;
}

/**
 * Guards /admin-master (the dashboard home). Accepts Super Admins AND Trackers.
 * Other /admin-master/* sub-routes remain Super Admin only via SuperAdminRoute.
 */
export const AdminMasterRoute: React.FC<AdminMasterRouteProps> = ({ children }) => {
  const { session, isLoading: authLoading } = useAuth();
  const { isSuperAdmin, isTracker, isLoading: rolesLoading } = useUserRole();
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

  if (!isSuperAdmin() && !isTracker()) {
    return (
      <Forbidden
        message="Esta área é restrita aos administradores da plataforma."
        homeHref="/"
      />
    );
  }

  return <>{children}</>;
};
