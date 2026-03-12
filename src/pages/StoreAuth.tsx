import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Mail, Lock, Eye, EyeOff, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const StoreAuth = () => {
  const navigate = useNavigate();
  const { store } = useStore();
  const { signIn, signUp } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const linkUserToStore = async (userId: string, storeId: string) => {
    await supabase
      .from("store_users")
      .upsert(
        { user_id: userId, store_id: storeId },
        { onConflict: "store_id,user_id" }
      );
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    if (!validateEmail(loginEmail)) { toast.error("Digite um email válido"); return; }
    if (loginPassword.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }

    setIsSubmitting(true);
    const result = await signIn(loginEmail, loginPassword);

    if (result.success) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: membership } = await supabase
          .from("store_users")
          .select("id")
          .eq("user_id", user.id)
          .eq("store_id", store.id)
          .single();

        if (!membership) {
          await supabase.auth.signOut();
          toast.error("Sua conta não está vinculada a esta loja. Crie uma conta aqui.");
          setIsSubmitting(false);
          return;
        }

        toast.success(`Bem-vindo à ${store.name}!`);
        navigate(`/loja/${store.slug}`, { replace: true });
      }
    } else {
      toast.error(result.error || "Erro ao fazer login");
    }
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    if (!validateEmail(signupEmail)) { toast.error("Digite um email válido"); return; }
    if (signupPassword.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    if (signupPassword !== signupConfirmPassword) { toast.error("As senhas não coincidem"); return; }

    setIsSubmitting(true);
    const result = await signUp(signupEmail, signupPassword);

    if (result.success) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await linkUserToStore(user.id, store.id);
      }
      toast.success(`Conta criada na ${store.name}! Bem-vindo!`);
      navigate(`/loja/${store.slug}`, { replace: true });
    } else {
      toast.error(result.error || "Erro ao criar conta");
    }
    setIsSubmitting(false);
  };

  if (!store) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-6 sm:p-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Store className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{store.name}</h1>
            <p className="text-muted-foreground text-sm">Entre ou crie sua conta nesta loja</p>
          </div>

          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store-login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="store-login-email" type="email" placeholder="seu@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="store-login-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store-signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="store-signup-email" type="email" placeholder="seu@email.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="store-signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-signup-confirm">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="store-signup-confirm" type={showPassword ? "text" : "password"} placeholder="••••••••" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Criar Conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Ao continuar, você concorda com nossos{" "}
            <a href="/termos" className="text-primary hover:underline">Termos de Uso</a>{" "}e{" "}
            <a href="/privacidade" className="text-primary hover:underline">Política de Privacidade</a>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default StoreAuth;
