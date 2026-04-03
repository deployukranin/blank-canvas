import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, Eye, EyeOff, User, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const ClientAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, signIn, signUp } = useAuth();
  const { store, basePath, isTenantScope } = useTenant();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const homePath = isTenantScope ? basePath : "/";

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(homePath, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, homePath]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(loginEmail)) { toast.error("Email inválido"); return; }
    if (loginPassword.length < 6) { toast.error("Senha deve ter pelo menos 6 caracteres"); return; }

    setIsSubmitting(true);
    const result = await signIn(loginEmail, loginPassword);

    if (result.success) {
      // If in tenant context, ensure user is linked to this store
      if (store?.id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Link to store if not already
          await supabase.from("store_users").upsert(
            { store_id: store.id, user_id: user.id },
            { onConflict: "store_id,user_id" }
          ).select();
        }
      }
      toast.success("Bem-vindo de volta! 🎉");
      navigate(homePath, { replace: true });
    } else {
      toast.error(result.error || "Erro ao fazer login");
    }
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) { toast.error("Digite seu nome"); return; }
    if (!validateEmail(signupEmail)) { toast.error("Email inválido"); return; }
    if (signupPassword.length < 6) { toast.error("Senha deve ter pelo menos 6 caracteres"); return; }
    if (signupPassword !== signupConfirmPassword) { toast.error("As senhas não coincidem"); return; }

    setIsSubmitting(true);
    try {
      const result = await signUp(signupEmail, signupPassword);

      if (!result.success) {
        toast.error(result.error || "Erro ao criar conta");
        setIsSubmitting(false);
        return;
      }

      // Wait for session
      await new Promise(resolve => setTimeout(resolve, 1000));

      let userId: string | null = null;
      for (let i = 0; i < 3; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          userId = session.user.id;
          break;
        }
        if (i === 1) {
          const { data } = await supabase.auth.signInWithPassword({
            email: signupEmail, password: signupPassword,
          });
          if (data?.session?.user?.id) {
            userId = data.session.user.id;
            break;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!userId) {
        toast.error("Erro ao obter sessão. Tente fazer login.");
        setIsSubmitting(false);
        return;
      }

      // Assign 'client' role
      await supabase.from("user_roles").insert({ user_id: userId, role: "client" as any });

      // Create profile with display name
      await supabase.from("profiles").upsert({
        user_id: userId,
        display_name: signupName.trim(),
      }, { onConflict: "user_id" });

      // Link to store if in tenant context
      if (store?.id) {
        await supabase.from("store_users").upsert(
          { store_id: store.id, user_id: userId },
          { onConflict: "store_id,user_id" }
        ).select();
      }

      toast.success("Conta criada com sucesso! 🎉");
      navigate(homePath, { replace: true });
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Erro ao criar conta");
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

  const storeName = store?.name || "a comunidade";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          {store?.avatar_url ? (
            <img src={store.avatar_url} alt={store.name} className="w-14 h-14 rounded-2xl mb-4 object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">
            {store?.name || "Bem-vindo"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Entre ou crie sua conta para participar
          </p>
        </div>

        <div className="glass rounded-2xl p-6 border border-primary/10">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-login-email" className="text-foreground text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="client-login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-login-password" className="text-foreground text-sm">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="client-login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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

                <Button type="submit" className="w-full h-11 font-medium" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-signup-name" className="text-foreground text-sm">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="client-signup-name"
                      type="text"
                      placeholder="Seu nome"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-signup-email" className="text-foreground text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="client-signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-signup-password" className="text-foreground text-sm">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="client-signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
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

                <div className="space-y-2">
                  <Label htmlFor="client-signup-confirm" className="text-foreground text-sm">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="client-signup-confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 font-medium" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Criar Conta
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Ao criar sua conta, você concorda com nossos{" "}
                  <a href="/terms" className="text-primary hover:underline">Termos de Uso</a>{" "}
                  e{" "}
                  <a href="/privacy" className="text-primary hover:underline">Política de Privacidade</a>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
};

export default ClientAuth;
