import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { useTenant } from "@/contexts/TenantContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Forbidden } from "./Forbidden";
import { supabase } from "@/integrations/supabase/client";

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "ceo";
}

export const AdminRoute = ({ children, requiredRole = "admin" }: AdminRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isLoading: isLoadingRoles, isAdmin, isCEO, isSuperAdmin, isCreator } = useUserRole();
  const { store, isLoading: isLoadingTenant, isTenantScope } = useTenant();
  const location = useLocation();

  const hasGlobalAdminRole = isAdmin() || isCEO() || isSuperAdmin() || isCreator();
  const hasCeoAccess = isCEO() || isSuperAdmin();
  const isSuper = isSuperAdmin();

  // Check store ownership for tenant-scoped admin routes
  const [isStoreOwner, setIsStoreOwner] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!isTenantScope || !store?.id || !user?.id) {
        setIsStoreOwner(null);
        return;
      }
      // Owner of the store
      if (store.created_by === user.id) {
        setIsStoreOwner(true);
        return;
      }
      // Or assigned as a store admin
      const { data, error } = await supabase
        .from("store_admins")
        .select("id")
        .eq("store_id", store.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setIsStoreOwner(false);
        return;
      }
      setIsStoreOwner(!!data);
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [isTenantScope, store?.id, store?.created_by, user?.id]);

  if (isLoading || isLoadingRoles || (isTenantScope && (isLoadingTenant || isStoreOwner === null))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
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
