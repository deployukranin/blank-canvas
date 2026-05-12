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

type Lang = "pt" | "en" | "es";

const tr = {
  pt: {
    badge: "A plataforma de criadores ASMR mais completa do Mundo",
    heroTitle1: "Sua audiência em",
    heroTitle2: "uma plataforma só sua",
    heroSub:
      "Venda vídeos personalizados, monetize conteúdo VIP e construa sua comunidade — tudo com sua marca, sem intermediários.",
    ctaStart: "Começar grátis",
    ctaSeeFeatures: "Ver recursos",
    heroAlt: "Pré-visualização da plataforma TingleBox para criadores ASMR",
    featuresKicker: "Recursos",
    featuresTitle1: "Tudo que você precisa para",
    featuresTitle2: "viver da sua arte",
    featuresSub:
      "Uma plataforma completa, pensada para criadores ASMR que querem independência e crescimento.",
    pricingKicker: "Planos",
    pricingTitle1: "Escolha o plano",
    pricingTitle2: "ideal para você",
    pricingSub: "Comece grátis com 7 dias de teste. Sem cartão de crédito.",
    mostPopular: "Mais popular",
    ctaFinalTitle1: "Pronto para começar",
    ctaFinalTitle2: "sua jornada?",
    ctaFinalSub:
      "Junte-se aos criadores que já estão transformando sua audiência em renda recorrente.",
    ctaFinalBtn: "Criar minha loja agora",
    docTitle: "TingleBox — A plataforma white-label para criadores ASMR",
    docDesc:
      "Crie sua loja ASMR, venda vídeos personalizados, monetize conteúdo VIP e construa sua comunidade. Setup em minutos, sem código.",
    features: [
      { title: "Vídeos Personalizados", desc: "Receba pedidos de vídeos sob medida e cobre o que quiser, a partir de R$ 10." },
      { title: "Área VIP Exclusiva", desc: "Monetize conteúdo premium com assinaturas recorrentes para seus fãs mais fiéis." },
      { title: "Comunidade Própria", desc: "Engaje sua audiência com posts, ideias de vídeos e interação direta." },
      { title: "Pagamentos Integrados", desc: "Stripe e PIX nativos. Receba direto na sua conta, sem intermediários." },
      { title: "Marca Própria", desc: "Domínio personalizado, cores, logo e identidade 100% sua." },
      { title: "Setup em Minutos", desc: "Crie sua loja, configure e publique no mesmo dia. Sem código." },
    ],
  },
  en: {
    badge: "The most complete ASMR creator platform in the world",
    heroTitle1: "Your audience on",
    heroTitle2: "a platform that's all yours",
    heroSub:
      "Sell custom videos, monetize VIP content and build your community — all under your brand, no middlemen.",
    ctaStart: "Get started free",
    ctaSeeFeatures: "See features",
    heroAlt: "Preview of the TingleBox platform for ASMR creators",
    featuresKicker: "Features",
    featuresTitle1: "Everything you need to",
    featuresTitle2: "live from your art",
    featuresSub:
      "A complete platform designed for ASMR creators who want independence and growth.",
    pricingKicker: "Plans",
    pricingTitle1: "Choose the plan",
    pricingTitle2: "that's right for you",
    pricingSub: "Start with a free 7-day trial. No credit card required.",
    mostPopular: "Most popular",
    ctaFinalTitle1: "Ready to start",
    ctaFinalTitle2: "your journey?",
    ctaFinalSub:
      "Join the creators who are already turning their audience into recurring income.",
    ctaFinalBtn: "Create my store now",
    docTitle: "TingleBox — The white-label platform for ASMR creators",
    docDesc:
      "Build your ASMR store, sell custom videos, monetize VIP content and grow your community. Set up in minutes, no code.",
    features: [
      { title: "Custom Videos", desc: "Take tailor-made video orders and charge whatever you want, starting at $5." },
      { title: "Exclusive VIP Area", desc: "Monetize premium content with recurring subscriptions for your most loyal fans." },
      { title: "Your Own Community", desc: "Engage your audience with posts, video ideas and direct interaction." },
      { title: "Integrated Payments", desc: "Native Stripe and PIX. Get paid directly, no middlemen." },
      { title: "Your Own Brand", desc: "Custom domain, colors, logo and 100% your identity." },
      { title: "Setup in Minutes", desc: "Create your store, configure and publish the same day. No code." },
    ],
  },
  es: {
    badge: "La plataforma de creadores ASMR más completa del mundo",
    heroTitle1: "Tu audiencia en",
    heroTitle2: "una plataforma que es solo tuya",
    heroSub:
      "Vende videos personalizados, monetiza contenido VIP y construye tu comunidad — todo con tu marca, sin intermediarios.",
    ctaStart: "Empezar gratis",
    ctaSeeFeatures: "Ver funciones",
    heroAlt: "Vista previa de la plataforma TingleBox para creadores ASMR",
    featuresKicker: "Funciones",
    featuresTitle1: "Todo lo que necesitas para",
    featuresTitle2: "vivir de tu arte",
    featuresSub:
      "Una plataforma completa, pensada para creadores ASMR que quieren independencia y crecimiento.",
    pricingKicker: "Planes",
    pricingTitle1: "Elige el plan",
    pricingTitle2: "ideal para ti",
    pricingSub: "Empieza con 7 días de prueba gratis. Sin tarjeta de crédito.",
    mostPopular: "Más popular",
    ctaFinalTitle1: "¿Listo para comenzar",
    ctaFinalTitle2: "tu camino?",
    ctaFinalSub:
      "Únete a los creadores que ya están convirtiendo su audiencia en ingresos recurrentes.",
    ctaFinalBtn: "Crear mi tienda ahora",
    docTitle: "TingleBox — La plataforma white-label para creadores ASMR",
    docDesc:
      "Crea tu tienda ASMR, vende videos personalizados, monetiza contenido VIP y construye tu comunidad. Configuración en minutos, sin código.",
    features: [
      { title: "Videos Personalizados", desc: "Recibe pedidos de videos a medida y cobra lo que quieras, desde $5." },
      { title: "Área VIP Exclusiva", desc: "Monetiza contenido premium con suscripciones recurrentes para tus fans más fieles." },
      { title: "Comunidad Propia", desc: "Involucra a tu audiencia con publicaciones, ideas de videos e interacción directa." },
      { title: "Pagos Integrados", desc: "Stripe y PIX nativos. Recibe directamente en tu cuenta, sin intermediarios." },
      { title: "Marca Propia", desc: "Dominio personalizado, colores, logo e identidad 100% tuya." },
      { title: "Configuración en Minutos", desc: "Crea tu tienda, configúrala y publícala el mismo día. Sin código." },
    ],
  },
} as const;

