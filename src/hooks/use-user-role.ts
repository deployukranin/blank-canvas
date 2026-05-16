import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "moderator" | "user" | "ceo" | "super_admin" | "creator" | "client" | "partner";

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export function useUserRole() {
  const { user, session } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async (): Promise<UserRole[]> => {
      if (!user?.id || !session) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user roles:", error);
        return [];
      }

      return (data as UserRole[]) || [];
    },
    enabled: !!user?.id && !!session,
    staleTime: 1000 * 60 * 5,
  });

  const hasRole = (role: AppRole): boolean => {
    return roles.some((r) => r.role === role);
  };

  const isAdmin = (): boolean => hasRole("admin");
  const isCEO = (): boolean => hasRole("ceo");
  const isModerator = (): boolean => hasRole("moderator");
  const isSuperAdmin = (): boolean => hasRole("super_admin");
  const isCreator = (): boolean => hasRole("creator");
  const isClient = (): boolean => hasRole("client");
  const isStaff = (): boolean => isAdmin() || isCEO() || isModerator() || isSuperAdmin();

  return {
    roles,
    isLoading,
    hasRole,
    isAdmin,
    isCEO,
    isModerator,
    isSuperAdmin,
    isCreator,
    isClient,
    isStaff,
  };
}
