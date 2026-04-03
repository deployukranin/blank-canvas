import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

import { MobileLayout } from "@/components/layout/MobileLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

export default function PrivacidadePage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("privacy.title");
  }, [t]);

  return (
    <MobileLayout title={t("privacy.title")} showBack>
      <main className="px-4 py-6 space-y-6">
        <header className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold">{t("privacy.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("privacy.lastUpdate")}</p>
          </div>
          <LanguageSelector variant="minimal" />
        </header>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-medium">{t("privacy.summary")}</h2>
                <p className="text-xs text-muted-foreground">{t("privacy.summaryDesc")}</p>
              </div>
            </div>

            {[1, 2, 3, 4].map((i) => (
              <section key={i} className="space-y-2">
                <h3 className="font-medium">{t(`privacy.section${i}Title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`privacy.section${i}Text`)}</p>
              </section>
            ))}
          </GlassCard>
        </motion.section>
      </main>
    </MobileLayout>
  );
}
