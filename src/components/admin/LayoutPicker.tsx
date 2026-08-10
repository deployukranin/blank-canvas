import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';

export const LayoutPicker: React.FC = () => {
  const { t } = useTranslation();
  const { config } = useWhiteLabel();

  // Only Cinematic Desktop is currently enabled for all stores.
  const variant = config.layout?.variant || 'cinematic';

  return (
    <div className="space-y-6">
      <GlassCard className="p-4 flex flex-col gap-3 border border-primary/25">
        <p className="text-sm text-muted-foreground">
          {t('admin.layout.singleNotice', 'Only the Cinematic Desktop layout is available right now. Other layouts will be released in future updates.')}
        </p>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl border border-primary bg-primary/5 p-4 text-left"
        >
          <div className="rounded-lg bg-foreground/[0.03] p-2 mb-3">
            <div className="flex gap-1.5">
              <div className="w-1/4 space-y-1">
                {[0, 1, 2, 3].map(i => <div key={i} className="h-2 rounded bg-foreground/20" />)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="h-2 rounded bg-foreground/15" />
                <div className="h-8 rounded bg-primary/35" />
                <div className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map(i => <div key={i} className="h-4 rounded bg-foreground/10" />)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-sm text-foreground">Cinematic Desktop</span>
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Check className="w-3 h-3" />
              {t('admin.layout.active', 'Active')}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('admin.layout.cinematicDesc', 'Sidebar + topbar on desktop, drawer menu and floating tab bar on mobile.')}
          </p>
        </motion.div>
      </div>

      <input type="hidden" value={variant} />
    </div>
  );
};

export default LayoutPicker;
