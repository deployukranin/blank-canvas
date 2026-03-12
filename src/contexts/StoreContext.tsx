import React, { createContext, useContext } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  url: string;
}

interface StoreContextType {
  store: StoreInfo | null;
  storeId: string | null;
  isLoading: boolean;
  notFound: boolean;
}

const StoreContext = createContext<StoreContextType>({
  store: null,
  storeId: null,
  isLoading: true,
  notFound: false,
});

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();

  const { data: store, isLoading } = useQuery({
    queryKey: ["store-by-slug", slug],
    queryFn: async (): Promise<StoreInfo | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, slug, status, url")
        .eq("slug", slug)
        .eq("status", "active")
        .single();

      if (error || !data) return null;
      return data as StoreInfo;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
  });

  const notFound = !isLoading && !store && !!slug;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground mb-4">O link acessado não corresponde a nenhuma loja ativa.</p>
          <a href="/" className="text-primary hover:underline">Voltar ao início</a>
        </div>
      </div>
    );
  }

  return (
    <StoreContext.Provider value={{ store: store ?? null, storeId: store?.id ?? null, isLoading, notFound }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
