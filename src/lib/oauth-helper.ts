import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const LOVABLE_DOMAINS = [".lovable.app", ".lovableproject.com"];

function isCustomDomain(): boolean {
  const hostname = window.location.hostname;
  return !LOVABLE_DOMAINS.some((d) => hostname.endsWith(d)) && hostname !== "localhost";
}

export async function signInWithGoogle(): Promise<{ error?: Error; redirected?: boolean }> {
  if (isCustomDomain()) {
    // Custom domains don't have /~oauth routes — use Supabase OAuth directly
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) return { error };
    return { redirected: true };
  }

  // On lovable.app domains, use the managed OAuth flow
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  return result;
}
