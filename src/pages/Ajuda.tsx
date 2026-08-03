import { useEffect } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Mail } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export default function AjudaPage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("storefront.helpTitle")} | MyTingleBox`;
  }, [t]);

  const faqs = [
    { value: "item-1", q: t("storefront.faqLogin"), a: <Trans i18nKey="storefront.faqLoginAnswer" components={{ strong: <strong /> }} /> },
    { value: "item-2", q: t("storefront.faqNotifications"), a: <Trans i18nKey="storefront.faqNotificationsAnswer" components={{ strong: <strong /> }} /> },
    { value: "item-3", q: t("storefront.faqOrders"), a: t("storefront.faqOrdersAnswer") },
  ];

  return (
    <PublicPageLayout
      title={t("storefront.helpTitle")}
      subtitle={t("storefront.helpSubtitle")}
      eyebrow={
        <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full border border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[11px] font-medium text-[#c4b5fd]">
          <HelpCircle className="w-3.5 h-3.5" />
          {t("storefront.faq")}
        </span>
      }
    >
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7"
      >
        <h2 className="font-display text-lg font-semibold mb-1">{t("storefront.faq")}</h2>
        <p className="text-sm text-white/45 mb-4">{t("storefront.faqSubtitle")}</p>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f) => (
            <AccordionItem key={f.value} value={f.value} className="border-white/[0.08]">
              <AccordionTrigger className="text-left text-[15px] hover:no-underline hover:text-[#c4b5fd]">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-white/55 leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="mt-6 rounded-2xl border border-[#8b5cf6]/20 bg-gradient-to-br from-[#8b5cf6]/[0.12] to-transparent backdrop-blur-xl p-5 sm:p-7"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/20 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#c4b5fd]" />
            </div>
            <div>
              <h2 className="font-display font-semibold">{t("storefront.support")}</h2>
              <p className="text-sm text-white/50">{t("storefront.supportDesc")}</p>
            </div>
          </div>

          <Button
            asChild
            className="bg-[#8b5cf6] hover:bg-[#7c4ef0] text-white rounded-full px-6 shrink-0"
          >
            <a href="mailto:suporte@asmrluna.com">{t("storefront.sendEmail")}</a>
          </Button>
        </div>
      </motion.section>
    </PublicPageLayout>
  );
}
