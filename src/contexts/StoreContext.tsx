import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSubdomain } from '@/contexts/SubdomainContext';
import { useStoreConfig, StoreVisualConfig } from '@/hooks/use-store-config';

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
}

interface StoreContextType {
  store: StoreInfo | null;
  storeConfig: StoreVisualConfig;
  isLoading: boolean;
  notFound: boolean;
  basePath: string; // e.g. "/teste" or "" for subdomain mode
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const { store: subdomainStore, isMainDomain } = useSubdomain();

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const effectiveSlug = subdomainStore?.username || subdomainStore?.slug || urlSlug;
  const isSubdomainMode = !isMainDomain && !!subdomainStore;
  const basePath = isSubdomainMode ? '' : `/${effectiveSlug}`;

  useEffect(() => {
    if (subdomainStore) {
      setStore({
        id: subdomainStore.id,
        name: subdomainStore.name,
        slug: subdomainStore.username || subdomainStore.slug || '',
      });
      setIsLoadingStore(false);
      return;
    }

    const loadStore = async () => {
      if (!effectiveSlug) {
        setNotFound(true);
        setIsLoadingStore(false);
        return;
      }

      const { data, error } = await supabase
        .from('stores')
        .select('id, name, slug')
        .eq('slug', effectiveSlug)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setStore(data as StoreInfo);
      }
      setIsLoadingStore(false);
    };

    loadStore();
  }, [effectiveSlug, subdomainStore]);

  const { config: storeConfig, isLoading: configLoading } = useStoreConfig(store?.id ?? null);

  // Apply store colors
  useEffect(() => {
    if (!storeConfig.colors) return;
    const root = document.documentElement;
    root.style.setProperty('--primary', storeConfig.colors.primary);
    root.style.setProperty('--accent', storeConfig.colors.accent);
    root.style.setProperty('--background', storeConfig.colors.background);
    root.style.setProperty('--ring', storeConfig.colors.primary);

    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--background');
      root.style.removeProperty('--ring');
    };
  }, [storeConfig.colors]);

  return (
    <StoreContext.Provider
      value={{
        store,
        storeConfig,
        isLoading: isLoadingStore || configLoading,
        notFound,
        basePath,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    // Fallback for pages used outside store context
    return {
      store: null,
      storeConfig: {} as StoreVisualConfig,
      isLoading: false,
      notFound: false,
      basePath: '',
    };
  }
  return context;
};
