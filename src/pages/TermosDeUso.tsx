import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

import { PublicPageLayout } from "@/components/layout/PublicPageLayout";

export default function TermosDeUsoPage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("terms.title")} | MyTingleBox`;
  }, [t]);

  const sections = [1, 2, 3, 4];

  return (
    <PublicPageLayout
      title={t("terms.title")}
      subtitle={t("terms.lastUpdate")}
      eyebrow={
        <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full border border-[#8b5cf6]/25 bg-[#8b5cf6]/10 text-[11px] font-medium text-[#c4b5fd]">
          <FileText className="w-3.5 h-3.5" />
          {t("terms.summary")}
        </span>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7"
      >
        <p className="text-sm text-white/50 leading-relaxed">{t("terms.summaryDesc")}</p>

        <nav className="hidden sm:flex flex-wrap gap-2 mt-5 pt-5 border-t border-white/[0.08]">
          {sections.map((i) => (
            <a
              key={i}
              href={`#terms-${i}`}
              className="text-xs px-3 h-7 inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-white hover:border-[#8b5cf6]/40 transition-colors"
            >
              {t(`terms.section${i}Title`)}
            </a>
          ))}
        </nav>
      </motion.div>

      <div className="mt-6 space-y-4">
        {sections.map((i, idx) => (
          <motion.section
            key={i}
            id={`terms-${i}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 * (idx + 1) }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 scroll-mt-24"
          >
            <div className="flex items-start gap-3">
              <span className="font-display text-sm font-semibold text-[#c4b5fd] mt-0.5">
                {String(i).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <h2 className="font-display text-lg font-semibold mb-2">{t(`terms.section${i}Title`)}</h2>
                <p className="text-[15px] text-white/55 leading-relaxed">{t(`terms.section${i}Text`)}</p>
              </div>
            </div>
          </motion.section>
        ))}
      </div>
    </PublicPageLayout>
  );
}
