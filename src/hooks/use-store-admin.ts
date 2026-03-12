import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StoreAdminAssignment {
  id: string;
  store_id: string;
  user_id: string;
  created_at: string;
  store?: {
    id: string;
    name: string;
    slug: string | null;
    status: string;
  };
}

export function useStoreAdmin() {
  const { user, session } = useAuth();

  const { data: assignment, isLoading } = useQuery({
    queryKey: ["store-admin-assignment", user?.id],
    queryFn: async (): Promise<StoreAdminAssignment | null> => {
      if (!user?.id || !session) return null;

      const { data, error } = await supabase
        .from("store_admins")
        .select("*, stores(id, name, slug, status)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching store admin assignment:", error);
        return null;
      }

      if (!data) return null;

      const storeData = (data as any).stores;
      return {
        id: data.id,
        store_id: data.store_id,
        user_id: data.user_id,
        created_at: data.created_at,
        store: storeData
          ? {
              id: storeData.id,
              name: storeData.name,
              slug: storeData.slug,
              status: storeData.status,
            }
          : undefined,
      };
    },
    enabled: !!user?.id && !!session,
    staleTime: 1000 * 60 * 5,
  });

  return {
    assignment,
    storeId: assignment?.store_id ?? null,
    storeName: assignment?.store?.name ?? null,
    storeSlug: assignment?.store?.slug ?? null,
    isLoading,
    hasStore: !!assignment,
  };
}
