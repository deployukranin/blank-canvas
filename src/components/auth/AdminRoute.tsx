import { useEffect, useMemo, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'ceo';
}

export const AdminRoute = ({ children, requiredRole = 'admin' }: AdminRouteProps) => {
  const { session, isLoading: authLoading } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRole();
  const { toast } = useToast();
  const hasShownToast = useRef(false);

  const userRoles = useMemo(() => roles.map((r) => r.role), [roles]);

  const isAuthorized = useMemo(() => {
    if (!session) return false;

    if (requiredRole === "ceo") {
      return userRoles.includes("ceo");
    }

    return userRoles.some((r) => r === "admin" || r === "ceo");
  }, [requiredRole, session, userRoles]);

  useEffect(() => {
    // Evita spam de toast durante re-renders/carregamento
    if (hasShownToast.current) return;
    if (authLoading) return;
    if (!session) return;
    if (rolesLoading) return;
    if (isAuthorized) return;

    hasShownToast.current = true;
    toast({
      variant: "destructive",
      title: "Acesso Negado",
      description: `Você precisa de permissão de ${requiredRole.toUpperCase()} para acessar esta área.`,
    });
  }, [authLoading, isAuthorized, requiredRole, rolesLoading, session, toast]);

  // 1) Espera o AuthContext terminar (evita redirect antes da sessão estar pronta)
  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // 2) Sem sessão => login
  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  // 3) Sessão ok, mas roles ainda carregando
  if (rolesLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return <Navigate to="/admin/login" replace />;

  return <>{children}</>;
};
