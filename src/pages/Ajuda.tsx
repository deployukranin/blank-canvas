import { useEffect } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Mail } from "lucide-react";

import { MobileLayout } from "@/components/layout/MobileLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export default function AjudaPage() {
  useEffect(() => {
    document.title = "Ajuda | ASMR Luna";
  }, []);

  return (
    <MobileLayout title="Ajuda" showBack>
      <main className="px-4 py-6 space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-2xl font-bold">Ajuda</h1>
          <p className="text-sm text-muted-foreground">Dúvidas rápidas e suporte.</p>
        </header>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-medium">FAQ</h2>
                <p className="text-xs text-muted-foreground">Respostas para as dúvidas mais comuns.</p>
              </div>
            </div>

            <div className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Como faço login?</AccordionTrigger>
                  <AccordionContent>
                    Vá em <strong>Perfil</strong> e toque em <strong>Continuar com Google</strong>.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>Como ativar notificações?</AccordionTrigger>
                  <AccordionContent>
                    Em <strong>Perfil → Configurações</strong>, ative <strong>Notificações Push</strong>.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>Não estou vendo meus pedidos / vídeos</AccordionTrigger>
                  <AccordionContent>
                    Verifique se você está logado na mesma conta. Se ainda assim não aparecer, tente sair e entrar novamente.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </GlassCard>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          aria-label="Contato"
        >
          <GlassCard className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-medium">Suporte</h2>
                  <p className="text-xs text-muted-foreground">Precisa de ajuda? Fale com a gente.</p>
                </div>
              </div>

              <Button asChild variant="outline" size="sm">
                <a href="mailto:suporte@asmrluna.com">Enviar e-mail</a>
              </Button>
            </div>
          </GlassCard>
        </motion.section>
      </main>
    </MobileLayout>
  );
}
