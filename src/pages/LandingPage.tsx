import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Sparkles,
  Headphones,
  ShoppingBag,
  Users,
  Crown,
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
import { useRef } from "react";

const features = [
  {
    icon: ShoppingBag,
    title: "Loja Própria",
    description:
      "Venda áudios, vídeos e pedidos personalizados ASMR com pagamento via Pix integrado.",
  },
  {
    icon: Users,
    title: "Comunidade Integrada",
    description:
      "Seus fãs interagem, votam em ideias de conteúdo e participam de um espaço exclusivo.",
  },
  {
    icon: Crown,
    title: "Área VIP & Assinaturas",
    description:
      "Crie planos de assinatura com conteúdo exclusivo e monetize sua base de fãs recorrentemente.",
  },
  {
    icon: Headphones,
    title: "Galeria de Conteúdo",
    description:
      "Organize vídeos e áudios por categorias, com player integrado e histórico de visualização.",
  },
  {
    icon: Palette,
    title: "Marca Personalizada",
    description:
      "Personalize cores, logo e identidade visual da sua loja para refletir sua marca ASMR.",
  },
  {
    icon: BarChart3,
    title: "Painel Administrativo",
    description:
      "Gerencie pedidos, conteúdo, usuários e métricas da sua loja em um dashboard completo.",
  },
];

const steps = [
  {
    number: "01",
    title: "Crie sua conta",
    description: "Cadastre-se com seu código de convite e configure seu perfil de criador.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Personalize sua loja",
    description: "Escolha cores, logo e configure suas categorias de conteúdo ASMR.",
    icon: Palette,
  },
  {
    number: "03",
    title: "Adicione conteúdo",
    description: "Publique vídeos, áudios e defina preços para pedidos personalizados.",
    icon: Play,
  },
  {
    number: "04",
    title: "Comece a faturar",
    description: "Compartilhe o link da sua loja e receba pagamentos via Pix automaticamente.",
    icon: TrendingUp,
  },
];

const stats = [
  { value: "100%", label: "Grátis", icon: Gift },
  { value: "∞", label: "Conteúdos", icon: Headphones },
  { value: "Pix", label: "Pagamento Instantâneo", icon: TrendingUp },
  { value: "24/7", label: "Sua loja online", icon: Store },
];

const testimonials = [
  {
    name: "Luna ASMR",
    role: "Criadora de conteúdo",
    avatar: "🌙",
    text: "Finalmente uma plataforma feita para criadores ASMR! Consegui montar minha loja em minutos e já estou recebendo pedidos personalizados.",
    stars: 5,
  },
  {
    name: "Carlos Whispers",
    role: "ASMRtist",
    avatar: "🎧",
    text: "O sistema de assinaturas VIP mudou meu jogo. Tenho uma receita recorrente estável e meus fãs adoram o conteúdo exclusivo.",
    stars: 5,
  },
  {
    name: "Sofia Tingles",
    role: "Criadora & Streamer",
    avatar: "✨",
    text: "A comunidade integrada é incrível. Meus fãs votam nas ideias de vídeo e eu sei exatamente o que eles querem assistir.",
    stars: 5,
  },
];

const FloatingOrb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
    animate={{
      y: [0, -30, 0],
      scale: [1, 1.1, 1],
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
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            ASMR Store
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button size="sm" className="text-xs h-8 px-4" onClick={() => navigate("/auth?tab=signup")}>
              Criar Loja
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center justify-center pt-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,hsl(var(--primary)/0.2),transparent)]" />
        
        <FloatingOrb className="w-96 h-96 bg-primary -top-20 -left-20" delay={0} />
        <FloatingOrb className="w-72 h-72 bg-accent top-1/3 -right-10" delay={2} />
        <FloatingOrb className="w-64 h-64 bg-primary/50 bottom-20 left-1/4" delay={4} />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-10 backdrop-blur-sm"
          >
            <Gift className="w-4 h-4" />
            100% Grátis — Crie sua loja agora
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] mb-8 tracking-tight"
          >
            Sua loja ASMR
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite]">
              completa
            </span>{" "}
            em minutos
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Loja, comunidade, assinaturas VIP, pedidos personalizados e pagamento via Pix — tudo em um só lugar para você focar no que importa:{" "}
            <span className="text-foreground font-medium">criar conteúdo incrível.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="text-base px-10 py-7 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02]"
              onClick={() => navigate("/auth?tab=signup")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Criar Minha Loja Grátis
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-base px-10 py-7 border-border/50 hover:border-primary/30 transition-all hover:scale-[1.02]"
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
            className="mt-20"
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground/50 mx-auto animate-bounce" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-6 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-5 text-center group hover:border-primary/30 transition-all duration-300">
                  <stat.icon className="w-5 h-5 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,hsl(var(--primary)/0.05),transparent)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-4 block">
              Recursos
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
              Tudo para{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                monetizar
              </span>{" "}
              seu conteúdo
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Ferramentas profissionais feitas sob medida para criadores ASMR
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 100 }}
              >
                <GlassCard className="p-7 h-full group hover:border-primary/30 hover:bg-card/80 transition-all duration-300 cursor-default">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-28 px-4 relative">
        <div className="absolute inset-0 bg-card/20" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-4 block">
              Passo a passo
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
              Como <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">funciona</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              4 passos simples para ter sua loja ASMR no ar
            </p>
          </motion.div>

          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-accent/20 to-transparent hidden md:block" />

            <div className="space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, type: "spring", stiffness: 80 }}
                  className={`md:flex md:items-center md:gap-8 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <GlassCard className="p-6 inline-block w-full hover:border-primary/30 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                          <step.icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs text-primary font-semibold tracking-wider uppercase">
                            Passo {step.number}
                          </span>
                          <h3 className="text-lg font-semibold mt-1 tracking-tight">{step.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed mt-1">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                  {/* Center dot */}
                  <div className="hidden md:flex w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/40 shrink-0 relative z-10" />
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Free highlight */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto relative z-10"
        >
          <GlassCard className="p-10 md:p-14 text-center border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-8 relative"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-xl" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center">
                <Gift className="w-8 h-8 text-primary" />
              </div>
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Totalmente{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                grátis
              </span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
              Sem mensalidades, sem taxas ocultas. Crie sua loja ASMR completa sem pagar nada.
              A plataforma é mantida por anúncios discretos que não atrapalham a experiência dos seus fãs.
            </p>
          </GlassCard>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-28 px-4 relative">
        <div className="absolute inset-0 bg-card/20" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-4 block">
              Depoimentos
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
              Criadores que{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                confiam
              </span>{" "}
              na plataforma
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, index) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12, type: "spring", stiffness: 100 }}
              >
                <GlassCard className="p-7 h-full flex flex-col hover:border-primary/30 transition-all duration-300">
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-28 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.1),transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center relative z-10"
        >
          <GlassCard className="p-12 md:p-16 border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

            <Heart className="w-10 h-10 text-primary mx-auto mb-6" />
            <h2 className="text-2xl md:text-4xl font-bold mb-5 tracking-tight">
              Pronto para criar sua loja ASMR?
            </h2>
            <p className="text-muted-foreground mb-10 text-base leading-relaxed">
              Junte-se a dezenas de criadores que já monetizam seu conteúdo ASMR — 100% grátis.
            </p>
            <Button
              size="lg"
              className="text-base px-10 py-7 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02]"
              onClick={() => navigate("/auth?tab=signup")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Criar Minha Loja Grátis
            </Button>
          </GlassCard>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Headphones className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">ASMR Store</span>
          </div>
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} ASMR Store. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="/termos" className="hover:text-foreground transition-colors">
              Termos de Uso
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
