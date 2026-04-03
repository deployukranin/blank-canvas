import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, Eye, EyeOff, User, Sparkles } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";
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
  const { config } = useWhiteLabel();
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

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Erro ao entrar com Google");
        setIsSubmitting(false);
        return;
      }
      if (result.redirected) return;
      // Session set - useEffect will redirect
    } catch {
      toast.error("Erro ao entrar com Google");
      setIsSubmitting(false);
    }
  };

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
                {/* Google Sign-In */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 font-medium gap-3"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Entrar com Google
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou com email</span>
                  </div>
                </div>

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
                {/* Google Sign-Up */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 font-medium gap-3"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Cadastrar com Google
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou com email</span>
                  </div>
                </div>

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
