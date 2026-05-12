import { useEffect } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MobileLayout } from "@/components/layout/MobileLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export default function AjudaPage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t('storefront.helpTitle')} | MyTingleBox`;
  }, [t]);

  return (
    <MobileLayout title={t('storefront.helpTitle')} showBack>
      <main className="px-4 py-6 space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-2xl font-bold">{t('storefront.helpTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('storefront.helpSubtitle')}</p>
        </header>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-medium">{t('storefront.faq')}</h2>
                <p className="text-xs text-muted-foreground">{t('storefront.faqSubtitle')}</p>
              </div>
            </div>

            <div className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>{t('storefront.faqLogin')}</AccordionTrigger>
                  <AccordionContent>
                    <span dangerouslySetInnerHTML={{ __html: t('storefront.faqLoginAnswer') }} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>{t('storefront.faqNotifications')}</AccordionTrigger>
                  <AccordionContent>
                    <span dangerouslySetInnerHTML={{ __html: t('storefront.faqNotificationsAnswer') }} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>{t('storefront.faqOrders')}</AccordionTrigger>
                  <AccordionContent>
                    {t('storefront.faqOrdersAnswer')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </GlassCard>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} aria-label="Contact">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-medium">{t('storefront.support')}</h2>
                  <p className="text-xs text-muted-foreground">{t('storefront.supportDesc')}</p>
                </div>
              </div>

              <Button asChild variant="outline" size="sm">
                <a href="mailto:suporte@asmrluna.com">{t('storefront.sendEmail')}</a>
              </Button>
            </div>
          </GlassCard>
        </motion.section>
      </main>
    </MobileLayout>
  );
}
