/**
 * Trial time helpers.
 *
 * The backend stores `plan_expires_at` as an absolute instant, but depending on
 * the column type it can be serialized without a timezone suffix
 * (e.g. "2026-08-02 12:00:00" or "2026-08-02T12:00:00").
 * `new Date(...)` would then parse it as *local* time, so the countdown would
 * shift when the user's timezone changes (or differs from the server).
 *
 * `parseServerDate` always interprets such values as UTC, so the remaining time
 * is the same absolute instant everywhere and stays consistent across refreshes.
 */
export function parseServerDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  let normalized = value.trim().replace(' ', 'T');

  // Has an explicit timezone? ("Z", "+03:00", "-0300")
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  if (!hasTimezone) normalized += 'Z';

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Absolute epoch ms of the expiration instant, or null when unknown. */
export function expiresAtMs(value: string | null | undefined): number | null {
  return parseServerDate(value)?.getTime() ?? null;
}

/** True when a trial store is past its expiration instant. */
export function isTrialExpired(store: {
  plan_type?: string | null;
  plan_expires_at?: string | null;
} | null | undefined): boolean {
  if (!store || store.plan_type !== 'trial') return false;
  const ms = expiresAtMs(store.plan_expires_at);
  return ms !== null && ms < Date.now();
}
