import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Headphones, Heart, Star, Shield, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";

const features = [
  {
    icon: Headphones,
    title: "Conteúdo Exclusivo",
    description: "Acesse vídeos ASMR exclusivos, áudios relaxantes e conteúdo premium feito especialmente para você.",
  },
  {
    icon: Heart,
    title: "Comunidade",
    description: "Participe de uma comunidade acolhedora, vote em ideias de vídeos e conecte-se com outros fãs.",
  },
  {
    icon: Star,
    title: "Área VIP",
    description: "Desbloqueie conteúdo especial, bastidores e interações exclusivas com assinatura VIP.",
  },
  {
    icon: Shield,
    title: "Pedidos Personalizados",
    description: "Solicite áudios e vídeos ASMR personalizados com seus triggers favoritos.",
  },
  {
    icon: Zap,
    title: "Notificações em Tempo Real",
    description: "Fique por dentro de novos conteúdos, respostas da comunidade e promoções exclusivas.",
  },
  {
    icon: Sparkles,
    title: "Experiência Imersiva",
    description: "Interface pensada para relaxamento com tema escuro, animações suaves e design glassmorphism.",
  },
];

const faqs = [
  {
    q: "Como consigo um código de convite?",
    a: "Os códigos de convite são distribuídos pela criadora de conteúdo em suas redes sociais, lives e para membros VIP.",
  },
  {
    q: "Preciso pagar para participar?",
    a: "O acesso básico é gratuito! Temos também planos VIP com conteúdo exclusivo e benefícios extras.",
  },
  {
    q: "O que posso fazer na plataforma?",
    a: "Assistir vídeos, ouvir áudios ASMR, participar da comunidade, votar em ideias, fazer pedidos personalizados e muito mais.",
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
              ASMR Universe
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate("/auth?tab=signup")}>
              Criar Conta
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
          className="relative z-10 text-center px-4 max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Acesso exclusivo por convite
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Seu refúgio de{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              relaxamento
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Uma plataforma exclusiva de conteúdo ASMR com comunidade, vídeos personalizados e experiências imersivas para acalmar sua mente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="text-base px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              onClick={() => navigate("/auth?tab=signup")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Criar Conta
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-base px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Já tenho conta
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
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para{" "}
              <span className="text-primary">relaxar</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Uma experiência completa pensada para seu bem-estar
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
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-card/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perguntas Frequentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm">{faq.a}</p>
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
              Pronto para relaxar?
            </h2>
            <p className="text-muted-foreground mb-8">
              Use seu código de convite e entre para a comunidade mais acolhedora da internet.
            </p>
            <Button
              size="lg"
              className="text-base px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              onClick={() => navigate("/auth?tab=signup")}
            >
              Começar Agora
            </Button>
          </GlassCard>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} ASMR Universe. Todos os direitos reservados.</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <a href="/termos" className="hover:text-primary transition-colors">Termos de Uso</a>
          <a href="/privacidade" className="hover:text-primary transition-colors">Privacidade</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
