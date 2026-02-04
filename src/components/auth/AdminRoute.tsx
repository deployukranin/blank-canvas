import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hasAdminSession, getAdminSessionInfo } from "@/lib/admin-session";

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'ceo';
}

export const AdminRoute = ({ children, requiredRole = 'admin' }: AdminRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      // First check for admin session token (from admin_credentials login)
      if (hasAdminSession()) {
        const adminInfo = getAdminSessionInfo();
        if (adminInfo) {
          let hasAccess = false;
          
          if (requiredRole === 'ceo') {
            hasAccess = adminInfo.role === 'ceo';
          } else {
            // For admin routes, both admin and ceo have access
            hasAccess = ['admin', 'ceo'].includes(adminInfo.role);
          }
          
          setIsAuthorized(hasAccess);
          
          if (!hasAccess) {
            toast({
              variant: "destructive",
              title: "Acesso Negado",
              description: `Você precisa de permissão de ${requiredRole.toUpperCase()} para acessar esta área.`
            });
          }
          
          setLoading(false);
          return;
        }
      }

      // Then check for Supabase session with user_roles
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      // Query user_roles table for RBAC
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (error) {
        console.error("Erro ao verificar roles:", error);
        setLoading(false);
        return;
      }

      const userRoles = roles?.map(r => r.role) || [];

      // Access rules
      let hasAccess = false;

      if (requiredRole === 'ceo') {
        hasAccess = userRoles.includes('ceo');
      } else {
        // For admin routes, accept admin or ceo
        hasAccess = userRoles.some(r => ['admin', 'ceo'].includes(r));
      }

      setIsAuthorized(hasAccess);

      if (!hasAccess) {
        toast({
          variant: "destructive",
          title: "Acesso Negado",
          description: `Você precisa de permissão de ${requiredRole.toUpperCase()} para acessar esta área.`
        });
      }

    } catch (error) {
      console.error("Erro de autorização:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};