import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";

export interface StoreMembershipStatus {
  isMember: boolean;
  isBanned: boolean;
  isLoading: boolean;
}

/**
 * Reads (never creates) the membership of the authenticated user in the current
 * store. Memberships are only created when the user actually signs in / signs up
 * through that store's own login page, so visiting another store never links the
 * account to it.
 */
export function useStoreMembership(): StoreMembershipStatus {
  const { user } = useAuth();
  const { store } = useTenant();
  const [status, setStatus] = useState<StoreMembershipStatus>({
    isMember: false,
    isBanned: false,
    isLoading: true,
  });
  const profileRef = useRef<string | null>(null);

  useEffect(() => {
    const storeId = store?.id;
    const userId = user?.id;

    if (!storeId || !userId) {
      setStatus({ isMember: false, isBanned: false, isLoading: false });
      return;
    }

    let cancelled = false;
    setStatus((prev) => ({ ...prev, isLoading: true }));

    (async () => {
      try {
        const { data } = await supabase
          .from("store_users")
          .select("id, banned_at")
          .eq("store_id", storeId)
          .eq("user_id", userId)
          .maybeSingle();

        if (cancelled) return;

        const isMember = !!data && !data.banned_at;
        setStatus({ isMember, isBanned: !!data?.banned_at, isLoading: false });

        // Members should always have a profile row so they show up with a name
        // in the store admin panel.
        if (isMember && profileRef.current !== userId) {
          profileRef.current = userId;
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (!profile) {
            const fallbackName = (user?.email || "").split("@")[0] || null;
            await supabase
              .from("profiles")
              .insert({ user_id: userId, display_name: fallbackName });
          }
        }
      } catch {
        if (!cancelled) setStatus({ isMember: false, isBanned: false, isLoading: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [store?.id, user?.id, user?.email]);

  return status;
}
