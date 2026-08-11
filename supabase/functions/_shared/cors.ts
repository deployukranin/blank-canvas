/**
 * CORS for private endpoints (admin panels, super admin, partner and store
 * management). These are only ever called from our own front-end, so the
 * browser Origin is restricted to the official domains instead of "*".
 *
 * CORS is NOT an authentication mechanism — every one of these functions still
 * validates the JWT and the caller's role/ownership server-side. This only
 * removes the ability of a random third-party page to make credentialed
 * cross-origin calls on behalf of a logged-in admin.
 *
 * Public endpoints (webhooks, tracking pixels, storefront reads) keep "*".
 */

const ALLOWED_SUFFIXES = [
  "mytinglebox.com",
  "lovable.app",
  "lovableproject.com",
  "lovable.dev",
];

const ALLOWED_LOCAL = ["localhost", "127.0.0.1"];

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname;
    if (ALLOWED_LOCAL.includes(host)) return true;
    return ALLOWED_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));
  } catch {
    return false;
  }
}

const BASE_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

/**
 * Returns CORS headers for a request. Unknown origins get no
 * Access-Control-Allow-Origin, so the browser blocks the response.
 */
export function privateCors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  if (isAllowedOrigin(origin)) {
    return { ...BASE_HEADERS, "Access-Control-Allow-Origin": origin! };
  }
  // Non-browser callers (curl, server-to-server) send no Origin and are
  // unaffected: they never enforce CORS.
  return { ...BASE_HEADERS };
}
