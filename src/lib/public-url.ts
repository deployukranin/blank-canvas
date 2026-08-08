// Canonical public domain for all shareable links.
// Never share Lovable preview/sandbox URLs with users or clients.
export const PUBLIC_ORIGIN = 'https://mytinglebox.com';

const INTERNAL_HOST_PATTERNS = [
  'lovableproject.com',
  'lovable.app',
  'lovable.dev',
  'localhost',
  '127.0.0.1',
];

/** Returns the origin that should be used when building links shared outside the app. */
export const getPublicOrigin = (): string => {
  if (typeof window === 'undefined') return PUBLIC_ORIGIN;
  const host = window.location.hostname;
  if (INTERNAL_HOST_PATTERNS.some((p) => host.includes(p))) return PUBLIC_ORIGIN;
  return window.location.origin;
};

/** Builds an absolute public URL from a path (e.g. "/slug"). */
export const publicUrl = (path = ''): string => {
  const suffix = path && !path.startsWith('/') ? `/${path}` : path;
  return `${getPublicOrigin()}${suffix}`;
};
