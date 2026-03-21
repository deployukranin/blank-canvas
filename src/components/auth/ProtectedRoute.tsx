import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to store auth if within a store, otherwise root auth
      const authPath = slug ? `/${slug}/auth` : "/auth";
      navigate(authPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
