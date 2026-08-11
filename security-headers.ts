/**
 * Single source of truth for the HTTP security headers.
 *
 * Applied by the Edge Middleware to every HTML navigation and to the /media
 * proxy. The equivalent block in vercel.json covers static assets and any
 * response that does not pass through the middleware.
 */

const SUPABASE_ORIGIN = 'https://lkwvlzcapuptcxvwukcm.supabase.co';
const SUPABASE_WS = 'wss://lkwvlzcapuptcxvwukcm.supabase.co';

/** Explicit allowlist — no host wildcards. */
export const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com https://connect.stripe.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' https://js.stripe.com https://www.youtube.com https://s.ytimg.com",
  "script-src-attr 'none'",
  // 'unsafe-inline' is required by the SSR theme <style> tag and by Radix/shadcn
  // inline style attributes. Removing it breaks theming and layout.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: ${SUPABASE_ORIGIN} https://i.ytimg.com https://img.youtube.com https://q.stripe.com https://files.stripe.com https://lh3.googleusercontent.com https://drive.google.com`,
  `media-src 'self' blob: ${SUPABASE_ORIGIN} https://www.youtube.com`,
  `connect-src 'self' ${SUPABASE_ORIGIN} ${SUPABASE_WS} https://api.stripe.com https://api.openpix.com.br https://www.googleapis.com https://i.ytimg.com https://img.youtube.com https://fonts.gstatic.com`,
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://connect.stripe.com https://www.youtube.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "manifest-src 'self' blob:",
  'upgrade-insecure-requests',
  `report-uri ${SUPABASE_ORIGIN}/functions/v1/csp-report`,
  'report-to csp-endpoint',
].join('; ');

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP,
  'Reporting-Endpoints': `csp-endpoint="${SUPABASE_ORIGIN}/functions/v1/csp-report"`,
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com"), interest-cohort=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
  'Origin-Agent-Cluster': '?1',
  'X-DNS-Prefetch-Control': 'off',
  // Legacy fallback only — frame-ancestors above is the primary control.
  'X-Frame-Options': 'SAMEORIGIN',
};

/** Mutates and returns the given Headers with the full security header set. */
export function applySecurityHeaders(headers: Headers): Headers {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return headers;
}
