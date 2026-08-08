/**
 * Tenant favicon installer.
 *
 * The favicon "blinks" on reload when we remove the static icons and re-add the
 * tenant icon on every render/route change. To avoid it we:
 *  - cache the resolved URL per slug so `public/theme-init.js` can apply it
 *    before the first paint;
 *  - no-op when the same icon is already installed.
 */

export const TENANT_FAVICON_CACHE_PREFIX = 'tenant_favicon_v1_';

export function buildTenantIconUrl(avatarUrl: string, storeId: string): string {
  const sep = avatarUrl.includes('?') ? '&' : '?';
  return `${avatarUrl}${sep}tenant=${encodeURIComponent(storeId)}`;
}

export function applyTenantFavicon(
  avatarUrl: string | null | undefined,
  storeId: string | null | undefined,
  slug?: string | null,
) {
  if (!avatarUrl || !storeId || typeof document === 'undefined') return;

  const iconUrl = buildTenantIconUrl(avatarUrl, storeId);

  try {
    const key = TENANT_FAVICON_CACHE_PREFIX + (slug || '__global').toLowerCase();
    if (localStorage.getItem(key) !== iconUrl) localStorage.setItem(key, iconUrl);
  } catch {
    /* storage disabled */
  }

  const existing = document.querySelector<HTMLLinkElement>(
    "link[rel='icon'][data-source='tenant']",
  );
  if (existing && existing.href === new URL(iconUrl, window.location.href).href) {
    // Already installed — re-injecting would make the icon flicker.
    return;
  }

  document
    .querySelectorAll("link[rel~='icon'], link[rel='apple-touch-icon'], link[rel='mask-icon']")
    .forEach((element) => element.remove());

  const links: Array<{ rel: string; type?: string }> = [
    { rel: 'icon', type: 'image/png' },
    { rel: 'shortcut icon', type: 'image/png' },
    { rel: 'apple-touch-icon' },
  ];

  links.forEach(({ rel, type }) => {
    const link = document.createElement('link');
    link.rel = rel;
    if (type) link.type = type;
    link.href = iconUrl;
    link.dataset.source = 'tenant';
    document.head.appendChild(link);
  });
}
