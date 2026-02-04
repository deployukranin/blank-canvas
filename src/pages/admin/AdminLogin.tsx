import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    // Only check session once on mount
    if (!hasCheckedSession.current) {
      hasCheckedSession.current = true;
      checkExistingSession();
    }
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        if (!error && roles) {
          const userRoles = roles.map(r => r.role);
          
          if (userRoles.includes('ceo')) {
            navigate("/ceo", { replace: true });
            return;
          } else if (userRoles.includes('admin')) {
            navigate("/admin", { replace: true });
            return;
          }
        }
      }
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
    } finally {
      setCheckingSession(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Login with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error("Email ou senha incorretos.");
      if (!data.user) throw new Error("Erro de autenticação.");

      // 2. Check user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      if (rolesError) {
        console.error("Erro ao buscar roles:", rolesError);
        throw new Error("Erro ao verificar permissões.");
      }

      const userRoles = roles?.map(r => r.role) || [];

      // Redirect based on role
      if (userRoles.includes('ceo')) {
        toast({
          title: "Acesso Permitido",
          description: "Bem-vindo ao painel, CEO."
        });
        navigate("/ceo", { replace: true });
      } else if (userRoles.includes('admin')) {
        toast({
          title: "Acesso Permitido",
          description: "Bem-vindo ao painel, ADMIN."
        });
        navigate("/admin", { replace: true });
      } else {
        // User doesn't have admin/ceo role - sign out
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

  // Show loading while checking existing session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    );
  }

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
                autoComplete="email"
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
                  autoComplete="current-password"
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