const featureIcons = [Video, Crown, Users, Wallet, ShieldCheck, Zap];

const fallbackPlans: PlatformPlanConfig[] = [
  {
    id: "basic",
    name_pt: "Básico", name_en: "Basic", name_es: "Básico",
    period: "monthly",
    priceBRL: 49.9, priceUSD: 9.9,
    features_pt: ["Loja personalizada", "Vídeos sob demanda", "Pagamentos PIX & Stripe", "Suporte por email"],
    features_en: ["Custom store", "On-demand videos", "PIX & Stripe payments", "Email support"],
    features_es: ["Tienda personalizada", "Videos a pedido", "Pagos PIX & Stripe", "Soporte por email"],
  },
  {
    id: "pro",
    name_pt: "Profissional", name_en: "Professional", name_es: "Profesional",
    period: "monthly",
    priceBRL: 99.9, priceUSD: 19.9,
    features_pt: ["Tudo do Básico", "Área VIP com assinaturas", "Comunidade integrada", "Domínio personalizado", "Métricas avançadas"],
    features_en: ["All Basic features", "VIP subscriptions", "Integrated community", "Custom domain", "Advanced metrics"],
    features_es: ["Todo del Básico", "Suscripciones VIP", "Comunidad integrada", "Dominio personalizado", "Métricas avanzadas"],
    highlight: true,
  },
  {
    id: "premium",
    name_pt: "Premium", name_en: "Premium", name_es: "Premium",
    period: "monthly",
    priceBRL: 199.9, priceUSD: 49.9,
    features_pt: ["Tudo do Profissional", "Suporte prioritário", "0% de taxa da plataforma", "Branding white-label total", "Onboarding dedicado"],
    features_en: ["All Professional features", "Priority support", "0% platform fee", "Full white-label", "Dedicated onboarding"],
    features_es: ["Todo del Profesional", "Soporte prioritario", "0% de tarifa", "White-label total", "Onboarding dedicado"],
  },
];

