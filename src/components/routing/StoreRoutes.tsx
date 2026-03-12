import { Loader2, Store, AlertTriangle } from "lucide-react";
import { Routes, Route } from "react-router-dom";
import { useSubdomain } from "@/contexts/SubdomainContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import StoreHome from "@/pages/StoreHome";
import StoreAuth from "@/pages/StoreAuth";
import NotFound from "@/pages/NotFound";

/**
 * When a subdomain is detected, render store-specific routes only.
 * The store data comes from SubdomainContext.
 */
const StoreRoutes = () => {
  const { store, isLoading, isNotFound } = useSubdomain();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isNotFound || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <GlassCard className="p-8 text-center max-w-sm w-full">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground text-sm mb-6">
            O endereço que você acessou não corresponde a nenhuma loja ativa.
          </p>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Voltar ao início
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<StoreHome />} />
      <Route path="/auth" element={<StoreAuth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default StoreRoutes;
