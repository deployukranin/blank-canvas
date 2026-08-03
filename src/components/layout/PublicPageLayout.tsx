import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/primitives";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import logo from "@/assets/mytinglebox-logo.png";

const Starfield = () => (
  <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
    <div
      className="absolute inset-0 opacity-[0.18]"
      style={{
        backgroundImage:
          "radial-gradient(1px 1px at 20% 30%, hsl(270 80% 80%) 50%, transparent), radial-gradient(1px 1px at 70% 60%, hsl(280 80% 85%) 50%, transparent), radial-gradient(1.5px 1.5px at 40% 80%, hsl(260 80% 75%) 50%, transparent), radial-gradient(1px 1px at 90% 20%, hsl(290 80% 85%) 50%, transparent), radial-gradient(1px 1px at 10% 70%, hsl(270 70% 80%) 50%, transparent)",
        backgroundSize: "600px 600px",
        backgroundRepeat: "repeat",
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/50 to-[#0a0a0f]" />
    <div
      className="absolute -top-52 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full opacity-25 blur-3xl"
      style={{ background: "radial-gradient(circle, hsl(263 90% 62% / 0.35) 0%, transparent 70%)" }}
    />
    <div className="absolute -left-24 top-1/3 w-[420px] h-[420px] rounded-full bg-[#8b5cf6]/10 blur-[130px]" />
  </div>
);

interface PublicPageLayoutProps {
  title: string;
  subtitle?: string;
  eyebrow?: ReactNode;
  children: ReactNode;
}

export const PublicPageLayout = ({ title, subtitle, eyebrow, children }: PublicPageLayoutProps) => {
  const { t } = useTranslation();

  const links = [
    { to: "/help", label: t("storefront.helpTitle") },
    { to: "/terms", label: t("terms.title") },
    { to: "/privacy", label: t("privacy.title") },
  ];

  return (
    <div
      className="min-h-screen flex flex-col font-body bg-[#0a0a0f] text-white overflow-x-hidden relative"
      style={{ "--ring": "263 70% 58%", "--primary": "263 70% 58%" } as React.CSSProperties}
    >
      <Starfield />

      <header className="relative z-20 border-b border-white/[0.08] backdrop-blur-xl bg-[#0a0a0f]/70">
        <Container width="lg">
          <div className="h-16 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center shrink-0">
              <img src={logo} alt="MyTingleBox" className="h-7 w-auto" />
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSelector variant="minimal" />
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-white/[0.1] bg-white/[0.03] text-[13px] text-white/70 hover:text-white hover:border-[#8b5cf6]/40 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t("common.backHome", "Início")}</span>
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <main className="relative z-10 flex-1 pt-12 pb-20">
        <Container width="md">
          <div className="max-w-3xl mx-auto">
            <header className="mb-8">
              {eyebrow}
              <h1
                className="font-display font-bold tracking-tight leading-[1.1] mt-3"
                style={{ fontSize: "clamp(1.85rem, 2.5vw + 1rem, 2.75rem)" }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="mt-3 text-[15px] text-white/50 leading-relaxed">{subtitle}</p>
              )}
            </header>

            {children}
          </div>
        </Container>
      </main>

      <footer className="relative z-10 border-t border-white/[0.08] py-8">
        <Container width="md">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} MyTingleBox
            </p>
            <nav className="flex items-center gap-5 text-xs">
              {links.map((l) => (
                <Link key={l.to} to={l.to} className="text-white/45 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </Container>
      </footer>
    </div>
  );
};
