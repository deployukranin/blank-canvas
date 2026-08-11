/**
 * Signed, short-lived state for the Stripe Connect OAuth handshake.
 *
 * The state travels through Stripe (untrusted round-trip), so it is HMAC-signed
 * with a server-only secret and carries its own expiry. No DB row needed.
 */

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function key(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export interface StripeOAuthState {
  store_id: string;
  user_id: string;
  return_url: string;
  exp: number;
}

export async function signState(
  payload: Omit<StripeOAuthState, "exp">,
  secret: string,
  ttlSeconds = 600,
): Promise<string> {
  const body: StripeOAuthState = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const data = b64url(encoder.encode(JSON.stringify(body)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(secret), encoder.encode(data)));
  return `${data}.${b64url(sig)}`;
}

export async function verifyState(token: string, secret: string): Promise<StripeOAuthState | null> {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const ok = await crypto.subtle.verify("HMAC", await key(secret), fromB64url(sig), encoder.encode(data));
  if (!ok) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(fromB64url(data))) as StripeOAuthState;
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Only our own app hosts may be used as a post-OAuth landing page. */
export function isAllowedReturnUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return false;
    const host = u.hostname;
    return (
      host === "mytinglebox.com" ||
      host === "www.mytinglebox.com" ||
      host.endsWith(".lovable.app")
    );
  } catch {
    return false;
  }
}
