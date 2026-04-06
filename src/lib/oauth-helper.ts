import { lovable } from "@/integrations/lovable";

export async function signInWithGoogle(): Promise<{ error?: Error; redirected?: boolean }> {
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
}

