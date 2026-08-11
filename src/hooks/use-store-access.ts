import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks whether the given user is owner or assigned admin of the given store.
 * Result is cached per (storeId, userId) to avoid repeated DB calls while
 * navigating inside the admin panel.
 */
export function useStoreAccess(params: {
  storeId: string | null | undefined;
  userId: string | null | undefined;
  enabled?: boolean;
}) {
  const { storeId, userId, enabled = true } = params;

  const query = useQuery({
    queryKey: ["store-access", storeId, userId],
    enabled: enabled && !!storeId && !!userId,
    staleTime: 1000 * 60 * 10, // 10 min
    gcTime: 1000 * 60 * 30,
    queryFn: async (): Promise<boolean> => {
      // First check if the user is the store owner. This requires an
      // authenticated query against the stores table; the owner/admin policy
      // allows this read. Non-owners will get no data and fall through to the
      // store_admins check.
      const { data: ownerRow, error: ownerError } = await supabase
        .from("stores")
        .select("created_by")
        .eq("id", storeId!)
        .maybeSingle();

      if (!ownerError && ownerRow?.created_by === userId) {
        return true;
      }

      // Otherwise, check if the user is an assigned store admin.
      const { data, error } = await supabase
        .from("store_admins")
        .select("id")
        .eq("store_id", storeId!)
        .eq("user_id", userId!)
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
  });

  if (!storeId || !userId) {
    return { hasAccess: false, isLoading: false } as const;
  }
  return {
    hasAccess: !!query.data,
    isLoading: query.isLoading,
  } as const;
}
