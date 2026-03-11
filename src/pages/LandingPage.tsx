import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Sparkles,
  Headphones,
  ShoppingBag,
  Users,
  
  BarChart3,
  Palette,
  ChevronDown,
  Star,
  ArrowRight,
  Gift,
  Play,
  TrendingUp,
  Store,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";

const features = [
  {
    icon: ShoppingBag,
    title: "Loja Própria",
    description: "Venda áudios, vídeos e pedidos personalizados com pagamento via Pix.",
  },
  {
    icon: Users,
    title: "Comunidade",
    description: "Seus fãs interagem, votam em ideias e participam de um espaço exclusivo.",
  },
  {
    icon: Headphones,
    title: "Galeria de Conteúdo",
    description: "Organize vídeos e áudios por categorias com player integrado.",
  },
  {
    icon: Palette,
    title: "Sua Marca",
    description: "Personalize cores, logo e identidade visual da sua loja ASMR.",
  },
  {
    icon: BarChart3,
    title: "Painel Admin",
    description: "Gerencie pedidos, conteúdo, usuários e métricas em um dashboard.",
  },
];

const steps = [
  {
    number: "01",
    title: "Crie sua conta",
    description: "Cadastre-se com seu código de convite.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Personalize",
    description: "Escolha cores, logo e categorias de conteúdo.",
    icon: Palette,
  },
  {
    number: "03",
    title: "Adicione conteúdo",
    description: "Publique vídeos, áudios e defina preços.",
    icon: Play,
  },
  {
    number: "04",
    title: "Comece a faturar",
    description: "Compartilhe e receba pagamentos via Pix.",
    icon: TrendingUp,
  },
];

const stats = [
  { value: "100%", label: "Grátis", icon: Gift },
  { value: "∞", label: "Conteúdos", icon: Headphones },
  { value: "Pix", label: "Instantâneo", icon: TrendingUp },
  { value: "24/7", label: "Online", icon: Store },
];

const testimonials = [
  {
    name: "Luna ASMR",
    role: "Criadora de conteúdo",
    avatar: "🌙",
    text: "Finalmente uma plataforma feita para criadores ASMR! Montei minha loja em minutos.",
    stars: 5,
  },
  {
    name: "Carlos Whispers",
    role: "ASMRtist",
    avatar: "🎧",
    text: "O sistema de assinaturas VIP mudou meu jogo. Receita recorrente estável!",
    stars: 5,
  },
  {
    name: "Sofia Tingles",
    role: "Criadora & Streamer",
    avatar: "✨",
    text: "Meus fãs votam nas ideias de vídeo e eu sei exatamente o que querem assistir.",
    stars: 5,
  },
];

