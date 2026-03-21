import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { supabase } from "@/integrations/supabase/client";

/**
 * Smart redirect for /:
 * - Not logged in → /auth
 * - CEO → /ceo
 * - Admin (store owner) → /:slug (store home)
 * - Normal user → /admin (dashboard)
 */
const HomeRedirect = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { isAdmin, isCEO, isLoading: rolesLoading } = useUserRole();
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (authLoading || rolesLoading) return;

    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
      return;
    }

    if (isCEO()) {
      navigate("/ceo", { replace: true });
      return;
    }

    if (isAdmin()) {
      // Find the admin's store slug
      const findStoreSlug = async () => {
        const { data } = await supabase
          .from("store_admins")
          .select("store_id, stores(slug)")
          .eq("user_id", user!.id)
          .limit(1)
          .single();

        if (data?.stores && typeof data.stores === "object" && "slug" in data.stores) {
          navigate(`/${(data.stores as { slug: string }).slug}`, { replace: true });
        } else {
          navigate("/admin", { replace: true });
        }
        setResolving(false);
      };
      findStoreSlug();
      return;
    }

    // Normal user — go to admin dashboard
    navigate("/admin", { replace: true });
  }, [authLoading, rolesLoading, isAuthenticated, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default HomeRedirect;
