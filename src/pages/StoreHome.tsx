import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Store, Heart, LogOut, User, MessageSquare, Lightbulb, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { useStoreConfig } from "@/hooks/use-store-config";
import { useSubdomain } from "@/contexts/SubdomainContext";

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
}

const StoreHome = () => {
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const { store: subdomainStore, isMainDomain } = useSubdomain();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeNotFound, setStoreNotFound] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);

  // Determine effective slug: subdomain store takes priority
  const effectiveSlug = subdomainStore?.username || subdomainStore?.slug || urlSlug;
  // Whether we're in subdomain mode (paths are relative to /)
  const isSubdomainMode = !isMainDomain && !!subdomainStore;
  const basePath = isSubdomainMode ? "" : `/loja/${effectiveSlug}`;

  // Load store
  useEffect(() => {
    // If subdomain already resolved the store, use it
    if (subdomainStore) {
      setStore({ id: subdomainStore.id, name: subdomainStore.name, slug: subdomainStore.username || subdomainStore.slug || "" });
      setStoreLoading(false);
      return;
    }

    const loadStore = async () => {
      if (!effectiveSlug) {
        setStoreNotFound(true);
        setStoreLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("stores")
        .select("id, name, slug")
        .eq("slug", effectiveSlug)
        .eq("status", "active")
        .single();

      if (error || !data) {
        setStoreNotFound(true);
      } else {
        setStore(data as StoreInfo);
      }
      setStoreLoading(false);
    };

    loadStore();
  }, [effectiveSlug, subdomainStore]);

  // Store visual config
  const { config: storeConfig, isLoading: configLoading } = useStoreConfig(store?.id);

  const displayName = storeConfig.storeName || store?.name || "Loja";
  const description = storeConfig.storeDescription || "Explore o conteúdo exclusivo.";

  // Apply store colors as CSS variables
  useEffect(() => {
    if (!storeConfig.colors) return;
    const root = document.documentElement;
    root.style.setProperty("--primary", storeConfig.colors.primary);
    root.style.setProperty("--accent", storeConfig.colors.accent);
    root.style.setProperty("--background", storeConfig.colors.background);
    root.style.setProperty("--ring", storeConfig.colors.primary);

    return () => {
      // Reset to defaults when leaving
      root.style.removeProperty("--primary");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--background");
      root.style.removeProperty("--ring");
    };
  }, [storeConfig.colors]);

  // Check membership
  useEffect(() => {
    const checkMembership = async () => {
      if (!store || !user) {
        setIsMember(false);
        return;
      }

      const { data } = await supabase
        .from("store_users")
        .select("id")
        .eq("user_id", user.id)
        .eq("store_id", store.id)
        .single();

      setIsMember(!!data);
    };

    if (!authLoading && store) {
      checkMembership();
    }
  }, [store, user, authLoading]);

  const handleLogout = async () => {
    await signOut();
    navigate(`${basePath}/auth`, { replace: true });
  };

  if (storeLoading || authLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (storeNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <GlassCard className="p-8 text-center max-w-sm w-full">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground text-sm mb-6">
            O link que você acessou não corresponde a nenhuma loja ativa.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Voltar ao início
          </Button>
        </GlassCard>
      </div>
    );
  }

  // Not authenticated or not a member
  if (!isAuthenticated || !isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <GlassCard className="p-8 text-center max-w-sm w-full">
          {storeConfig.logoUrl ? (
            <img src={storeConfig.logoUrl} alt={displayName} className="w-16 h-16 mx-auto mb-4 rounded-2xl object-cover" />
          ) : (
            <Store className="w-12 h-12 text-primary mx-auto mb-4" />
          )}
          <h1 className="text-xl font-bold text-foreground mb-2">{displayName}</h1>
          <p className="text-muted-foreground text-sm mb-6">
            {!isAuthenticated
              ? "Faça login ou crie sua conta para acessar esta loja."
              : "Você não possui acesso a esta loja. Crie uma conta vinculada."}
          </p>
          <Button onClick={() => navigate(`/loja/${slug}/auth`)} className="w-full">
            {!isAuthenticated ? "Entrar / Criar Conta" : "Criar conta nesta loja"}
          </Button>
        </GlassCard>
      </div>
    );
  }

  const quickLinks = [
    { icon: Play, label: "Vídeos", path: `/loja/${slug}/videos`, color: "from-purple-500 to-pink-500" },
    { icon: MessageSquare, label: "Comunidade", path: `/loja/${slug}/comunidade`, color: "from-blue-500 to-cyan-500" },
    { icon: Lightbulb, label: "Ideias", path: `/loja/${slug}/ideias`, color: "from-amber-500 to-orange-500" },
    { icon: Heart, label: "Favoritos", path: `/loja/${slug}/favoritos`, color: "from-red-500 to-pink-500" },
  ];

  const banners = storeConfig.bannerImages?.length ? storeConfig.bannerImages : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {storeConfig.logoUrl ? (
              <img src={storeConfig.logoUrl} alt={displayName} className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <h1 className="font-display font-bold text-lg truncate">{displayName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/loja/${slug}/perfil`)}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Banner Carousel */}
        {banners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
          >
            <Carousel opts={{ loop: true }} className="w-full">
              <CarouselContent>
                {banners.map((src, idx) => (
                  <CarouselItem key={`${src}-${idx}`}>
                    <img
                      src={src}
                      alt={`Banner ${idx + 1}`}
                      className="w-full h-48 object-cover"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {banners.length > 1 && (
                <>
                  <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
                  <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />
                </>
              )}
            </Carousel>
          </motion.div>
        )}

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6">
            <h2 className="font-display text-xl font-bold mb-1">
              Olá, {user?.username}! 💜
            </h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </GlassCard>
        </motion.div>

        {/* Quick Links */}
        <div>
          <h3 className="font-display font-semibold mb-3">Explorar</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + index * 0.05 }}
              >
                <Link to={item.path}>
                  <GlassCard className="p-4 text-center" hover>
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-4">
            <p className="text-xs text-muted-foreground text-center">
              Logado como {user?.email} • {displayName}
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default StoreHome;
