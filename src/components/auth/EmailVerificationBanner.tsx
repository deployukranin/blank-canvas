import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MailCheck, MailWarning, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEmailVerification } from "@/hooks/use-email-verification";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN = 60;

interface EmailVerificationBannerProps {
  /** Optional email override (used when there is no session yet). */
  email?: string;
  className?: string;
}

export const EmailVerificationBanner = ({ email, className }: EmailVerificationBannerProps) => {
  const { t } = useTranslation();
  const { isLoading, authenticated, verified, email: sessionEmail, sendVerificationEmail } =
    useEmailVerification();
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const targetEmail = email || sessionEmail;

  if (isLoading || !authenticated || verified || !targetEmail) return null;

  const handleResend = async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    const result = await sendVerificationEmail();
    setSending(false);
    if (!result.success) {
      if (result.error === "cooldown") {
        setCooldown(RESEND_COOLDOWN);
        return;
      }
      toast.error(t("auth.verify.resendError", "Não foi possível reenviar o email. Tente novamente em instantes."));
      return;
    }
    setCooldown(RESEND_COOLDOWN);
    toast.success(t("auth.verify.resendSuccess", "Email de confirmação reenviado."));
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm",
        className
      )}
      role="status"
    >
      <MailWarning className="w-5 h-5 text-amber-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-amber-200">{t("auth.verify.title", "Email não verificado")}</p>
        <p className="text-amber-200/70 text-xs mt-0.5 break-words">
          {t("auth.verify.description", "Confirme seu email para liberar todos os recursos.")}{" "}
          <span className="font-medium text-amber-100">{targetEmail}</span>
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleResend}
        disabled={sending || cooldown > 0}
        className="shrink-0 border-amber-500/40 bg-transparent text-amber-100 hover:bg-amber-500/20 hover:text-amber-50"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <MailCheck className="w-4 h-4 mr-2" />
        )}
        {cooldown > 0
          ? t("auth.verify.resendIn", "Reenviar em {{seconds}}s", { seconds: cooldown })
          : t("auth.verify.resend", "Reenviar email")}
      </Button>
    </div>
  );
};

export default EmailVerificationBanner;
