import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getVipMediaSignedUrl } from "@/lib/external-storage";

interface VipContent {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
}

export const VIPAreaContent = () => {
  const [content, setContent] = useState<VipContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVip, setIsVip] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkVipStatusAndLoadContent();
  }, []);

  const checkVipStatusAndLoadContent = async () => {
    try {
      // 1. Verifica se tem sessão
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      // 2. Verifica Status VIP (No Banco, não no LocalStorage!)
      const { data: subscription } = await supabase
        .from('vip_subscriptions')
        .select('status, expires_at')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      const userIsVip = !!subscription;
      setIsVip(userIsVip);

      if (userIsVip) {
        // 3. SE for VIP, busca o conteúdo da tabela vip_content
        const { data: vipContent, error } = await supabase
          .from('vip_content')
          .select('*');

        if (error) {
          console.error("Erro ao carregar conteúdo VIP:", error);
          toast({
            variant: "destructive",
            title: "Erro de Acesso",
            description: "Não foi possível carregar o conteúdo exclusivo."
          });
        } else {
          // Mapear para o formato esperado pelo componente
          const mappedContent: VipContent[] = (vipContent || []).map(item => ({
            id: item.id,
            title: item.title,
            description: item.content,
            video_url: item.media_url || '',
            thumbnail_url: undefined
          }));
          setContent(mappedContent);
        }
      } 
    } catch (error) {
      console.error("Erro geral:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não for VIP, mostra o "Cadeado" (Teaser)
  if (!isVip) {
    return (
      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
        <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Área Exclusiva VIP</h2>
        <p className="text-gray-600 mb-6">
          Este conteúdo é reservado para assinantes. Desbloqueie acesso total agora.
        </p>
        <Button onClick={() => navigate("/plans")} size="lg" className="animate-pulse">
          Quero ser VIP
        </Button>
      </div>
    );
  }

  // Se for VIP, mostra o conteúdo real
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {content.map((item) => (
        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          {item.thumbnail_url && (
            <img 
              src={item.thumbnail_url} 
              alt={item.title} 
              className="w-full h-48 object-cover"
            />
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" />
              {item.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {item.description}
            </p>
            {item.video_url && (
              <Button className="w-full" onClick={async () => {
                const url = await getVipMediaSignedUrl(item.video_url);
                if (url) window.open(url, '_blank');
              }}>
                Assistir Agora
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
      
      {content.length === 0 && (
        <div className="col-span-full text-center text-gray-500 py-10">
          Nenhum conteúdo disponível no momento.
        </div>
      )}
    </div>
  );
};
