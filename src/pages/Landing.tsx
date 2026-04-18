import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Crown,
  MessageCircle,
  Youtube,
  Languages,
  Smartphone,
  Palette,
  ShieldCheck,
  CreditCard,
  Headphones,
  Check,
  Users,
  TrendingUp,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const Landing = () => {
  useEffect(() => {
    document.title = 'TingleBox — Plataforma white-label para criadores de ASMR';
    const meta =
      document.querySelector('meta[name="description"]') ||
      (() => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'description');
        document.head.appendChild(m);
        return m;
      })();
    meta.setAttribute(
      'content',
      'Crie sua loja ASMR white-label com 0% de taxa, pagamentos via Stripe e PIX, assinaturas VIP e domínio próprio. Comece grátis em 7 dias.'
    );
    const canonical =
      document.querySelector('link[rel="canonical"]') ||
      (() => {
        const l = document.createElement('link');
        l.setAttribute('rel', 'canonical');
        document.head.appendChild(l);
        return l;
      })();
    canonical.setAttribute('href', window.location.origin + '/');
  }, []);

  const features = [
    {
      icon: Zap,
      title: '0% de taxa nas vendas',
      desc: 'Você fica com 100% do que vende. Sem comissão, sem surpresas.',
    },
    {
      icon: CreditCard,
      title: 'Stripe + PIX integrados',
      desc: 'Receba de qualquer lugar do mundo via Stripe Connect ou direto via PIX no Brasil.',
    },
    {
      icon: Palette,
      title: 'White-label completo',
      desc: 'Logo, cores, banners e identidade visual 100% personalizáveis para sua marca.',
    },
    {
      icon: Globe,
      title: 'Domínio próprio',
      desc: 'Conecte seu domínio personalizado em minutos, com SSL automático.',
    },
    {
      icon: Crown,
      title: 'Assinaturas VIP',
      desc: 'Monetize conteúdo exclusivo com planos mensais e área restrita para fãs.',
    },
    {
      icon: MessageCircle,
      title: 'Custom orders',
      desc: 'Receba pedidos personalizados com chat em tempo real e gestão simplificada.',
    },
    {
      icon: Users,
      title: 'Comunidade integrada',
      desc: 'Sistema de ideias, votação e engajamento direto com sua audiência.',
    },
    {
      icon: Youtube,
      title: 'YouTube nativo',
      desc: 'Galeria automática dos seus vídeos com cache inteligente e categorização.',
    },
    {
      icon: Languages,
      title: 'Multi-idioma',
      desc: 'Sua loja em Português, Inglês e Espanhol com moeda automática (BRL/USD).',
    },
    {
      icon: Smartphone,
      title: 'PWA instalável',
      desc: 'Seus fãs instalam sua loja como app no celular. Sem app store, sem fricção.',
    },
    {
      icon: ShieldCheck,
      title: 'Segurança enterprise',
      desc: 'RLS rigoroso, autenticação isolada por loja e proteção contra fraude.',
    },
    {
      icon: Headphones,
      title: 'Suporte direto',
      desc: 'Chat em tempo real com nossa equipe diretamente do painel admin.',
    },
  ];

  const steps = [
    { n: '01', title: 'Crie sua conta', desc: 'Cadastro grátis em /auth com 7 dias de teste sem cartão.' },
    { n: '02', title: 'Personalize sua loja', desc: 'Defina logo, cores, banners e seu slug único.' },
    { n: '03', title: 'Conecte pagamentos', desc: 'Ative Stripe Connect ou PIX em poucos cliques.' },
    { n: '04', title: 'Comece a vender', desc: 'Compartilhe seu link e receba pedidos imediatamente.' },
  ];

  const stats = [
    { value: '0%', label: 'Taxa nas vendas' },
    { value: '7 dias', label: 'Teste grátis' },
    { value: '3', label: 'Idiomas suportados' },
    { value: '100%', label: 'White-label' },
  ];

  const faqs = [
    {
      q: 'Quanto custa para usar a TingleBox?',
      a: 'Você tem 7 dias de teste grátis. Depois, planos a partir do básico, sempre com 0% de taxa sobre suas vendas. Você fica com 100% do que vende.',
    },
    {
      q: 'Como funciona o pagamento dos meus fãs?',
      a: 'Você ativa Stripe Connect (cartão internacional) e/ou PIX manual (Brasil). O dinheiro vai direto para sua conta — nós nunca tocamos no seu faturamento.',
    },
    {
      q: 'Posso usar meu próprio domínio?',
      a: 'Sim. Conecte seu domínio personalizado direto pelo painel admin. Configuramos SSL e DNS automaticamente via Vercel.',
    },
    {
      q: 'O que é a área VIP?',
      a: 'Um sistema de assinaturas mensais onde você publica vídeos, áudios e imagens exclusivas para fãs assinantes. Tudo protegido com gate +18 opcional.',
    },
    {
      q: 'Funciona no celular?',
      a: 'Sim, é totalmente responsivo e instalável como PWA. Seus fãs adicionam sua loja na tela inicial como um app nativo.',
    },
    {
      q: 'Posso integrar com meu canal do YouTube?',
      a: 'Sim. Conecte seu canal e a galeria de vídeos é gerada automaticamente, com cache inteligente para economizar quota da API.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg">TingleBox</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="hidden sm:block">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gap-2">
                Começar grátis <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-40 right-10 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-40 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma white-label para criadores de ASMR
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]"
          >
            Sua loja de ASMR.
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
              Sua marca. Seu lucro.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Monetize seu conteúdo ASMR com 0% de taxa, pagamentos via Stripe e PIX,
            assinaturas VIP e domínio próprio. Tudo white-label, em minutos.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Link to="/auth">
              <Button size="lg" className="gap-2 h-12 px-8 text-base">
                Começar grátis por 7 dias <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Ver recursos
              </Button>
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground mt-6"
          >
            Sem cartão de crédito · Cancele quando quiser · 100% white-label
          </motion.p>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border/40 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="text-center"
              >
                <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">
                  {s.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Tudo que você precisa
              <br />
              <span className="text-muted-foreground">para crescer</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Uma plataforma completa, pensada para criadores de ASMR que querem
              profissionalizar sua marca.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="group p-6 rounded-2xl border border-border/40 bg-card/30 hover:bg-card/60 hover:border-primary/30 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 md:py-32 bg-muted/20 border-y border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Comece em 4 passos
            </h2>
            <p className="text-muted-foreground">Do cadastro à primeira venda em menos de 10 minutos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative p-6 rounded-2xl border border-border/40 bg-background"
              >
                <div className="font-display text-5xl font-bold text-primary/20 mb-4">{s.n}</div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Feito para
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  criadores sérios.
                </span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Outras plataformas cobram comissão alta, limitam sua marca e prendem
                seus fãs. A TingleBox foi desenhada do zero para devolver o controle
                e o lucro a você.
              </p>
              <ul className="space-y-3">
                {[
                  'Você é dono dos seus fãs e dados',
                  'Marca 100% sua — sem nosso logo',
                  'Pagamentos diretos na sua conta',
                  'Conteúdo VIP protegido por RLS rigoroso',
                  'Suporte humano em português',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { icon: TrendingUp, label: 'Receita 100% sua' },
                  { icon: Rocket, label: 'Setup em minutos' },
                  { icon: ShieldCheck, label: 'Segurança enterprise' },
                  { icon: Globe, label: 'Alcance global' },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="aspect-square rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center"
                  >
                    <b.icon className="w-8 h-8 text-primary mb-3" />
                    <span className="text-sm font-medium">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32 bg-muted/20 border-y border-border/40">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Perguntas frequentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border/40 rounded-xl px-5 bg-background"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-12 md:p-16 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                Pronto para começar?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Crie sua loja ASMR agora. 7 dias grátis, sem cartão. Cancele quando quiser.
              </p>
              <Link to="/auth">
                <Button size="lg" className="gap-2 h-12 px-8 text-base">
                  Criar minha loja grátis <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/40 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold">TingleBox</span>
              <span className="text-xs text-muted-foreground ml-2">© {new Date().getFullYear()}</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/help" className="hover:text-foreground transition-colors">Ajuda</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Termos</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">Entrar</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
