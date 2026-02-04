import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verifica sessão existente ao carregar
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      checkAdminRole(session.user.id);
    }
  };

  const checkAdminRole = async (userId: string) => {
    try {
      // Busca roles na tabela user_roles (Seguro - tabela separada com RLS)
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error("Erro ao verificar roles:", error);
        return;
      }

      const userRoles = roles?.map(r => r.role) || [];

      // Aceita admin ou ceo
      if (userRoles.includes('admin') || userRoles.includes('ceo')) {
        if (userRoles.includes('ceo')) {
          navigate("/ceo");
        } else {
          navigate("/admin");
        }
      } else {
        // Se logou mas não é admin/ceo, desloga
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Login Oficial do Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error("Email ou senha incorretos.");
      if (!data.user) throw new Error("Erro de autenticação.");

      // 2. Verificação de Cargo via user_roles (tabela segura)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      if (rolesError) {
        console.error("Erro ao buscar roles:", rolesError);
        throw new Error("Erro ao verificar permissões.");
      }

      const userRoles = roles?.map(r => r.role) || [];

      // Verifica se possui role admin ou ceo
      if (userRoles.includes('ceo')) {
        toast({
          title: "Acesso Permitido",
          description: "Bem-vindo ao painel, CEO."
        });
        navigate("/ceo");
      } else if (userRoles.includes('admin')) {
        toast({
          title: "Acesso Permitido",
          description: "Bem-vindo ao painel, ADMIN."
        });
        navigate("/admin");
      } else {
        await supabase.auth.signOut();
        throw new Error("Acesso negado: Sua conta não possui permissão administrativa.");
      }

    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: error.message || "Erro ao tentar entrar."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {loading ? "Entrando..." : "Entrar no Painel"}
            </Button>
          </form>


          <p className="text-center mt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar para o início
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
