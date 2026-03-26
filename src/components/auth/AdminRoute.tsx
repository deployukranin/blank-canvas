import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "ceo";
}

export const AdminRoute = ({ children, requiredRole = "admin" }: AdminRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isLoading: isLoadingRoles, isAdmin, isCEO, isSuperAdmin, isCreator } = useUserRole();

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
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole === "ceo" && !hasCeoAccess) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === "admin" && !hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
