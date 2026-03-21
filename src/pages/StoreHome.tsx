import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Store, Heart, MessageSquare, Lightbulb, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { MobileLayout } from "@/components/layout/MobileLayout";

const StoreHome = () => {
  const navigate = useNavigate();
  const { store, storeConfig, isLoading, notFound, basePath } = useStore();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isMember, setIsMember] = useState<boolean | null>(null);

  const displayName = storeConfig.storeName || store?.name || "Loja";
  const description = storeConfig.storeDescription || "Explore o conteúdo exclusivo.";

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

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <GlassCard className="p-8 text-center max-w-sm w-full">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground text-sm mb-6">
            O link que você acessou não corresponde a nenhuma loja ativa.
          </p>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Voltar ao início
          </Button>
        </GlassCard>
      </div>
    );
  }

  const isGuest = !isAuthenticated || !isMember;

  const quickLinks = [
    { icon: Play, label: "Vídeos", path: `${basePath}/galeria`, color: "from-purple-500 to-pink-500" },
    { icon: MessageSquare, label: "Comunidade", path: `${basePath}/comunidade`, color: "from-blue-500 to-cyan-500" },
    { icon: Lightbulb, label: "Ideias", path: `${basePath}/ideias`, color: "from-amber-500 to-orange-500" },
    { icon: Heart, label: "Favoritos", path: `${basePath}/favoritos`, color: "from-red-500 to-pink-500" },
  ];

  const banners = storeConfig.bannerImages?.length ? storeConfig.bannerImages : [];

  return (
    <MobileLayout title={displayName}>
      <div className="px-4 py-6 space-y-6">
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
              {isGuest ? `Bem-vindo! 💜` : `Olá, ${user?.username}! 💜`}
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
              {isGuest ? displayName : `Logado como ${user?.email} • ${displayName}`}
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default StoreHome;
