import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Headphones,
  ShoppingBag,
  Users,
  Crown,
  BarChart3,
  Palette,
  ChevronDown,
  Check,
  Star,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";

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
  },
  {
    number: "02",
    title: "Personalize sua loja",
    description: "Escolha cores, logo e configure suas categorias de conteúdo ASMR.",
  },
  {
    number: "03",
    title: "Adicione conteúdo",
    description: "Publique vídeos, áudios e defina preços para pedidos personalizados.",
  },
  {
    number: "04",
    title: "Comece a faturar",
    description: "Compartilhe o link da sua loja e receba pagamentos via Pix automaticamente.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Grátis",
    period: "",
    description: "Para começar a testar a plataforma",
    features: [
      "Loja básica",
      "Até 10 conteúdos",
      "Comunidade integrada",
      "Pagamento via Pix",
    ],
    highlighted: false,
    cta: "Começar Grátis",
  },
  {
    name: "Pro",
    price: "R$ 49",
    period: "/mês",
    description: "Para criadores que querem crescer",
    features: [
      "Conteúdo ilimitado",
      "Área VIP & Assinaturas",
      "Marca personalizada",
      "Analytics avançados",
      "Suporte prioritário",
    ],
    highlighted: true,
    cta: "Assinar Pro",
  },
  {
    name: "Business",
    price: "R$ 99",
    period: "/mês",
    description: "Para criadores profissionais",
    features: [
      "Tudo do Pro",
      "Domínio customizado",
      "Múltiplos admins",
      "API de integração",
      "Onboarding dedicado",
    ],
    highlighted: false,
    cta: "Falar com Vendas",
  },
];

const testimonials = [
  {
    name: "Luna ASMR",
    role: "Criadora de conteúdo",
    text: "Finalmente uma plataforma feita para criadores ASMR! Consegui montar minha loja em minutos e já estou recebendo pedidos personalizados.",
    stars: 5,
  },
  {
    name: "Carlos Whispers",
    role: "ASMRtist",
    text: "O sistema de assinaturas VIP mudou meu jogo. Tenho uma receita recorrente estável e meus fãs adoram o conteúdo exclusivo.",
    stars: 5,
  },
  {
    name: "Sofia Tingles",
    role: "Criadora & Streamer",
    text: "A comunidade integrada é incrível. Meus fãs votam nas ideias de vídeo e eu sei exatamente o que eles querem assistir.",
    stars: 5,
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ASMR Store
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate("/auth?tab=signup")}>
              Criar Minha Loja
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_70%)]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8"
          >
            <Zap className="w-4 h-4" />
            A plataforma #1 para criadores ASMR
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Sua loja ASMR{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              completa
            </span>{" "}
            em minutos
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Loja, comunidade, assinaturas VIP, pedidos personalizados e pagamento via Pix — tudo em um só lugar para você focar no que importa: criar conteúdo incrível.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="text-base px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              onClick={() => navigate("/auth?tab=signup")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Criar Minha Loja Grátis
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-base px-8 py-6"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Ver Recursos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-16"
          >
            <ChevronDown className="w-6 h-6 text-muted-foreground mx-auto animate-bounce" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para{" "}
              <span className="text-primary">monetizar</span> seu conteúdo
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Ferramentas profissionais feitas sob medida para criadores ASMR
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 h-full hover:border-primary/30 transition-colors">
                  <feature.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
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
      <section id="how-it-works" className="py-24 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como <span className="text-primary">funciona</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              4 passos simples para ter sua loja ASMR no ar
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <GlassCard className="p-6 flex gap-5 items-start">
                  <span className="text-3xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent shrink-0">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos para cada <span className="text-primary">fase</span> do seu crescimento
            </h2>
            <p className="text-muted-foreground text-lg">
              Comece grátis e escale conforme seu público cresce
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard
                  className={`p-6 h-full flex flex-col ${
                    plan.highlighted
                      ? "border-primary/40 ring-1 ring-primary/20 relative"
                      : ""
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                      Mais popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                        : ""
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => navigate("/auth?tab=signup")}
                  >
                    {plan.cta}
                  </Button>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Criadores que <span className="text-primary">confiam</span> na plataforma
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, index) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                    "{t.text}"
                  </p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <GlassCard className="p-10 border-primary/20">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Pronto para criar sua loja ASMR?
            </h2>
            <p className="text-muted-foreground mb-8">
              Junte-se a dezenas de criadores que já monetizam seu conteúdo ASMR com nossa plataforma.
            </p>
            <Button
              size="lg"
              className="text-base px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              onClick={() => navigate("/auth?tab=signup")}
            >
              Criar Minha Loja Grátis
            </Button>
          </GlassCard>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} ASMR Store. Todos os direitos reservados.</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <a href="/termos" className="hover:text-primary transition-colors">
            Termos de Uso
          </a>
          <a href="/privacidade" className="hover:text-primary transition-colors">
            Privacidade
          </a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
