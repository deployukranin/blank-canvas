/**
 * Admin Session Management
 * 
 * Creates and validates session tokens for admin/CEO users
 * who log in via the validate-admin-login edge function.
 */

const ADMIN_TOKEN_KEY = 'admin_session_token';
const ADMIN_INFO_KEY = 'admin_session_info';

export interface AdminSessionInfo {
  email: string;
  role: 'admin' | 'ceo';
  createdAt: number;
}

/**
 * Generate an admin session token
 * This is called after successful admin login validation
 */
export async function createAdminSession(
  email: string,
  role: 'admin' | 'ceo',
  secret: string
): Promise<string> {
  const timestamp = Date.now();
  const payload = btoa(`${email}:${role}:${timestamp}`);
  
  // Create HMAC signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  
  const token = `${payload}.${signatureHex}`;
  
  // Store in sessionStorage
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  sessionStorage.setItem(ADMIN_INFO_KEY, JSON.stringify({
    email,
    role,
    createdAt: timestamp,
  }));
  
  return token;
}

/**
 * Get the current admin session token
 */
export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

/**
 * Get the current admin session info
 */
export function getAdminSessionInfo(): AdminSessionInfo | null {
  const info = sessionStorage.getItem(ADMIN_INFO_KEY);
  if (!info) return null;
  
  try {
    return JSON.parse(info) as AdminSessionInfo;
  } catch {
    return null;
  }
}

/**
 * Check if there's a valid admin session
 */
export function hasAdminSession(): boolean {
  const token = getAdminToken();
  const info = getAdminSessionInfo();
  
  if (!token || !info) return false;
  
  // Check if session is expired (24 hours)
  const maxAge = 24 * 60 * 60 * 1000;
  if (Date.now() - info.createdAt > maxAge) {
    clearAdminSession();
    return false;
  }
  
  return true;
}

/**
 * Clear the admin session
 */
export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_INFO_KEY);
}

/**
 * Check if current admin session has CEO role
 */
export function isAdminSessionCEO(): boolean {
  const info = getAdminSessionInfo();
  return info?.role === 'ceo';
}
