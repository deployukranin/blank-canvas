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
}

interface TenantInfo {
  /** store slug resolved from URL path */
  slug: string | null;
  /** Whether we're in a tenant-scoped context */
  isTenantScope: boolean;
  /** The base path for tenant routes (e.g. /luna-asmr) */
  basePath: string;
  /** Loaded store data */
  store: StoreInfo | null;
  /** Whether store data is still loading */
  isLoading: boolean;
  /** Error if store not found */
  error: string | null;
}

const TenantContext = createContext<TenantInfo>({
  slug: null,
  isTenantScope: false,
  basePath: '/',
  store: null,
  isLoading: false,
  error: null,
});

/** Reserved top-level routes that are NOT tenant slugs */
const RESERVED_ROUTES = new Set([
  'admin', 'admin-master', 'auth', 'login', 'signup',
  'help', 'terms', 'privacy', 'subscriptions',
  'ideas', 'vip', 'customs', 'community', 'gallery',
  'profile', 'orders', 'notifications', 'audios', 'videos',
  'setup',
]);

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
  const slug = resolveSlugFromPath(location.pathname);
  const isTenantScope = !!slug;
  const basePath = slug ? `/${slug}` : '/';
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [isLoading, setIsLoading] = useState(isTenantScope);
  const [error, setError] = useState<string | null>(null);

  // Load store data when slug changes
  useEffect(() => {
    if (!slug) {
      setStore(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadStore = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('stores')
        .select('id, name, slug, description, avatar_url, banner_url, status, created_by')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (cancelled) return;

      if (dbError) {
        console.error('Error loading store:', dbError);
        setError('Erro ao carregar loja');
        setStore(null);
      } else if (!data) {
        setError('Loja não encontrada');
        setStore(null);
      } else {
        setStore(data as StoreInfo);
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

        // Dynamically update manifest.json for PWA with store name and icon
        const dynamicManifest = {
          name: data.name,
          short_name: data.name,
          description: data.description || `${data.name} - Conteúdo exclusivo`,
          start_url: `/${data.slug}`,
          display: 'standalone' as const,
          background_color: '#0a0612',
          theme_color: '#8b5cf6',
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
  }, [slug]);

  return (
    <TenantContext.Provider value={{ slug, isTenantScope, basePath, store, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
