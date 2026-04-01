import { useEffect } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

import { MobileLayout } from "@/components/layout/MobileLayout";
import { GlassCard } from "@/components/ui/GlassCard";

export default function TermosDeUsoPage() {
  useEffect(() => {
    document.title = "Termos de Uso | ASMR Luna";
  }, []);

  return (
    <MobileLayout title="Termos" showBack>
      <main className="px-4 py-6 space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-2xl font-bold">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground">Última atualização: em breve.</p>
        </header>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-medium">Resumo</h2>
                <p className="text-xs text-muted-foreground">
                  Este texto é um rascunho. Substitua pelo conteúdo jurídico oficial quando estiver pronto.
                </p>
              </div>
            </div>

            <section className="space-y-2">
              <h3 className="font-medium">1. Uso do app</h3>
              <p className="text-sm text-muted-foreground">
                Você concorda em utilizar o app de forma responsável e em conformidade com as leis aplicáveis.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-medium">2. Conteúdo</h3>
              <p className="text-sm text-muted-foreground">
                O conteúdo pode ser atualizado, removido ou modificado a qualquer momento.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-medium">3. Compras e assinaturas</h3>
              <p className="text-sm text-muted-foreground">
                Caso existam produtos/subscriptions, as condições serão exibidas no momento da contratação.
              </p>
            </section>
          </GlassCard>
        </motion.section>
      </main>
    </MobileLayout>
  );
}
