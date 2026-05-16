import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { useTenant } from "@/contexts/TenantContext";
import { useStoreAccess } from "@/hooks/use-store-access";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Forbidden } from "./Forbidden";

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "ceo";
}

export const AdminRoute = ({ children, requiredRole = "admin" }: AdminRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isLoading: isLoadingRoles, isAdmin, isCEO, isSuperAdmin, isCreator } = useUserRole();
  const { store, isLoading: isLoadingTenant, isTenantScope, basePath } = useTenant();
  const location = useLocation();

  const hasGlobalAdminRole = isAdmin() || isCEO() || isSuperAdmin() || isCreator();
  const hasCeoAccess = isCEO() || isSuperAdmin();
  const isSuper = isSuperAdmin();

  const { hasAccess: isStoreOwner, isLoading: isCheckingAccess } = useStoreAccess({
    storeId: store?.id,
    userId: user?.id,
    storeCreatedBy: store?.created_by,
    enabled: isTenantScope && !isSuper,
  });

  if (
    isLoading ||
    isLoadingRoles ||
    (isTenantScope && (isLoadingTenant || (!isSuper && isCheckingAccess)))
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const authPath = isTenantScope ? `${basePath}/login` : "/auth";
    return <Navigate to={authPath} state={{ from: location.pathname }} replace />;
  }

  if (requiredRole === "ceo" && !hasCeoAccess) {
    return <Forbidden message="Esta área é restrita a administradores com nível CEO." />;
  }

  if (requiredRole === "admin" && !hasGlobalAdminRole) {
    return (
      <Forbidden message="Esta área é restrita a administradores (admin, creator, CEO ou super admin)." />
    );
  }

  // Tenant-scoped admin: must own/admin THIS store (super admin bypasses)
  if (isTenantScope && !isSuper && !isStoreOwner) {
    return (
      <Forbidden message="Você não tem permissão para acessar o painel desta loja." />
    );
  }

  return <>{children}</>;
};