const Landing = () => {
  const { i18n } = useTranslation();
  const lang: Lang = i18n.language?.startsWith("pt")
    ? "pt"
    : i18n.language?.startsWith("es")
    ? "es"
    : "en";
  const isBR = lang === "pt";
  const t = tr[lang];

  const [plans, setPlans] = useState<PlatformPlanConfig[]>(fallbackPlans);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("app_configurations")
        .select("config_value")
        .eq("config_key", "platform_plans")
        .is("store_id", null)
        .maybeSingle();
      const remote = data?.config_value as unknown;
      if (!cancelled && Array.isArray(remote) && remote.length > 0) {
        setPlans(remote as PlatformPlanConfig[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatPrice = (p: PlatformPlanConfig) =>
    new Intl.NumberFormat(isBR ? "pt-BR" : lang === "es" ? "es-ES" : "en-US", {
      style: "currency",
      currency: isBR ? "BRL" : "USD",
      maximumFractionDigits: 0,
    }).format(isBR ? p.priceBRL : p.priceUSD);

  const periodLabel = useMemo(
    () => ({
      monthly: { pt: "/mês", en: "/mo", es: "/mes" }[lang],
      quarterly: { pt: "/trimestre", en: "/quarter", es: "/trimestre" }[lang],
      annual: { pt: "/ano", en: "/year", es: "/año" }[lang],
    }),
    [lang],
  );

  const ctaLabel = (highlight?: boolean) =>
    highlight
      ? { pt: "Testar 7 dias grátis", en: "Try 7 days free", es: "Prueba 7 días gratis" }[lang]
      : { pt: "Começar grátis", en: "Get started", es: "Empezar gratis" }[lang];

  useEffect(() => {
    document.title = t.docTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t.docDesc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = t.docDesc;
      document.head.appendChild(m);
    }
  }, [t.docTitle, t.docDesc]);

  const changeLang = (l: Lang) => {
    i18n.changeLanguage(l);
    try { localStorage.setItem("i18nextLng", l); } catch {}
  };

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

      {/* Language switcher */}
      <div className="relative z-20 flex justify-end px-6 pt-6">
        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm p-1 text-xs">
          {(["pt", "en", "es"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => changeLang(l)}
              className={`px-3 py-1 rounded-full transition-colors ${
                lang === l
                  ? "bg-purple-600 text-white"
                  : "text-white/60 hover:text-white"
              }`}
              aria-label={`Switch language to ${l.toUpperCase()}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-10 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm mb-8">
            <Crown className="w-4 h-4 text-purple-300" />
            <span className="text-sm text-purple-100">{t.badge}</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-white leading-[1.05]">
            {t.heroTitle1}
            <br />
            <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500 bg-clip-text text-transparent">
              {t.heroTitle2}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
            {t.heroSub}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-7 h-12 gap-2 shadow-xl shadow-purple-500/40"
              >
                <Sparkles className="w-4 h-4" />
                {t.ctaStart}
              </Button>
            </Link>
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white rounded-full px-7 h-12 gap-2 backdrop-blur-sm"
              >
                <Play className="w-4 h-4" />
                {t.ctaSeeFeatures}
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
                alt={t.heroAlt}
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
              {t.featuresKicker}
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
              {t.featuresTitle1}
              <br />
              <span className="bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
                {t.featuresTitle2}
              </span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">{t.featuresSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.features.map((f, i) => {
              const Icon = featureIcons[i];
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 hover:border-purple-500/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-5 group-hover:bg-purple-500/25 transition-colors">
                    <Icon className="w-5 h-5 text-purple-300" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-purple-300 text-sm font-medium uppercase tracking-wider">
              {t.pricingKicker}
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
              {t.pricingTitle1}
              <br />
              <span className="bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
                {t.pricingTitle2}
              </span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">{t.pricingSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p, i) => {
              const name = p[`name_${lang}` as const] as string;
              const features = p[`features_${lang}` as const] as string[];
              return (
                <motion.div
                  key={p.id}
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
                      {t.mostPopular}
                    </div>
                  )}

                  <h3 className="font-display text-xl font-bold text-white mb-1">{name}</h3>

                  <div className="flex items-baseline gap-1 mb-6 mt-4">
                    <span className="text-4xl font-bold text-white">{formatPrice(p)}</span>
                    <span className="text-white/50 text-sm">{periodLabel[p.period]}</span>
                  </div>

                  <Link to="/auth">
                    <Button
                      className={`w-full rounded-full mb-6 ${
                        p.highlight
                          ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30"
                          : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                      }`}
                    >
                      {ctaLabel(p.highlight)}
                    </Button>
                  </Link>

                  <ul className="space-y-3">
                    {features?.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
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
                {t.ctaFinalTitle1}
                <br />
                <span className="bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
                  {t.ctaFinalTitle2}
                </span>
              </h2>
              <p className="text-white/70 max-w-xl mx-auto mb-8">{t.ctaFinalSub}</p>
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 h-12 gap-2 shadow-xl shadow-purple-500/40"
                >
                  {t.ctaFinalBtn}
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
