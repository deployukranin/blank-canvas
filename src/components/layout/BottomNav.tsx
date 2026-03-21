import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useSubdomain } from '@/contexts/SubdomainContext';
import { useAuth } from '@/contexts/AuthContext';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { supabase } from '@/integrations/supabase/client';

export const BottomNav = () => {
  const location = useLocation();
  const { slug } = useParams<{ slug?: string }>();
  const { config } = useWhiteLabel();
  const { isMainDomain, store: subdomainStore } = useSubdomain();
  const { user } = useAuth();
  const [storeSlug, setStoreSlug] = useState<string | null>(null);

  // Determine the store slug for home navigation
  useEffect(() => {
    // If we're on a subdomain, home is just "/"
    if (!isMainDomain && subdomainStore) {
      setStoreSlug(null); // subdomain mode, "/" is fine
      return;
    }

    // If slug is in URL params, use it
    if (slug) {
      setStoreSlug(slug);
      return;
    }

    // Try to extract slug from current path (e.g. /marco/galeria -> marco)
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      // Check if first segment is a known route or a store slug
      const knownRoutes = ['admin', 'ceo', 'auth', 'galeria', 'ideias', 'customs', 'comunidade', 'perfil', 'notificacoes', 'meus-pedidos', 'assinaturas', 'ajuda', 'termos', 'privacidade'];
      if (!knownRoutes.includes(pathParts[0])) {
        setStoreSlug(pathParts[0]);
        return;
      }
    }

    // Fallback: fetch user's store from DB
    if (user?.id) {
      const fetchSlug = async () => {
        const { data: adminStore } = await supabase
          .from('store_admins')
          .select('stores(slug)')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (adminStore?.stores && typeof adminStore.stores === 'object' && 'slug' in adminStore.stores) {
          setStoreSlug((adminStore.stores as { slug: string }).slug);
          return;
        }

        const { data: userStore } = await supabase
          .from('store_users')
          .select('stores(slug)')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (userStore?.stores && typeof userStore.stores === 'object' && 'slug' in userStore.stores) {
          setStoreSlug((userStore.stores as { slug: string }).slug);
        }
      };
      fetchSlug();
    }
  }, [slug, user?.id, isMainDomain, subdomainStore, location.pathname]);

  // Resolve path: prefix all paths with store slug when on main domain
  const resolvePath = (path: string) => {
    if (isMainDomain && storeSlug) {
      if (path === '/') {
        return `/${storeSlug}`;
      }
      return `/${storeSlug}${path}`;
    }
    return path;
  };

  // Use navigation tabs from config, filtered by enabled and sorted by order
  const navItems = config.navigationTabs
    .filter(tab => tab.enabled && tab.path !== '/loja' && tab.path !== '/vip')
    .sort((a, b) => a.order - b.order);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="glass border-t border-white/10 px-2 pt-2 pb-safe">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const resolvedPath = resolvePath(item.path);
            const isActive = location.pathname === resolvedPath;

            return (
              <Link
                key={item.id}
                to={resolvedPath}
                className="relative flex flex-col items-center gap-1 py-2 px-4 min-w-[64px]"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-primary/20"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <DynamicIcon
                  icon={item.icon}
                  size={20}
                  className={`relative z-10 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium relative z-10 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
