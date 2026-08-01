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
  Menu,
  Instagram,
  Youtube,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Section, Container, Grid } from "@/components/layout/primitives";
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
    heroAlt: "Pré-visualização da plataforma MyTingleBox para criadores ASMR",
    trialBadge: "3 dias grátis — sem precisar de cartão de crédito",
    heroPoints: ["0% de taxa no Premium", "Sua marca, seu domínio", "Stripe e PIX nativos"],
    featuresKicker: "Recursos",
    featuresTitle1: "Tudo que você precisa para",
    featuresTitle2: "viver da sua arte",
    featuresSub:
      "Uma plataforma completa, pensada para criadores ASMR que querem independência e crescimento.",
    pricingKicker: "Planos",
    pricingTitle1: "Escolha o plano",
    pricingTitle2: "ideal para você",
    pricingSub: "Comece grátis com 3 dias de teste. Sem cartão de crédito.",
    mostPopular: "Mais popular",
    ctaFinalTitle1: "Pronto para começar",
    ctaFinalTitle2: "sua jornada?",
    ctaFinalSub:
      "Junte-se aos criadores que já estão transformando sua audiência em renda recorrente.",
    ctaFinalBtn: "Criar minha loja agora",
    docTitle: "MyTingleBox — A plataforma white-label para criadores ASMR",
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
    navFeatures: "Recursos",
    navPricing: "Planos",
    navHow: "Como funciona",
    navFaq: "Dúvidas",
    menu: "Menu",
    howKicker: "Como funciona",
    howTitle1: "Da ideia à sua loja",
    howTitle2: "em 3 passos",
    howSub: "Sem código, sem complicação. Você pode publicar hoje mesmo.",
    steps: [
      { title: "Crie sua conta", desc: "Cadastre-se grátis e escolha o nome da sua loja em segundos." },
      { title: "Personalize tudo", desc: "Adicione sua marca, cores, conteúdos VIP e vídeos personalizados." },
      { title: "Comece a vender", desc: "Compartilhe seu link e receba pagamentos direto na sua conta." },
    ],
    statsTitle: "Criadores já confiam no MyTingleBox",
    stats: [
      { value: "0%", label: "de taxa no plano Premium" },
      { value: "3 min", label: "para publicar sua loja" },
      { value: "+30", label: "países atendidos" },
      { value: "24/7", label: "suporte e disponibilidade" },
    ],
    faqKicker: "Dúvidas frequentes",
    faqTitle1: "Tudo o que você",
    faqTitle2: "precisa saber",
    faqs: [
      { q: "Preciso saber programar?", a: "Não. Você cria e configura toda a sua loja por uma interface simples, sem escrever uma linha de código." },
      { q: "Como recebo os pagamentos?", a: "Via Stripe e PIX integrados. O dinheiro cai direto na sua conta, sem intermediários." },
      { q: "Posso usar minha própria marca?", a: "Sim. Domínio personalizado, cores, logo e identidade 100% suas em todos os planos." },
      { q: "Existe período de teste?", a: "Sim, você começa com 3 dias grátis e sem precisar de cartão de crédito." },
      { q: "Posso cancelar quando quiser?", a: "Claro. Não há fidelidade — você cancela a qualquer momento direto no painel." },
    ],
    footerTagline: "A plataforma white-label para criadores ASMR viverem da sua arte.",
    footerProduct: "Produto",
    footerResources: "Recursos",
    footerLegal: "Legal",
    footerRights: "Todos os direitos reservados.",
    footerLinks: {
      features: "Recursos",
      pricing: "Planos",
      how: "Como funciona",
      faq: "Dúvidas",
      start: "Começar grátis",
      help: "Ajuda",
      terms: "Termos de uso",
      privacy: "Privacidade",
    },
  },
  en: {
    badge: "The most complete ASMR creator platform in the world",
    heroTitle1: "Your audience on",
    heroTitle2: "a platform that's all yours",
    heroSub:
      "Sell custom videos, monetize VIP content and build your community — all under your brand, no middlemen.",
    ctaStart: "Get started free",
    ctaSeeFeatures: "See features",
    heroAlt: "Preview of the MyTingleBox platform for ASMR creators",
    trialBadge: "3 days free — no credit card required",
    heroPoints: ["0% fee on Premium", "Your brand, your domain", "Native Stripe & PIX"],
    featuresKicker: "Features",
    featuresTitle1: "Everything you need to",
    featuresTitle2: "live from your art",
    featuresSub:
      "A complete platform designed for ASMR creators who want independence and growth.",
    pricingKicker: "Plans",
    pricingTitle1: "Choose the plan",
    pricingTitle2: "that's right for you",
    pricingSub: "Start with a free 3-day trial. No credit card required.",
    mostPopular: "Most popular",
    ctaFinalTitle1: "Ready to start",
    ctaFinalTitle2: "your journey?",
    ctaFinalSub:
      "Join the creators who are already turning their audience into recurring income.",
    ctaFinalBtn: "Create my store now",
    docTitle: "MyTingleBox — The white-label platform for ASMR creators",
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
    navFeatures: "Features",
    navPricing: "Plans",
    navHow: "How it works",
    navFaq: "FAQ",
    menu: "Menu",
    howKicker: "How it works",
    howTitle1: "From idea to your store",
    howTitle2: "in 3 steps",
    howSub: "No code, no hassle. You can go live today.",
    steps: [
      { title: "Create your account", desc: "Sign up free and pick your store name in seconds." },
      { title: "Customize everything", desc: "Add your brand, colors, VIP content and custom videos." },
      { title: "Start selling", desc: "Share your link and get paid directly to your account." },
    ],
    statsTitle: "Creators already trust MyTingleBox",
    stats: [
      { value: "0%", label: "fee on the Premium plan" },
      { value: "3 min", label: "to publish your store" },
      { value: "30+", label: "countries served" },
      { value: "24/7", label: "support and uptime" },
    ],
    faqKicker: "Frequently asked",
    faqTitle1: "Everything you",
    faqTitle2: "need to know",
    faqs: [
      { q: "Do I need to code?", a: "No. You build and configure your entire store through a simple interface, without writing a single line of code." },
      { q: "How do I get paid?", a: "Via integrated Stripe and PIX. Money goes straight to your account, no middlemen." },
      { q: "Can I use my own brand?", a: "Yes. Custom domain, colors, logo and 100% your identity on every plan." },
      { q: "Is there a trial period?", a: "Yes, you start with a free 3-day trial, no credit card required." },
      { q: "Can I cancel anytime?", a: "Of course. No lock-in — cancel anytime right from your dashboard." },
    ],
    footerTagline: "The white-label platform for ASMR creators to live from their art.",
    footerProduct: "Product",
    footerResources: "Resources",
    footerLegal: "Legal",
    footerRights: "All rights reserved.",
    footerLinks: {
      features: "Features",
      pricing: "Plans",
      how: "How it works",
      faq: "FAQ",
      start: "Get started free",
      help: "Help",
      terms: "Terms of use",
      privacy: "Privacy",
    },
  },
  es: {
    badge: "La plataforma de creadores ASMR más completa del mundo",
    heroTitle1: "Tu audiencia en",
    heroTitle2: "una plataforma que es solo tuya",
    heroSub:
      "Vende videos personalizados, monetiza contenido VIP y construye tu comunidad — todo con tu marca, sin intermediarios.",
    ctaStart: "Empezar gratis",
    ctaSeeFeatures: "Ver funciones",
    heroAlt: "Vista previa de la plataforma MyTingleBox para creadores ASMR",
    trialBadge: "3 días gratis — sin tarjeta de crédito",
    heroPoints: ["0% de comisión en Premium", "Tu marca, tu dominio", "Stripe y PIX nativos"],
    featuresKicker: "Funciones",
    featuresTitle1: "Todo lo que necesitas para",
    featuresTitle2: "vivir de tu arte",
    featuresSub:
      "Una plataforma completa, pensada para creadores ASMR que quieren independencia y crecimiento.",
    pricingKicker: "Planes",
    pricingTitle1: "Elige el plan",
    pricingTitle2: "ideal para ti",
    pricingSub: "Empieza con 3 días de prueba gratis. Sin tarjeta de crédito.",
    mostPopular: "Más popular",
    ctaFinalTitle1: "¿Listo para comenzar",
    ctaFinalTitle2: "tu camino?",
    ctaFinalSub:
      "Únete a los creadores que ya están convirtiendo su audiencia en ingresos recurrentes.",
    ctaFinalBtn: "Crear mi tienda ahora",
    docTitle: "MyTingleBox — La plataforma white-label para creadores ASMR",
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
    navFeatures: "Funciones",
    navPricing: "Planes",
    navHow: "Cómo funciona",
    navFaq: "FAQ",
    menu: "Menú",
    howKicker: "Cómo funciona",
    howTitle1: "De la idea a tu tienda",
    howTitle2: "en 3 pasos",
    howSub: "Sin código, sin complicaciones. Puedes publicar hoy mismo.",
    steps: [
      { title: "Crea tu cuenta", desc: "Regístrate gratis y elige el nombre de tu tienda en segundos." },
      { title: "Personaliza todo", desc: "Añade tu marca, colores, contenido VIP y videos personalizados." },
      { title: "Empieza a vender", desc: "Comparte tu enlace y recibe pagos directo en tu cuenta." },
    ],
    statsTitle: "Los creadores ya confían en MyTingleBox",
    stats: [
      { value: "0%", label: "de tarifa en el plan Premium" },
      { value: "3 min", label: "para publicar tu tienda" },
      { value: "+30", label: "países atendidos" },
      { value: "24/7", label: "soporte y disponibilidad" },
    ],
    faqKicker: "Preguntas frecuentes",
    faqTitle1: "Todo lo que",
    faqTitle2: "necesitas saber",
    faqs: [
      { q: "¿Necesito saber programar?", a: "No. Creas y configuras toda tu tienda con una interfaz simple, sin escribir una línea de código." },
      { q: "¿Cómo recibo los pagos?", a: "Vía Stripe y PIX integrados. El dinero llega directo a tu cuenta, sin intermediarios." },
      { q: "¿Puedo usar mi propia marca?", a: "Sí. Dominio personalizado, colores, logo e identidad 100% tuya en todos los planes." },
      { q: "¿Hay período de prueba?", a: "Sí, empiezas con 3 días gratis y sin necesidad de tarjeta de crédito." },
      { q: "¿Puedo cancelar cuando quiera?", a: "Claro. Sin permanencia — cancela en cualquier momento desde el panel." },
    ],
    footerTagline: "La plataforma white-label para que los creadores ASMR vivan de su arte.",
    footerProduct: "Producto",
    footerResources: "Recursos",
    footerLegal: "Legal",
    footerRights: "Todos los derechos reservados.",
    footerLinks: {
      features: "Funciones",
      pricing: "Planes",
      how: "Cómo funciona",
      faq: "FAQ",
      start: "Empezar gratis",
      help: "Ayuda",
      terms: "Términos de uso",
      privacy: "Privacidad",
    },
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
      ? { pt: "Testar 3 dias grátis", en: "Try 3 days free", es: "Prueba 3 días gratis" }[lang]
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
    const target = l === "pt" ? "pt-BR" : l;
    i18n.changeLanguage(target);
    try { localStorage.setItem("i18n_lang", target); } catch {}
  };

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { href: "#features", label: t.navFeatures },
    { href: "#how", label: t.navHow },
    { href: "#pricing", label: t.navPricing },
    { href: "#faq", label: t.navFaq },
  ];

  const LangSwitcher = ({ className = "" }: { className?: string }) => (
    <div className={`inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-1 text-xs ${className}`}>
      {(["pt", "en", "es"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => changeLang(l)}
          className={`px-3 py-1 rounded-full transition-colors ${
            lang === l
              ? "bg-[#8b5cf6] text-white shadow-[0_6px_18px_-8px_rgba(139,92,246,0.9)]"
              : "text-white/50 hover:text-white"
          }`}
          aria-label={`Switch language to ${l.toUpperCase()}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );


  return (
    <div
      className="min-h-screen font-body bg-[#0a0a0f] text-foreground overflow-x-hidden relative"
      style={{ '--ring': '263 70% 58%', '--primary': '263 70% 58%' } as React.CSSProperties}
    >
      {/* Starfield background */}
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
        <div className="absolute right-0 bottom-1/4 w-72 h-72 rounded-full bg-[#c4b5fd]/[0.06] blur-[110px]" />
      </div>

      {/* Header */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0a0a0f]/75 backdrop-blur-xl border-b border-white/[0.08]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <a href="#top" className="flex items-center gap-2">
            <img src={logo} alt="MyTingleBox" className="h-8 w-auto" />
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3.5 py-2 text-sm text-white/55 hover:text-white hover:bg-white/[0.04] transition-colors rounded-full"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LangSwitcher className="hidden sm:inline-flex" />
            <Link to="/auth" className="hidden sm:block">
              <Button className="bg-[#8b5cf6] hover:bg-[#7c4ef0] text-white rounded-full px-5 h-9 gap-1.5 shadow-[0_10px_30px_-12px_rgba(139,92,246,0.9)]">
                <Sparkles className="w-3.5 h-3.5" />
                {t.ctaStart}
              </Button>
            </Link>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon" className="border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.07] rounded-full h-9 w-9">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#0a0a0f] border-white/[0.08] text-white w-72">
                <div className="flex flex-col gap-1 mt-10">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="px-3 py-3 text-base text-white/75 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                  <Link to="/auth" onClick={() => setMenuOpen(false)} className="mt-4">
                    <Button className="w-full bg-[#8b5cf6] hover:bg-[#7c4ef0] text-white rounded-full gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      {t.ctaStart}
                    </Button>
                  </Link>
                  <div className="mt-6">
                    <LangSwitcher />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero */}
      <span id="top" />
      <Section py="pt-32 md:pt-36 pb-24" className="text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-5xl mx-auto motion-reduce:transform-none"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#8b5cf6]/25 bg-[#8b5cf6]/10 backdrop-blur-sm mb-8">
            <Crown className="w-3.5 h-3.5 text-[#c4b5fd]" />
            <span className="text-[13px] font-medium text-[#c4b5fd]">{t.badge}</span>
          </div>

          <h1
            className="font-display font-bold tracking-tight mb-6 text-white leading-[1.06] break-words"
            style={{ fontSize: "clamp(2rem, 5.2vw + 0.6rem, 5rem)" }}
          >
            {t.heroTitle1}
            <br />
            <span className="bg-gradient-to-r from-[#c4b5fd] via-[#a78bfa] to-[#8b5cf6] bg-clip-text text-transparent">
              {t.heroTitle2}
            </span>
          </h1>

          <p className="text-base md:text-lg text-white/55 leading-relaxed max-w-2xl mx-auto mb-10">
            {t.heroSub}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-[#8b5cf6] hover:bg-[#7c4ef0] text-white rounded-full px-7 h-12 gap-2 shadow-[0_18px_45px_-18px_rgba(139,92,246,0.95)]"
              >
                <Sparkles className="w-4 h-4" />
                {t.ctaStart}
              </Button>
            </Link>
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="border-white/[0.10] bg-white/[0.03] text-white hover:bg-white/[0.07] hover:text-white rounded-full px-7 h-12 gap-2 backdrop-blur-xl"
              >
                <Play className="w-4 h-4" />
                {t.ctaSeeFeatures}
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Hero mockup */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mt-20 max-w-5xl mx-auto motion-reduce:transform-none"
        >
          <div className="relative rounded-3xl border border-white/[0.08] bg-[#1a1030]/40 backdrop-blur-xl p-2 shadow-[0_40px_100px_-40px_rgba(139,92,246,0.55)]">
            <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0f0820]">
              <img
                src={heroMockup}
                alt={t.heroAlt}
                className="w-full h-auto block"
                width={1376}
                height={768}
              />
            </div>
          </div>
        </motion.div>
      </Section>


      {/* Stats band */}
      <Section py="pt-8 pb-20" className="relative z-10">
        <Container width="lg">
          <p className="text-center text-white/40 text-xs uppercase tracking-[0.18em] mb-8">
            {t.statsTitle}
          </p>
          <Grid cols="4" gap={4}>
            {t.stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border border-white/[0.08] bg-[#1a1030]/40 backdrop-blur-xl p-6 text-center motion-reduce:transform-none"
              >
                <div className="font-display text-3xl md:text-4xl font-bold tabular-nums bg-gradient-to-r from-[#c4b5fd] to-[#8b5cf6] bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="text-xs md:text-[13px] text-white/45 mt-2 leading-snug">{s.label}</div>
              </motion.div>
            ))}
          </Grid>
        </Container>
      </Section>


      {/* Features */}
      <Section id="features" className="relative z-10">
        <Container width="xl">
          <div className="text-center mb-14">
            <span className="text-[#c4b5fd] text-xs font-medium uppercase tracking-[0.18em]">
              {t.featuresKicker}
            </span>
            <h2
              className="font-display font-bold text-white mt-3 mb-4 leading-[1.1] tracking-tight"
              style={{ fontSize: "clamp(1.75rem, 3vw + 0.8rem, 3rem)" }}
            >
              {t.featuresTitle1}
              <br />
              <span className="bg-gradient-to-r from-[#c4b5fd] to-[#8b5cf6] bg-clip-text text-transparent">
                {t.featuresTitle2}
              </span>
            </h2>
            <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">{t.featuresSub}</p>
          </div>

          <Grid cols="3" gap={5}>
            {t.features.map((f, i) => {
              const Icon = featureIcons[i];
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group rounded-2xl border border-white/[0.08] bg-[#1a1030]/40 backdrop-blur-xl p-6 transition-all duration-300 hover:border-[#8b5cf6]/35 hover:-translate-y-1 hover:shadow-[0_24px_60px_-32px_rgba(139,92,246,0.7)] motion-reduce:transform-none motion-reduce:hover:translate-y-0"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5 transition-colors group-hover:border-[#8b5cf6]/35 group-hover:bg-[#8b5cf6]/10">
                    <Icon className="w-[18px] h-[18px] text-[#c4b5fd]" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-[13px] text-white/50 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </Grid>
        </Container>
      </Section>


      {/* How it works */}
      <Section id="how" className="relative z-10">
        <Container width="xl">
          <div className="text-center mb-14">
            <span className="text-[#c4b5fd] text-xs font-medium uppercase tracking-[0.18em]">
              {t.howKicker}
            </span>
            <h2
              className="font-display font-bold text-white mt-3 mb-4 leading-[1.1] tracking-tight"
              style={{ fontSize: "clamp(1.75rem, 3vw + 0.8rem, 3rem)" }}
            >
              {t.howTitle1}
              <br />
              <span className="bg-gradient-to-r from-[#c4b5fd] to-[#8b5cf6] bg-clip-text text-transparent">
                {t.howTitle2}
              </span>
            </h2>
            <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">{t.howSub}</p>
          </div>

          <Grid cols="3-md" gap={6}>
            {t.steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative rounded-2xl border border-white/[0.08] bg-[#1a1030]/40 backdrop-blur-xl p-7 motion-reduce:transform-none"
              >
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#8b5cf6] text-white font-display text-lg font-bold shadow-[0_12px_30px_-14px_rgba(139,92,246,0.95)] mb-5">
                  {i + 1}
                </div>
                <h3 className="font-display text-base font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-[13px] text-white/50 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}

          </Grid>
        </Container>
      </Section>

      {/* Pricing */}
      <Section id="pricing" className="relative z-10">
        <Container width="xl">
          <div className="text-center mb-14">
            <span className="text-[#c4b5fd] text-xs font-medium uppercase tracking-[0.18em]">
              {t.pricingKicker}
            </span>
            <h2
              className="font-display font-bold text-white mt-3 mb-4 leading-[1.1] tracking-tight"
              style={{ fontSize: "clamp(1.75rem, 3vw + 0.8rem, 3rem)" }}
            >
              {t.pricingTitle1}
              <br />
              <span className="bg-gradient-to-r from-[#c4b5fd] to-[#8b5cf6] bg-clip-text text-transparent">
                {t.pricingTitle2}
              </span>
            </h2>
            <p className="text-white/50 leading-relaxed max-w-2xl mx-auto">{t.pricingSub}</p>
          </div>

          <Grid cols="3-md" gap={6}>
            {plans.map((p, i) => {
              const name = p[`name_${lang}` as const] as string;
              const features = p[`features_${lang}` as const] as string[];
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className={`relative rounded-3xl border p-7 backdrop-blur-xl motion-reduce:transform-none ${
                    p.highlight
                      ? "border-[#8b5cf6]/40 bg-[#1a1030]/70 shadow-[0_30px_80px_-32px_rgba(139,92,246,0.75)] md:scale-[1.03]"
                      : "border-white/[0.08] bg-[#1a1030]/40"
                  }`}
                >
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#8b5cf6] text-white text-[11px] font-semibold tracking-wide shadow-[0_8px_20px_-8px_rgba(139,92,246,0.9)]">
                      {t.mostPopular}
                    </div>
                  )}

                  <h3 className="font-display text-lg font-bold text-white mb-1">{name}</h3>

                  <div className="flex items-baseline gap-1 mb-6 mt-4">
                    <span className="font-display text-4xl font-bold text-white tabular-nums tracking-tight">{formatPrice(p)}</span>
                    <span className="text-white/40 text-sm">{periodLabel[p.period]}</span>
                  </div>

                  <Link to="/auth">
                    <Button
                      className={`w-full h-11 rounded-full mb-6 ${
                        p.highlight
                          ? "bg-[#8b5cf6] hover:bg-[#7c4ef0] text-white shadow-[0_14px_34px_-14px_rgba(139,92,246,0.95)]"
                          : "bg-white/[0.05] hover:bg-white/[0.09] text-white border border-white/[0.08]"
                      }`}
                    >
                      {ctaLabel(p.highlight)}
                    </Button>
                  </Link>

                  <ul className="space-y-3">
                    {features?.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-[13px] text-white/60">
                        <Check className="w-4 h-4 text-[#c4b5fd] flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

              );
            })}
          </Grid>
        </Container>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="relative z-10">
        <Container width="sm">
          <div className="text-center mb-12">
            <span className="text-[#c4b5fd] text-xs font-medium uppercase tracking-[0.18em]">
              {t.faqKicker}
            </span>
            <h2
              className="font-display font-bold text-white mt-3 leading-[1.1] tracking-tight"
              style={{ fontSize: "clamp(1.75rem, 3vw + 0.8rem, 3rem)" }}
            >
              {t.faqTitle1}{" "}
              <span className="bg-gradient-to-r from-[#c4b5fd] to-[#8b5cf6] bg-clip-text text-transparent">
                {t.faqTitle2}
              </span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {t.faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-white/[0.08] bg-[#1a1030]/40 backdrop-blur-xl px-5 transition-colors hover:border-white/[0.16]"
              >
                <AccordionTrigger className="text-left text-white text-[15px] hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/50 text-[13px] leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section id="cta" py="py-24" className="relative z-10">
        <Container width="md">
          <div className="relative rounded-3xl border border-white/[0.08] bg-[#1a1030]/50 backdrop-blur-xl p-12 md:p-16 text-center overflow-hidden shadow-[0_40px_100px_-40px_rgba(139,92,246,0.6)]">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, hsl(263 90% 62% / 0.28) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <h2
                className="font-display font-bold text-white mb-4 leading-[1.1] tracking-tight"
                style={{ fontSize: "clamp(1.75rem, 3vw + 0.8rem, 3rem)" }}
              >
                {t.ctaFinalTitle1}
                <br />
                <span className="bg-gradient-to-r from-[#c4b5fd] to-[#8b5cf6] bg-clip-text text-transparent">
                  {t.ctaFinalTitle2}
                </span>
              </h2>
              <p className="text-white/55 leading-relaxed max-w-xl mx-auto mb-8">{t.ctaFinalSub}</p>
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-[#8b5cf6] hover:bg-[#7c4ef0] text-white rounded-full px-8 h-12 gap-2 shadow-[0_18px_45px_-18px_rgba(139,92,246,0.95)]"
                >
                  {t.ctaFinalBtn}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>


      {/* Footer */}
      <Section as="footer" py="pt-16 pb-10" className="relative z-10 border-t border-white/[0.08]">
        <Container width="xl">
          <Grid cols="4" gap={10}>
            <div className="col-span-2 md:col-span-1">
              <img src={logo} alt="MyTingleBox" className="h-8 w-auto mb-4" />
              <p className="text-[13px] text-white/45 max-w-xs leading-relaxed">
                {t.footerTagline}
              </p>
              <div className="flex items-center gap-3 mt-5">
                <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-white/50 hover:text-white hover:border-[#8b5cf6]/35 transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" aria-label="YouTube" className="w-9 h-9 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-white/50 hover:text-white hover:border-[#8b5cf6]/35 transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
                <a href="#" aria-label="X" className="w-9 h-9 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-white/50 hover:text-white hover:border-[#8b5cf6]/35 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
              </div>

            </div>

            <div>
              <h4 className="font-display text-sm font-semibold text-white mb-4">{t.footerProduct}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-white/50 hover:text-white transition-colors">{t.footerLinks.features}</a></li>
                <li><a href="#pricing" className="text-white/50 hover:text-white transition-colors">{t.footerLinks.pricing}</a></li>
                <li><Link to="/auth" className="text-white/50 hover:text-white transition-colors">{t.footerLinks.start}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display text-sm font-semibold text-white mb-4">{t.footerResources}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#how" className="text-white/50 hover:text-white transition-colors">{t.footerLinks.how}</a></li>
                <li><a href="#faq" className="text-white/50 hover:text-white transition-colors">{t.footerLinks.faq}</a></li>
                <li><Link to="/help" className="text-white/50 hover:text-white transition-colors">{t.footerLinks.help}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display text-sm font-semibold text-white mb-4">{t.footerLegal}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/terms" className="text-white/50 hover:text-white transition-colors">{t.footerLinks.terms}</Link></li>
                <li><Link to="/privacy" className="text-white/50 hover:text-white transition-colors">{t.footerLinks.privacy}</Link></li>
              </ul>
            </div>
          </Grid>

          <div className="mt-12 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} MyTingleBox. {t.footerRights}
            </p>
            <LangSwitcher />
          </div>
        </Container>
      </Section>
    </div>
  );
};

export default Landing;
