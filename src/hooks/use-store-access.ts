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
  storeCreatedBy?: string | null;
  enabled?: boolean;
}) {
  const { storeId, userId, storeCreatedBy, enabled = true } = params;

  const isOwner = !!storeId && !!userId && storeCreatedBy === userId;

  const query = useQuery({
    queryKey: ["store-access", storeId, userId],
    enabled: enabled && !!storeId && !!userId && !isOwner,
    staleTime: 1000 * 60 * 10, // 10 min
    gcTime: 1000 * 60 * 30,
    queryFn: async (): Promise<boolean> => {
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
  if (isOwner) {
    return { hasAccess: true, isLoading: false } as const;
  }
  return {
    hasAccess: !!query.data,
    isLoading: query.isLoading,
  } as const;
}
