import { useEffect, useMemo, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { useStoreAdmin } from "@/hooks/use-store-admin";

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'ceo';
}

export const AdminRoute = ({ children, requiredRole = 'admin' }: AdminRouteProps) => {
  const { session, isLoading: authLoading } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRole();
  const { hasStore, isLoading: storeLoading } = useStoreAdmin();
  const { toast } = useToast();
  const hasShownToast = useRef(false);

  const userRoles = useMemo(() => roles.map((r) => r.role), [roles]);

  const isAuthorized = useMemo(() => {
    if (!session) return false;

    if (requiredRole === "ceo") {
      return userRoles.includes("ceo");
    }

    // Admin precisa ter role admin/ceo E estar vinculado a uma loja
    const isStaff = userRoles.some((r) => r === "admin" || r === "ceo");
    if (!isStaff) return false;

    // CEOs têm acesso a tudo, admins precisam de loja vinculada
    if (userRoles.includes("ceo")) return true;
    return hasStore;
  }, [requiredRole, session, userRoles, hasStore]);

  const isStillLoading = authLoading || (session && (rolesLoading || storeLoading));

  useEffect(() => {
    if (hasShownToast.current) return;
    if (isStillLoading) return;
    if (!session) return;
    if (isAuthorized) return;

    hasShownToast.current = true;

    const isStaff = userRoles.some((r) => r === "admin" || r === "ceo");
    const message = !isStaff
      ? `Você precisa de permissão de ${requiredRole.toUpperCase()} para acessar esta área.`
      : "Sua conta não está vinculada a nenhuma loja. Solicite acesso ao CEO.";

    toast({
      variant: "destructive",
      title: "Acesso Negado",
      description: message,
    });
  }, [isStillLoading, isAuthorized, requiredRole, session, toast, userRoles]);

  if (isStillLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAuthorized) return <Navigate to="/admin/login" replace />;

  return <>{children}</>;
};
