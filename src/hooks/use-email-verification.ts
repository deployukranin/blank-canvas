import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPublicOrigin } from "@/lib/public-url";

interface VerificationState {
  isLoading: boolean;
  authenticated: boolean;
  verified: boolean;
  email?: string;
}

/**
 * Email verification state for the signed-in user.
 * The account is usable right after signup — verification is tracked in the
 * profile and only gates a few sensitive actions.
 */
export const useEmailVerification = () => {
  const [state, setState] = useState<VerificationState>({
    isLoading: true,
    authenticated: false,
    verified: false,
  });

  const refresh = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      setState({ isLoading: false, authenticated: false, verified: false });
      return;
    }
    const { data } = await supabase.rpc("get_email_verification_status");
    const payload = (data ?? {}) as { verified?: boolean };
    setState({
      isLoading: false,
      authenticated: true,
      verified: !!payload.verified,
      email: session.user.email ?? undefined,
    });
  }, []);

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const sendVerificationEmail = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user?.email;
    if (!email) return { success: false, error: "not_authenticated" };

    const { data: marked } = await supabase.rpc("mark_email_verification_sent");
    const markedPayload = (marked ?? {}) as { success?: boolean; error?: string };
    if (!markedPayload.success) {
      return { success: false, error: markedPayload.error || "cooldown" };
    }

    const { data, error } = await supabase.functions.invoke("send-auth-email", {
      body: {
        type: "verify",
        email,
        redirect_to: `${getPublicOrigin()}/verify`,
      },
    });
    if (error) return { success: false, error: "send_failed" };
    if (!data?.success) return { success: false, error: data?.error || "send_failed" };
    return { success: true };
  }, []);

  const markVerified = useCallback(async () => {
    const { data } = await supabase.rpc("mark_email_verified");
    await refresh();
    return !!(data as { success?: boolean } | null)?.success;
  }, [refresh]);

  return { ...state, refresh, sendVerificationEmail, markVerified };
};

export default useEmailVerification;
