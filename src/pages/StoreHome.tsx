import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Store, Heart, LogOut, User, MessageSquare, Lightbulb, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/integrations/supabase/client";

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
}

const StoreHome = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeNotFound, setStoreNotFound] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);

  // Load store
  useEffect(() => {
    const loadStore = async () => {
      if (!slug) {
        setStoreNotFound(true);
        setStoreLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("stores")
        .select("id, name, slug")
        .eq("slug", slug)
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
  }, [slug]);

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
    navigate(`/loja/${slug}/auth`, { replace: true });
  };

  if (storeLoading || authLoading) {
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

  // Not authenticated or not a member → redirect to store auth
  if (!isAuthenticated || !isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <GlassCard className="p-8 text-center max-w-sm w-full">
          <Store className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">{store?.name}</h1>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display font-bold text-lg truncate">{store?.name}</h1>
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
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6">
            <h2 className="font-display text-xl font-bold mb-1">
              Olá, {user?.username}! 💜
            </h2>
            <p className="text-sm text-muted-foreground">
              Bem-vindo à {store?.name}. Explore o conteúdo exclusivo.
            </p>
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
                transition={{ delay: index * 0.05 }}
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

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-4">
            <p className="text-xs text-muted-foreground text-center">
              Logado como {user?.email} • Loja: {store?.name}
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default StoreHome;
