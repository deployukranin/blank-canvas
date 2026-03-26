import React, { createContext, useContext, useMemo } from 'react';

interface TenantInfo {
  /** store slug resolved from URL path or subdomain */
  slug: string | null;
  /** Whether we're in a tenant-scoped context */
  isTenantScope: boolean;
  /** The base path for tenant routes (e.g. /luna-asmr) */
  basePath: string;
}

const TenantContext = createContext<TenantInfo>({
  slug: null,
  isTenantScope: false,
  basePath: '/',
});

/** Reserved top-level routes that are NOT tenant slugs */
const RESERVED_ROUTES = new Set([
  'admin', 'admin-master', 'auth', 'login', 'signup',
  'ajuda', 'termos', 'privacidade', 'assinaturas',
  'ideias', 'vip', 'customs', 'comunidade', 'galeria',
  'perfil', 'meus-pedidos', 'notificacoes', 'audios', 'videos',
]);

/** Platform domains that should NOT be treated as subdomains */
const PLATFORM_DOMAINS = ['lovable.app', 'lovable.dev', 'localhost'];

/**
 * Resolves tenant from current URL.
 * Priority: 1) Subdomain  2) Path slug
 */
function resolveTenant(): { slug: string | null } {
  const hostname = window.location.hostname;

  // 1. Check subdomain (e.g. criador1.meusaas.com)
  const isPlatformDomain = PLATFORM_DOMAINS.some(d => hostname.endsWith(d));
  if (!isPlatformDomain && hostname !== 'localhost') {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (subdomain !== 'www' && subdomain !== 'app') {
        return { slug: subdomain };
      }
    }
  }

  // 2. Check path (e.g. /luna-asmr/customs)
  const firstSegment = window.location.pathname.split('/')[1];
  if (firstSegment && !RESERVED_ROUTES.has(firstSegment)) {
    return { slug: firstSegment };
  }

  return { slug: null };
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tenant = useMemo(() => {
    const { slug } = resolveTenant();
    return {
      slug,
      isTenantScope: !!slug,
      basePath: slug ? `/${slug}` : '/',
    };
  }, []);

  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
