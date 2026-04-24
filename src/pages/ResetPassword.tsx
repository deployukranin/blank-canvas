import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, Eye, EyeOff, Sparkles, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error(t("auth.passwordMin")); return; }
    if (password !== confirmPassword) { toast.error(t("auth.passwordMismatch")); return; }

    setIsSubmitting(true);
    const result = await updatePassword(password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      toast.success(t("auth.passwordUpdateSuccess"));
      await supabase.auth.signOut();
      setTimeout(() => navigate("/auth", { replace: true }), 2000);
    } else {
      toast.error(result.error || t("auth.passwordUpdateError"));
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
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">{t("auth.passwordUpdated")}</h2>
              <p className="text-gray-400 text-sm">{t("auth.redirectingToLogin")}</p>
            </div>
          ) : !isReady ? (
            <div className="text-center space-y-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
              <p className="text-gray-400 text-sm">{t("auth.validatingRecoveryLink")}</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">{t("auth.newPasswordTitle")}</h2>
                <p className="text-gray-500 text-sm mt-1">{t("auth.newPasswordDesc")}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-gray-300 text-sm">{t("auth.newPasswordLabel")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:ring-purple-500/20 focus-visible:border-purple-500"
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
                  <Label htmlFor="confirm-password" className="text-gray-300 text-sm">{t("auth.confirmNewPassword")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {t("auth.updatePassword")}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
