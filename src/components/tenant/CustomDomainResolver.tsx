import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Detects if the current hostname is a custom domain (not the default platform domain).
 * If so, looks up the store by custom_domain and redirects to /:slug.
 * If not a custom domain, renders the fallback (e.g. NotFound).
 */

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

interface Props {
  fallback: React.ReactNode;
}

const CustomDomainResolver: React.FC<Props> = ({ fallback }) => {
  const hostname = window.location.hostname;
  const isCustomDomain = !isPlatformHost(hostname);

  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(isCustomDomain);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isCustomDomain) return;

    let cancelled = false;

    const resolve = async () => {
      const { data } = await supabase
        .from('stores')
        .select('slug')
        .eq('custom_domain', hostname)
        .eq('status', 'active')
        .maybeSingle();

      if (cancelled) return;

      if (data?.slug) {
        setSlug(data.slug);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };

    resolve();
    return () => { cancelled = true; };
  }, [hostname, isCustomDomain]);

  // Not a custom domain — render fallback (NotFound page)
  if (!isCustomDomain) {
    return <>{fallback}</>;
  }

  // Loading store lookup
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Found store — redirect to /:slug preserving path
  if (slug) {
    const currentPath = window.location.pathname;
    const targetPath = currentPath === '/' ? `/${slug}` : `/${slug}${currentPath}`;
    return <Navigate to={targetPath} replace />;
  }

  // Custom domain but no store found
  return <>{fallback}</>;
};

export default CustomDomainResolver;