const FloatingOrb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-15 pointer-events-none ${className}`}
    animate={{
      y: [0, -20, 0],
      scale: [1, 1.08, 1],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      delay,
      ease: "easeInOut",
    }}
  />
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { config } = useWhiteLabel();
  const lp = config.landingPage;
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.97]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/20">
        <div className="max-w-6xl mx-auto px-4 h-12 sm:h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {lp.footerName || 'ASMR Store'}
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button variant="ghost" size="sm" className="text-xs h-8 px-3 text-muted-foreground" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button size="sm" className="text-xs h-8 px-3 sm:px-4" onClick={() => navigate("/auth?tab=signup")}>
              Criar Loja
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      {lp.heroVisible !== false && (
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center justify-center pt-12 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,hsl(var(--primary)/0.18),transparent)]" />
        
        <FloatingOrb className="w-64 sm:w-96 h-64 sm:h-96 bg-primary -top-20 -left-20" delay={0} />
        <FloatingOrb className="w-48 sm:w-72 h-48 sm:h-72 bg-accent top-1/3 -right-10" delay={2} />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center px-5 sm:px-6 max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-10 backdrop-blur-sm"
          >
            <Gift className="w-3.5 h-3.5" />
            {lp.heroBadgeText || '100% Grátis — Crie sua loja agora'}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-[2.5rem] leading-[1.08] sm:text-5xl md:text-7xl font-extrabold mb-5 sm:mb-8 tracking-tight"
          >
            Sua loja ASMR
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite]">
              completa
            </span>{" "}
            em minutos
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-[0.95rem] sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed"
          >
            Loja, comunidade, assinaturas VIP e pagamento via Pix — tudo em um só lugar para você{" "}
            <span className="text-foreground font-medium">criar conteúdo incrível.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-base px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-xl shadow-primary/25"
              onClick={() => navigate("/auth?tab=signup")}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Criar Minha Loja Grátis
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-base px-8 py-6 border-border/40"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Ver Recursos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="mt-12 sm:mt-20"
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground/40 mx-auto animate-bounce" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-4 sm:py-6 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <GlassCard className="p-3 sm:p-5 text-center">
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1 sm:mb-2" />
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-[0.6rem] sm:text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-28 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,hsl(var(--primary)/0.04),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-20"
          >
            <span className="text-primary text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3 block">
              Recursos
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-5 tracking-tight px-2">
              Tudo para{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                monetizar
              </span>{" "}
              seu conteúdo
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto">
              Ferramentas feitas sob medida para criadores ASMR
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
              >
                <GlassCard className="p-4 sm:p-7 h-full group hover:border-primary/30 transition-all duration-300">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-5">
                    <feature.icon className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-28 px-4 relative">
        <div className="absolute inset-0 bg-card/20" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-20"
          >
            <span className="text-primary text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3 block">
              Passo a passo
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-5 tracking-tight">
              Como <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">funciona</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg">
              4 passos para ter sua loja no ar
            </p>
          </motion.div>

          <div className="space-y-3 sm:space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-5">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[0.65rem] sm:text-xs text-primary font-semibold tracking-wider uppercase">
                          Passo {step.number}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-lg font-semibold tracking-tight">{step.title}</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Free highlight */}
      <section className="py-12 sm:py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto relative z-10"
        >
          <GlassCard className="p-6 sm:p-10 md:p-14 text-center border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center">
              <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 tracking-tight">
              Totalmente{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                grátis
              </span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
              Sem mensalidades, sem taxas ocultas. A plataforma é mantida por anúncios discretos que não atrapalham seus fãs.
            </p>
          </GlassCard>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 sm:py-28 px-4 relative">
        <div className="absolute inset-0 bg-card/20" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-20"
          >
            <span className="text-primary text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3 block">
              Depoimentos
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-5 tracking-tight">
              Criadores que{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                confiam
              </span>
            </h2>
          </motion.div>

          {/* Mobile: horizontal scroll, Desktop: grid */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 scrollbar-hide">
            {testimonials.map((t, index) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="min-w-[280px] sm:min-w-0 snap-center"
              >
                <GlassCard className="p-5 sm:p-7 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-3 sm:mb-5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1 mb-4 sm:mb-6">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-2.5 pt-3 sm:pt-4 border-t border-border/30">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm sm:text-lg">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-xs sm:text-sm">{t.name}</p>
                      <p className="text-[0.65rem] sm:text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 sm:py-28 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.08),transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center relative z-10"
        >
          <GlassCard className="p-8 sm:p-12 md:p-16 border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-primary mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-3 sm:mb-5 tracking-tight">
              Pronto para criar sua loja ASMR?
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-10 text-sm sm:text-base leading-relaxed">
              Junte-se a criadores que já monetizam seu conteúdo — 100% grátis.
            </p>
            <Button
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-base px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-xl shadow-primary/25"
              onClick={() => navigate("/auth?tab=signup")}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Criar Minha Loja Grátis
            </Button>
          </GlassCard>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 px-4 border-t border-border/20">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
          <span className="text-xs sm:text-sm font-semibold text-foreground">ASMR Store</span>
          <p className="text-muted-foreground text-[0.65rem] sm:text-xs">
            © {new Date().getFullYear()} ASMR Store. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 sm:gap-6 text-[0.65rem] sm:text-xs text-muted-foreground">
            <a href="/termos" className="hover:text-foreground transition-colors">
              Termos
            </a>
            <a href="/privacidade" className="hover:text-foreground transition-colors">
              Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
