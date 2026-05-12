import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Play,
  Crown,
  Video,
  Users,
  Wallet,
  ShieldCheck,
  Zap,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/mytinglebox-logo.png";
import heroMockup from "@/assets/landing-hero-mockup.jpg";

interface PlatformPlanConfig {
  id: string;
  name_pt: string;
  name_en: string;
  name_es: string;
  period: "monthly" | "quarterly" | "annual";
  priceBRL: number;
  priceUSD: number;
  features_pt: string[];
  features_en: string[];
  features_es: string[];
  highlight?: boolean;
}

const features = [
  {
    icon: Video,
    title: "Vídeos Personalizados",
    desc: "Receba pedidos de vídeos sob medida e cobre o que quiser, a partir de R$ 10.",
  },
  {
    icon: Crown,
    title: "Área VIP Exclusiva",
    desc: "Monetize conteúdo premium com assinaturas recorrentes para seus fãs mais fiéis.",
  },
  {
    icon: Users,
    title: "Comunidade Própria",
    desc: "Engaje sua audiência com posts, ideias de vídeos e interação direta.",
  },
  {
    icon: Wallet,
    title: "Pagamentos Integrados",
    desc: "Stripe e PIX nativos. Receba direto na sua conta, sem intermediários.",
  },
  {
    icon: ShieldCheck,
    title: "Marca Própria",
    desc: "Domínio personalizado, cores, logo e identidade 100% sua.",
  },
  {
    icon: Zap,
    title: "Setup em Minutos",
    desc: "Crie sua loja, configure e publique no mesmo dia. Sem código.",
  },
];

const plans = [
  {
    name: "Básico",
    price: "R$ 49",
    period: "/mês",
    desc: "Para começar a monetizar.",
    features: [
      "Loja personalizada",
      "Vídeos sob demanda",
      "Pagamentos PIX & Stripe",
      "Suporte por email",
    ],
    cta: "Começar grátis",
    highlight: false,
  },
  {
    name: "Profissional",
    price: "R$ 99",
    period: "/mês",
    desc: "Para criadores em crescimento.",
    features: [
      "Tudo do Básico",
      "Área VIP com assinaturas",
      "Comunidade integrada",
      "Domínio personalizado",
      "Métricas avançadas",
    ],
    cta: "Testar 7 dias grátis",
    highlight: true,
  },
  {
    name: "Premium",
    price: "R$ 199",
    period: "/mês",
    desc: "Para criadores estabelecidos.",
    features: [
      "Tudo do Profissional",
      "Suporte prioritário",
      "0% de taxa da plataforma",
      "Branding white-label total",
      "Onboarding dedicado",
    ],
    cta: "Falar com vendas",
    highlight: false,
  },
];

const Landing = () => {
  useEffect(() => {
    document.title = "TingleBox — A plataforma white-label para criadores ASMR";
    const meta = document.querySelector('meta[name="description"]');
    const content =
      "Crie sua loja ASMR, venda vídeos personalizados, monetize conteúdo VIP e construa sua comunidade. Setup em minutos, sem código.";
    if (meta) meta.setAttribute("content", content);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0418] text-foreground overflow-x-hidden relative">
      {/* Starfield background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%, hsl(270 80% 80%) 50%, transparent), radial-gradient(1px 1px at 70% 60%, hsl(280 80% 85%) 50%, transparent), radial-gradient(1.5px 1.5px at 40% 80%, hsl(260 80% 75%) 50%, transparent), radial-gradient(1px 1px at 90% 20%, hsl(290 80% 85%) 50%, transparent), radial-gradient(1px 1px at 10% 70%, hsl(270 70% 80%) 50%, transparent)",
            backgroundSize: "600px 600px",
            backgroundRepeat: "repeat",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0418]/40 to-[#0a0418]" />
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, hsl(270 90% 60% / 0.4) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm mb-8">
            <Crown className="w-4 h-4 text-purple-300" />
            <span className="text-sm text-purple-100">
              A plataforma de criadores ASMR mais completa do Mundo
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-white leading-[1.05]">
            Sua audiência em
            <br />
            <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500 bg-clip-text text-transparent">
              uma plataforma só sua
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
            Venda vídeos personalizados, monetize conteúdo VIP e construa sua
            comunidade — tudo com sua marca, sem intermediários.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-7 h-12 gap-2 shadow-xl shadow-purple-500/40"
              >
                <Sparkles className="w-4 h-4" />
                Começar grátis
              </Button>
            </Link>
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white rounded-full px-7 h-12 gap-2 backdrop-blur-sm"
              >
                <Play className="w-4 h-4" />
                Ver recursos
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Hero mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mt-20 max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-2 shadow-2xl shadow-purple-500/20">
            <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0f0820]">
              <img
                src={heroMockup}
                alt="Pré-visualização da plataforma TingleBox para criadores ASMR"
                className="w-full h-auto block"
                width={1376}
                height={768}
              />
            </div>
          </div>
          <div
            className="absolute -inset-x-20 -bottom-20 h-40 blur-3xl opacity-50 -z-10"
            style={{
              background:
                "linear-gradient(to right, hsl(270 90% 50%), hsl(290 90% 60%))",
            }}
          />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-purple-300 text-sm font-medium uppercase tracking-wider">
              Recursos
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
              Tudo que você precisa para
              <br />
              <span className="bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
                viver da sua arte
              </span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Uma plataforma completa, pensada para criadores ASMR que querem
              independência e crescimento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 hover:border-purple-500/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-5 group-hover:bg-purple-500/25 transition-colors">
                  <f.icon className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-purple-300 text-sm font-medium uppercase tracking-wider">
              Planos
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
              Escolha o plano
              <br />
              <span className="bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
                ideal para você
              </span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Comece grátis com 7 dias de teste. Sem cartão de crédito.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`relative rounded-2xl border p-7 ${
                  p.highlight
                    ? "border-purple-500/60 bg-gradient-to-b from-purple-600/20 to-purple-900/10 shadow-2xl shadow-purple-500/20 md:scale-105"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-semibold">
                    Mais popular
                  </div>
                )}

                <h3 className="font-display text-xl font-bold text-white mb-1">
                  {p.name}
                </h3>
                <p className="text-sm text-white/60 mb-5">{p.desc}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">
                    {p.price}
                  </span>
                  <span className="text-white/50 text-sm">{p.period}</span>
                </div>

                <Link to="/auth">
                  <Button
                    className={`w-full rounded-full mb-6 ${
                      p.highlight
                        ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30"
                        : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                    }`}
                  >
                    {p.cta}
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {p.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 text-sm text-white/70"
                    >
                      <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="cta" className="relative z-10 px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 via-purple-700/10 to-transparent p-12 md:p-16 text-center overflow-hidden">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(circle at center, hsl(270 90% 50% / 0.4) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                Pronto para começar
                <br />
                <span className="bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
                  sua jornada?
                </span>
              </h2>
              <p className="text-white/70 max-w-xl mx-auto mb-8">
                Junte-se aos criadores que já estão transformando sua audiência
                em renda recorrente.
              </p>
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 h-12 gap-2 shadow-xl shadow-purple-500/40"
                >
                  Criar minha loja agora
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Landing;
