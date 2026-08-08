import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";

/**
 * Ensures the authenticated user is registered as a member of the current store.
 * Runs on every tenant page (not only on the login form), so users that confirm
 * their email and land directly on the storefront still show up in /admin/users.
 */
export function useStoreMembership() {
  const { user } = useAuth();
  const { store } = useTenant();
  const doneRef = useRef<string | null>(null);

  useEffect(() => {
    const storeId = store?.id;
    const userId = user?.id;
    if (!storeId || !userId) return;

    const key = `${storeId}:${userId}`;
    if (doneRef.current === key) return;
    doneRef.current = key;

    (async () => {
      try {
        const { data: existing } = await supabase
          .from("store_users")
          .select("id")
          .eq("store_id", storeId)
          .eq("user_id", userId)
          .maybeSingle();

        if (!existing) {
          await supabase
            .from("store_users")
            .insert({ store_id: storeId, user_id: userId });
          await supabase.rpc("assign_client_role" as any, { p_store_id: storeId });
        }
      } catch {
        // membership registration is best-effort
      }
    })();
  }, [store?.id, user?.id]);
}
