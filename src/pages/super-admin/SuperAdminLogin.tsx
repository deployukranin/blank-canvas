import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, Eye, EyeOff, Zap, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, signIn, session } = useAuth();
  const { isSuperAdmin, hasRole, isLoading: rolesLoading } = useUserRole();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!authLoading && !rolesLoading && isAuthenticated && session) {
      if (isSuperAdmin()) navigate("/admin-master", { replace: true });
      else if (hasRole("partner")) navigate("/partner", { replace: true });
    }
  }, [isAuthenticated, authLoading, rolesLoading, session, isSuperAdmin, hasRole, navigate]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) { toast.error("Email inválido"); return; }
    if (password.length < 6) { toast.error("Senha deve ter pelo menos 6 caracteres"); return; }

    setIsSubmitting(true);
    const result = await signIn(email, password);

    if (result.success) {
      // Role check will happen via useEffect after auth state updates
      toast.success("Autenticando...");
    } else {
      toast.error(result.error || "Credenciais inválidas");
    }
    setIsSubmitting(false);
  };

  // After login, check if user is super_admin
  useEffect(() => {
    if (isAuthenticated && !rolesLoading && session) {
      if (isSuperAdmin()) {
        navigate("/admin-master", { replace: true });
      } else if (!authLoading) {
        toast.error("Acesso negado: você não é Super Admin");
      }
    }
  }, [isAuthenticated, rolesLoading, isSuperAdmin, session, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">
            Super Admin
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Acesso restrito ao painel mestre
          </p>
        </div>

        <div className="bg-white/[0.03] border border-purple-500/15 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sa-email" className="text-white/70 text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  id="sa-email"
                  type="email"
                  placeholder="admin@plataforma.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 focus:ring-0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sa-password" className="text-white/70 text-sm">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  id="sa-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 focus:ring-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
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
              Acessar Painel Mestre
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Acesso exclusivo para administradores do sistema
        </p>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;
