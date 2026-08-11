/**
 * Shared server-side rate limiting.
 *
 * Backed by the `check_rate_limit` database function (persisted in the
 * `rate_limits` table), so the limit holds across serverless instances —
 * an in-memory counter would be useless on this infrastructure.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/** Stable, non-reversible identifier for an IP address. */
export async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}|tinglebox-salt`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/** Best-effort client identifier derived from request headers only. */
export async function clientKey(req: Request): Promise<string> {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  return ip ? await hashIp(ip) : "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  retry_after_seconds?: number;
}

/**
 * Consumes one unit from the (identifier, endpoint) bucket.
 * Fails open when the database is unreachable so a transient outage
 * never takes a public page down.
 */
export async function rateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number,
): Promise<RateLimitResult> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_rate_limit`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_identifier: identifier,
        p_endpoint: endpoint,
        p_max_requests: maxRequests,
        p_window_minutes: windowMinutes,
      }),
    });
    if (!r.ok) return { allowed: true };
    return (await r.json()) as RateLimitResult;
  } catch {
    return { allowed: true };
  }
}

/** 429 response helper with CORS headers merged in. */
export function tooManyRequests(
  corsHeaders: Record<string, string>,
  retryAfterSeconds?: number,
): Response {
  return new Response(
    JSON.stringify({ error: "rate_limited", retry_after_seconds: retryAfterSeconds ?? 60 }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds ?? 60),
      },
    },
  );
}
