import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) { toast.error("Email inválido"); return; }
    setIsSubmitting(true);
    const result = await resetPassword(email);
    setIsSubmitting(false);
    if (result.success) {
      setSent(true);
    } else {
      toast.error(result.error || "Erro ao enviar email");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-6 py-12"
      style={{ '--ring': '263 70% 58%', '--primary': '263 70% 58%', '--input': '0 0% 12%' } as React.CSSProperties}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg font-['Space_Grotesk']">Creator Platform</span>
        </div>

        <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">Email enviado!</h2>
              <p className="text-gray-400 text-sm">
                Enviamos um link de recuperação para <span className="text-white">{email}</span>.
                Verifique sua caixa de entrada (e spam).
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm pt-4"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">Recuperar senha</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Digite seu email e enviaremos um link para criar uma nova senha
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:ring-purple-500/20 focus-visible:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11 font-medium"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Enviar link de recuperação
                </Button>

                <Link
                  to="/auth"
                  className="flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm pt-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar para o login
                </Link>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
