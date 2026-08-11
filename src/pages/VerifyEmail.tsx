import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmailVerification } from "@/hooks/use-email-verification";

type Status = "loading" | "success" | "error";

/**
 * Landing page for the verification link. The confirmation itself happens on
 * the server (platform-domain endpoint), which redirects back here with a
 * status. No auth session is required.
 */
const VerifyEmail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refresh } = useEmailVerification();

  const initial = useMemo<Status>(() => {
    const s = params.get("status");
    if (s === "success") return "success";
    if (s) return "error";
    return "loading";
  }, [params]);

  const [status, setStatus] = useState<Status>(initial);

  useEffect(() => {
    if (initial === "success") {
      refresh();
      const id = setTimeout(() => navigate("/auth?verified=1", { replace: true }), 2200);
      return () => clearTimeout(id);
    }
    if (initial === "loading") {
      // Reached without a status param — nothing to confirm here.
      const id = setTimeout(() => setStatus("error"), 800);
      return () => clearTimeout(id);
    }
  }, [initial, navigate, refresh]);

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
