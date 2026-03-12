import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StoreData {
  id: string;
  name: string;
  username: string;
  slug: string | null;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  status: string;
}

interface SubdomainContextType {
  /** The detected subdomain (e.g. "marcia") or null if on main domain */
  subdomain: string | null;
  /** The store matching the subdomain */
  store: StoreData | null;
  /** Whether we're still resolving */
  isLoading: boolean;
  /** True if subdomain was detected but no store found */
  isNotFound: boolean;
  /** True if we're on the main/platform domain (no subdomain) */
  isMainDomain: boolean;
}

const SubdomainContext = createContext<SubdomainContextType>({
  subdomain: null,
  store: null,
  isLoading: true,
  isNotFound: false,
  isMainDomain: true,
});

/** Hostnames that should be treated as "main domain" (no store) */
const MAIN_HOSTS = [
  "localhost",
  "127.0.0.1",
];

/** Patterns that indicate a platform/preview domain (not a store subdomain) */
const PLATFORM_PATTERNS = [
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
  /\.vercel\.app$/,
  /\.netlify\.app$/,
];

/**
 * Extract subdomain from hostname.
 * Returns null if on main domain or a platform preview domain.
 *
 * Examples:
 *   marcia.meudominio.com  → "marcia"
 *   www.meudominio.com     → null (www is not a store)
 *   meudominio.com         → null
 *   localhost               → null
 *   xxx.lovable.app         → null (platform domain)
 */
function extractSubdomain(hostname: string): string | null {
  // Direct main hosts
  if (MAIN_HOSTS.includes(hostname)) return null;

  // Platform preview domains — never treat as store subdomain
  if (PLATFORM_PATTERNS.some((p) => p.test(hostname))) return null;

  const parts = hostname.split(".");

  // Need at least 3 parts: sub.domain.tld
  if (parts.length < 3) return null;

  const sub = parts[0].toLowerCase();

  // "www" is not a store
  if (sub === "www") return null;

  return sub;
}

export const SubdomainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [store, setStore] = useState<StoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isMainDomain, setIsMainDomain] = useState(true);

  useEffect(() => {
    const detected = extractSubdomain(window.location.hostname);

    if (!detected) {
      setIsMainDomain(true);
      setIsLoading(false);
      return;
    }

    setSubdomain(detected);
    setIsMainDomain(false);

    // Look up store by username
    const resolveStore = async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, username, slug, status, description, avatar_url, banner_url")
        .eq("username", detected)
        .eq("status", "active")
        .single();

      if (error || !data) {
        setIsNotFound(true);
      } else {
        setStore(data as StoreData);
      }
      setIsLoading(false);
    };

    resolveStore();
  }, []);

  return (
    <SubdomainContext.Provider value={{ subdomain, store, isLoading, isNotFound, isMainDomain }}>
      {children}
    </SubdomainContext.Provider>
  );
};

export const useSubdomain = () => useContext(SubdomainContext);
