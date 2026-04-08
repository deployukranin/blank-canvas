const LOVABLE_PUBLISHED_ORIGIN = "https://cozy-corner-seed.lovable.app";
const LOVABLE_DOMAINS = [".lovable.app", ".lovableproject.com"];
const CUSTOM_DOMAIN_REDIRECT_URI = "https://www.mytinglebox.com/";

function isCustomDomain(): boolean {
  const hostname = window.location.hostname;
  return !LOVABLE_DOMAINS.some((d) => hostname.endsWith(d)) && hostname !== "localhost";
}

function getRedirectUri(): string {
  if (isCustomDomain()) {
    return CUSTOM_DOMAIN_REDIRECT_URI;
  }

  const currentUrl = new URL(window.location.href);
  currentUrl.hash = "";
  return currentUrl.toString();
}

export async function signInWithGoogle(): Promise<{ error?: Error; redirected?: boolean }> {
  if (isCustomDomain()) {
    // Custom domains don't have /~oauth routes.
    // Redirect OAuth initiation through the published lovable.app domain,
    // but set redirect_uri to the current custom-domain page so user comes back here.
    const customRedirectUri = getRedirectUri();
    const state = crypto.randomUUID().replace(/-/g, "");
    const initiateUrl =
      `${LOVABLE_PUBLISHED_ORIGIN}/~oauth/initiate?provider=google` +
      `&redirect_uri=${encodeURIComponent(customRedirectUri)}` +
      `&state=${state}`;
    window.location.href = initiateUrl;
    return { redirected: true };
  }

  // On lovable.app domains, use the managed OAuth flow
  const { lovable } = await import("@/integrations/lovable");
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: getRedirectUri(),
  });
}
