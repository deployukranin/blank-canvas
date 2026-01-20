import { useEffect } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

import { MobileLayout } from "@/components/layout/MobileLayout";
import { GlassCard } from "@/components/ui/GlassCard";

export default function PrivacidadePage() {
  useEffect(() => {
    document.title = "Privacidade | ASMR Luna";
  }, []);

  return (
    <MobileLayout title="Privacidade" showBack>
      <main className="px-4 py-6 space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-2xl font-bold">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: em breve.</p>
        </header>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-medium">Resumo</h2>
                <p className="text-xs text-muted-foreground">
                  Este texto é um rascunho. Substitua pelo conteúdo jurídico oficial quando estiver pronto.
                </p>
              </div>
            </div>

            <section className="space-y-2">
              <h3 className="font-medium">1. Dados que coletamos</h3>
              <p className="text-sm text-muted-foreground">
                Podemos coletar dados necessários para login e funcionamento do app (ex: identificadores de conta).
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-medium">2. Como usamos</h3>
              <p className="text-sm text-muted-foreground">
                Usamos os dados para autenticação, personalização e melhoria da experiência.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-medium">3. Seus controles</h3>
              <p className="text-sm text-muted-foreground">
                Você pode gerenciar permissões (ex: notificações) nas configurações do dispositivo/navegador.
              </p>
            </section>
          </GlassCard>
        </motion.section>
      </main>
    </MobileLayout>
  );
}
