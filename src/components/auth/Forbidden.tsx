import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ForbiddenProps {
  message?: string;
  homeHref?: string;
}

export const Forbidden = ({
  message = "Você não tem permissão para acessar esta página.",
  homeHref = "/",
}: ForbiddenProps) => {
  return (
    <div
      role="alert"
      aria-label="403 Forbidden"
      className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-6"
    >
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-red-400 mb-2">
            403 — Acesso negado
          </p>
          <h1 className="text-2xl font-semibold text-white mb-2">
            Permissão insuficiente
          </h1>
          <p className="text-sm text-white/60">{message}</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link to={homeHref}>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
