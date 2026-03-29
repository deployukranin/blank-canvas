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
  'admin', 'admin-master', 'auth', 'entrar', 'login', 'signup',
  'ajuda', 'termos', 'privacidade', 'assinaturas',
  'ideias', 'vip', 'customs', 'comunidade', 'galeria',
  'perfil', 'meus-pedidos', 'notificacoes', 'audios', 'videos',
  'galeria-videos', 'setup',
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
