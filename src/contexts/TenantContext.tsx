import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  status: string;
  created_by: string | null;
  plan_type: string;
  plan_expires_at: string | null;
}

interface TenantInfo {
  /** store slug resolved from URL path or custom domain */
  slug: string | null;
  /** Whether we're in a tenant-scoped context */
  isTenantScope: boolean;
  /** The base path for tenant routes (e.g. /luna-asmr or / on custom domain) */
  basePath: string;
  /** Loaded store data */
  store: StoreInfo | null;
  /** Whether store data is still loading */
  isLoading: boolean;
  /** Error if store not found */
  error: string | null;
  /** Whether we're on a custom domain (slug-free URLs) */
  isCustomDomain: boolean;
}

const TenantContext = createContext<TenantInfo>({
  slug: null,
  isTenantScope: false,
  basePath: '/',
  store: null,
  isLoading: false,
  error: null,
  isCustomDomain: false,
});

/** Reserved top-level routes that are NOT tenant slugs */
const RESERVED_ROUTES = new Set([
  'admin', 'admin-master', 'auth', 'login', 'signup',
  'help', 'terms', 'privacy', 'subscriptions',
  'ideas', 'vip', 'customs', 'community', 'gallery',
  'profile', 'orders', 'notifications', 'audios', 'videos',
  'setup',
]);

const PLATFORM_HOSTS = [
  'localhost',
  '127.0.0.1',
  'lovableproject.com',
  'lovable.app',
  'mytinglebox.com',
  'www.mytinglebox.com',
  'vercel.app',
];

function isPlatformHost(hostname: string): boolean {
  return PLATFORM_HOSTS.some(
    (h) => hostname === h || hostname.endsWith('.' + h)
  );
}

/**
 * Resolves tenant slug from current pathname.
 */
function resolveSlugFromPath(pathname: string): string | null {
  const firstSegment = pathname.split('/')[1];
  if (firstSegment && !RESERVED_ROUTES.has(firstSegment)) {
    return firstSegment;
  }
  return null;
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hostname = window.location.hostname;
  const isCustomDomain = !isPlatformHost(hostname);
  const slugFromPath = resolveSlugFromPath(location.pathname);

  // On custom domains, we resolve slug from hostname (DB lookup)
  // On platform hosts, we resolve slug from URL path
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(slugFromPath);
  const isTenantScope = !!(slugFromPath || isCustomDomain);
  // On custom domain, basePath is "/" (no slug in URL); on platform, it's "/slug"
  const basePath = isCustomDomain ? '' : (slugFromPath ? `/${slugFromPath}` : '/');
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [isLoading, setIsLoading] = useState(isTenantScope);
  const [error, setError] = useState<string | null>(null);

  // Load store data when slug changes or when custom domain needs resolution
  useEffect(() => {
    const effectiveSlug = slugFromPath;
    
    if (!effectiveSlug && !isCustomDomain) {
      setStore(null);
      setError(null);
      setIsLoading(false);
      setResolvedSlug(null);
      return;
    }

    let cancelled = false;

    const loadStore = async () => {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('stores_public')
        .select('id, name, slug, description, avatar_url, banner_url, status, created_by, plan_type, plan_expires_at');

      if (effectiveSlug) {
        query = query.eq('slug', effectiveSlug);
      } else if (isCustomDomain) {
        query = query.eq('custom_domain', hostname);
      }

      const { data, error: dbError } = await query.maybeSingle();

      if (cancelled) return;

      if (dbError) {
        console.error('Error loading store:', dbError);
        setError('Erro ao carregar loja');
        setStore(null);
        setResolvedSlug(null);
      } else if (!data) {
        setError('Loja não encontrada');
        setStore(null);
        setResolvedSlug(null);
      } else {
        setStore(data as StoreInfo);
        setResolvedSlug(data.slug);
        setError(null);

        // Dynamically set page title to the store name
        document.title = data.name;

        // Dynamically set favicon to the store's avatar
        if (data.avatar_url) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = data.avatar_url;
          link.type = 'image/png';

          // Also update apple-touch-icon
          let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
          if (appleLink) {
            appleLink.href = data.avatar_url;
          }
        }

        // Resolve theme color from cached whitelabel config
        let themeColorHex = '#8b5cf6';
        let bgColorHex = '#0a0612';
        try {
          const cachedConfig = localStorage.getItem('whitelabel_cache_' + data.slug) 
            || localStorage.getItem('whitelabel_config_cache');
          if (cachedConfig) {
            const parsed = JSON.parse(cachedConfig);
            if (parsed?.colors?.primary) {
              // Convert HSL string "H S% L%" to hex
              const parts = parsed.colors.primary.split(/\s+/);
              const h = parseFloat(parts[0]) || 263;
              const s = parseFloat(parts[1]) || 70;
              const l = parseFloat(parts[2]) || 58;
              const hslToHex = (h: number, s: number, l: number) => {
                s /= 100; l /= 100;
                const a = s * Math.min(l, 1 - l);
                const f = (n: number) => { const k = (n + h / 30) % 12; const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * c).toString(16).padStart(2, '0'); };
                return `#${f(0)}${f(8)}${f(4)}`;
              };
              themeColorHex = hslToHex(h, s, l);
            }
            if (parsed?.colors?.mode === 'light') {
              bgColorHex = '#f9f9f9';
            }
          }
        } catch {}

        // Update meta theme-color tag
        let metaTheme = document.querySelector("meta[name='theme-color']") as HTMLMetaElement | null;
        if (metaTheme) {
          metaTheme.content = themeColorHex;
        }

        // Dynamically update manifest.json for PWA with store name and icon
        const dynamicManifest = {
          name: data.name,
          short_name: data.name,
          description: data.description || `${data.name} - Conteúdo exclusivo`,
          start_url: isCustomDomain ? '/' : `/${data.slug}`,
          display: 'standalone' as const,
          background_color: bgColorHex,
          theme_color: themeColorHex,
          orientation: 'portrait-primary' as const,
          icons: data.avatar_url
            ? [
                { src: data.avatar_url, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                { src: data.avatar_url, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
              ]
            : [
                { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
              ],
        };
        const manifestBlob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/json' });
        const manifestUrl = URL.createObjectURL(manifestBlob);
        let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement | null;
        if (manifestLink) {
          manifestLink.href = manifestUrl;
        } else {
          manifestLink = document.createElement('link');
          manifestLink.rel = 'manifest';
          manifestLink.href = manifestUrl;
          document.head.appendChild(manifestLink);
        }
      }

      setIsLoading(false);
    };

    loadStore();
    return () => { cancelled = true; };
  }, [slugFromPath, isCustomDomain, hostname]);

  return (
    <TenantContext.Provider value={{ slug: resolvedSlug, isTenantScope, basePath, store, isLoading, error, isCustomDomain }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
