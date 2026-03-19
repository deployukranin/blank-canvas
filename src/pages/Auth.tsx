import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Mail, Lock, Eye, EyeOff, Shield, Store, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, signIn, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup fields
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Redirect will be handled after role check
    }
  }, [isAuthenticated, authLoading, navigate]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  };

  const redirectByRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roles = data?.map((r) => r.role) || [];

    if (roles.includes("ceo")) {
      toast.success("👑 Bem-vindo, CEO!");
      navigate("/ceo", { replace: true });
    } else if (roles.includes("admin")) {
      toast.success("🛡️ Bem-vindo, Admin!");
      navigate("/admin", { replace: true });
    } else {
      // Check if user belongs to a store as user
      const { data: membership } = await supabase
        .from("store_users")
        .select("store_id, stores(slug)")
        .eq("user_id", userId)
        .limit(1)
        .single();

      if (membership?.stores && typeof membership.stores === 'object' && 'slug' in membership.stores) {
        const slug = (membership.stores as { slug: string }).slug;
        navigate(`/loja/${slug}`, { replace: true });
      } else {
        toast.error("Nenhuma loja encontrada para sua conta.");
        await supabase.auth.signOut();
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(loginEmail)) {
      toast.error("Digite um email válido");
      return;
    }
    if (loginPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);

    const result = await signIn(loginEmail, loginPassword);

    if (result.success) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await redirectByRole(user.id);
      }
    } else {
      toast.error(result.error || "Erro ao fazer login");
    }
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeName.trim() || storeName.trim().length < 3) {
      toast.error("Nome da loja deve ter pelo menos 3 caracteres");
      return;
    }
    if (!validateEmail(signupEmail)) {
      toast.error("Digite um email válido");
      return;
    }
    if (signupPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsSubmitting(true);

    // Check slug availability
    const slug = generateSlug(storeName.trim());
    const { data: existingStore } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingStore) {
      toast.error("Já existe uma loja com esse nome. Escolha outro.");
      setIsSubmitting(false);
      return;
    }

    // Create account
    const result = await signUp(signupEmail, signupPassword);

    if (!result.success) {
      toast.error(result.error || "Erro ao criar conta");
      setIsSubmitting(false);
      return;
    }

    // Wait for session
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.success("Verifique seu email para confirmar a conta e depois faça login.");
      setIsSubmitting(false);
      return;
    }

    // Create store
    const { data: newStore, error: storeError } = await supabase
      .from("stores")
      .insert({
        name: storeName.trim(),
        slug,
        created_by: user.id,
        status: "active",
      })
      .select("id")
      .single();

    if (storeError || !newStore) {
      console.error("Error creating store:", storeError);
      toast.error("Conta criada, mas erro ao criar loja. Contate o suporte.");
      setIsSubmitting(false);
      return;
    }

    // Link as store admin
    await supabase.from("store_admins").insert({
      store_id: newStore.id,
      user_id: user.id,
    });

    // Assign admin role
    await supabase.from("user_roles").insert({
      user_id: user.id,
      role: "admin" as any,
    });

    toast.success("🎉 Loja criada com sucesso! Bem-vindo ao painel admin!");
    navigate("/admin", { replace: true });

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
        <GlassCard className="p-6 sm:p-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Store className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
              Área do Criador
            </h1>
            <p className="text-muted-foreground text-sm">
              Crie sua loja ou acesse seu painel
            </p>
          </div>

          <Tabs defaultValue={searchParams.get("tab") === "signup" ? "signup" : "login"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Loja</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="admin@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
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

                <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            {/* Signup Tab - Create Store */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Nome da Loja</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="store-name"
                      type="text"
                      placeholder="Minha Loja ASMR"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="pl-10"
                      maxLength={50}
                      required
                    />
                  </div>
                  {storeName.trim().length >= 3 && (
                    <p className="text-xs text-muted-foreground">
                      URL: /<span className="text-primary font-medium">{generateSlug(storeName.trim())}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
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
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
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
                  <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Criar Loja Grátis
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Ao continuar, você concorda com nossos{" "}
            <a href="/termos" className="text-primary hover:underline">Termos de Uso</a>{" "}
            e{" "}
            <a href="/privacidade" className="text-primary hover:underline">Privacidade</a>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Auth;
