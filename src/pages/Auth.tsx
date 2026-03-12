import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error("Digite um email válido");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);

    const result = await signIn(email, password);

    if (result.success) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        const roles = data?.map((r) => r.role) || [];

        if (roles.includes("ceo")) {
          toast.success("👑 Bem-vindo, CEO!");
          navigate("/ceo", { replace: true });
        } else if (roles.includes("admin")) {
          toast.success("🛡️ Bem-vindo, Admin!");
          navigate("/admin", { replace: true });
        } else {
          // Regular user trying admin login — check if they belong to a store
          const { data: membership } = await supabase
            .from("store_users")
            .select("store_id, stores(slug)")
            .eq("user_id", user.id)
            .limit(1)
            .single();

          if (membership?.stores && typeof membership.stores === 'object' && 'slug' in membership.stores) {
            const slug = (membership.stores as { slug: string }).slug;
            toast.info("Redirecionando para sua loja...");
            navigate(`/loja/${slug}`, { replace: true });
          } else {
            toast.error("Acesso restrito a administradores. Se você é um usuário, acesse sua loja diretamente.");
            await supabase.auth.signOut();
          }
        }
      }
    } else {
      toast.error(result.error || "Erro ao fazer login");
    }
    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Acesso Administrativo
            </h1>
            <p className="text-muted-foreground text-sm">
              Login exclusivo para Admin e CEO
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="admin@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Entrar
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            É um usuário? Acesse a loja do seu criador para entrar.
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Auth;
