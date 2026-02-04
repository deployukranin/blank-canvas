import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'ceo';
}

export const AdminRoute = ({ children, requiredRole = 'admin' }: AdminRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      // 1. Verifica se está logado
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      // 2. Busca a 'role' do usuário na tabela profiles
      // Se sua tabela de perfis tiver outro nome (ex: users), ajuste aqui.
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        console.error("Erro ao verificar perfil:", error);
        setLoading(false);
        return;
      }

      const userRole = profile.role || 'user';

      // 3. Regras de Acesso
      // CEO tem acesso a tudo (admin e ceo)
      // Admin tem acesso a admin
      let hasAccess = false;

      if (requiredRole === 'ceo') {
        hasAccess = userRole === 'ceo' || userRole === 'super_admin';
      } else {
        // Para rotas de admin, aceita admin, ceo ou super_admin
        hasAccess = ['admin', 'ceo', 'super_admin'].includes(userRole);
      }

      setIsAuthorized(hasAccess);

      if (!hasAccess) {
        toast({
          variant: "destructive",
          title: "Acesso Negado",
          description: `Você precisa de permissão de ${requiredRole.toUpperCase()} para acessar esta área.`
        });
      }

    } catch (error) {
      console.error("Erro de autorização:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não autorizado, chuta para o login de Admin (ou Home)
  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};