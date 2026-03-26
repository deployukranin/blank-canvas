import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles, Palette, BarChart3, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const features = [
  { icon: Palette, title: "Plataforma personalizada", desc: "Tema, cores e layout 100% customizáveis" },
  { icon: BarChart3, title: "Painel administrativo", desc: "Dashboard completo com métricas e gestão" },
  { icon: Users, title: "Gestão de fãs", desc: "Comunidade, VIP e pedidos personalizados" },
  { icon: Sparkles, title: "Integração YouTube", desc: "Importe vídeos automaticamente do seu canal" },
];

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, signIn, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const checkUserRoles = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = data?.map((r) => r.role) || [];
    return { isAdmin: roles.includes("admin") || roles.includes("ceo") };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(loginEmail)) { toast.error("Digite um email válido"); return; }
    if (loginPassword.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }

    setIsSubmitting(true);
    const result = await signIn(loginEmail, loginPassword);

    if (result.success) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { isAdmin } = await checkUserRoles(user.id);
        if (isAdmin) {
          toast.success("🛡️ Bem-vindo de volta!");
          navigate("/admin", { replace: true });
        } else {
          toast.success("Login realizado com sucesso!");
          navigate("/", { replace: true });
        }
      } else {
        navigate("/", { replace: true });
      }
    } else {
      toast.error(result.error || "Erro ao fazer login");
    }
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(signupEmail)) { toast.error("Digite um email válido"); return; }
    if (signupPassword.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    if (signupPassword !== signupConfirmPassword) { toast.error("As senhas não coincidem"); return; }

    setIsSubmitting(true);
    const result = await signUp(signupEmail, signupPassword);

    if (result.success) {
      toast.success("Conta criada com sucesso! Bem-vindo à plataforma.");
      navigate("/admin", { replace: true });
    } else {
      toast.error(result.error || "Erro ao criar conta");
    }
    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {/* Left side — Branding / Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-[#0a0a0a] to-[#0a0a0a]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col justify-center px-16 py-12 w-full">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight font-['Space_Grotesk']">
                Creator Platform
              </span>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4 leading-tight font-['Space_Grotesk']">
              Crie sua plataforma
              <br />
              <span className="text-purple-400">de conteúdo ASMR</span>
            </h1>

            <p className="text-gray-400 text-lg mb-12 max-w-md">
              Tenha sua própria plataforma personalizada com painel admin, gestão de fãs e integração com YouTube.
            </p>

            <div className="space-y-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{feature.title}</h3>
                    <p className="text-gray-500 text-sm">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side — Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg font-['Space_Grotesk']">Creator Platform</span>
          </div>

          <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">
                {defaultTab === "signup" ? "Criar sua plataforma" : "Entrar na plataforma"}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {defaultTab === "signup"
                  ? "Preencha seus dados para começar"
                  : "Acesse seu painel de criador"
                }
              </p>
            </div>

            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/[0.04] border border-white/[0.06]">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400"
                >
                  Criar Conta
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-300 text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-300 text-sm">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-11"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-300 text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-300 text-sm">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm" className="text-gray-300 text-sm">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id="signup-confirm"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500/20"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-11"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Criar Conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-center text-xs text-gray-600 mt-6">
              Ao continuar, você concorda com nossos{" "}
              <a href="/termos" className="text-purple-400 hover:underline">Termos de Uso</a>{" "}
              e{" "}
              <a href="/privacidade" className="text-purple-400 hover:underline">Política de Privacidade</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
