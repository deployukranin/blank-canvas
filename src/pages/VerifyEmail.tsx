import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmailVerification } from "@/hooks/use-email-verification";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "success" | "error";

/**
 * Landing page for the verification link. The link signs the user in, so we
 * simply mark the profile as verified and send them back to the panel.
 */
const VerifyEmail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { markVerified } = useEmailVerification();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Give supabase-js a moment to consume the tokens from the URL hash.
      for (let i = 0; i < 6; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) break;
        await new Promise((r) => setTimeout(r, 400));
      }
      const ok = await markVerified();
      if (cancelled) return;
      setStatus(ok ? "success" : "error");
      if (ok) {
        setTimeout(() => navigate("/auth?verified=1", { replace: true }), 2200);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [markVerified, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-5">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center backdrop-blur-xl">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-purple-400" />
            <p className="text-white/70 text-sm">
              {t("auth.verify.checking", "Confirmando seu email...")}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">
              {t("auth.verify.successTitle", "Email verificado")}
            </h1>
            <p className="mt-2 text-sm text-white/60">
              {t("auth.verify.successBody", "Tudo pronto! Você já pode usar todos os recursos do painel.")}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <MailWarning className="mx-auto mb-4 h-12 w-12 text-amber-400" />
            <h1 className="text-xl font-bold text-white">
              {t("auth.verify.errorTitle", "Não foi possível verificar")}
            </h1>
            <p className="mt-2 text-sm text-white/60">
              {t("auth.verify.errorBody", "O link pode ter expirado. Entre no painel e reenvie o email de verificação.")}
            </p>
            <Button className="mt-6" onClick={() => navigate("/auth", { replace: true })}>
              {t("auth.verify.backToPanel", "Ir para o painel")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
