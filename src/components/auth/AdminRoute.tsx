import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Forbidden } from "./Forbidden";

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "ceo";
}

export const AdminRoute = ({ children, requiredRole = "admin" }: AdminRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isLoading: isLoadingRoles, isAdmin, isCEO, isSuperAdmin, isCreator } = useUserRole();
  const location = useLocation();

  const hasAdminAccess = isAdmin() || isCEO() || isSuperAdmin() || isCreator();
  const hasCeoAccess = isCEO() || isSuperAdmin();

  if (isLoading || isLoadingRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to login, preserving target
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole === "ceo" && !hasCeoAccess) {
    return (
      <Forbidden message="Esta área é restrita a administradores com nível CEO." />
    );
  }

  if (requiredRole === "admin" && !hasAdminAccess) {
    return (
      <Forbidden message="Esta área é restrita a administradores (admin, creator, CEO ou super admin)." />
    );
  }

  return <>{children}</>;
};
