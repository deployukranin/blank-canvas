import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Monitor, Smartphone, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_LAYOUT,
  LAYOUT_VARIANTS,
  isLayoutAllowed,
  isTrialPlan,
  type LayoutVariant,
} from '@/lib/store-layouts';

const LAYOUT_META: Record<LayoutVariant, { name: string; desc: string; sketch: React.ReactNode }> = {
  classic: {
    name: 'Classic',
    desc: 'Banner carousel, grid of quick actions and video carousels.',
    sketch: (
      <div className="space-y-1.5">
        <div className="h-8 rounded bg-primary/30" />
        <div className="grid grid-cols-3 gap-1">
          {[0, 1, 2].map(i => <div key={i} className="h-4 rounded bg-foreground/15" />)}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[0, 1, 2].map(i => <div key={i} className="h-5 rounded bg-foreground/10" />)}
        </div>
      </div>
    ),
  },
  spotlight: {
    name: 'Spotlight',
    desc: 'Cinematic full-screen hero, pill navigation and one featured video.',
    sketch: (
      <div className="space-y-1.5">
        <div className="h-12 rounded bg-primary/40" />
        <div className="flex gap-1">
          {[0, 1, 2].map(i => <div key={i} className="h-3 w-8 rounded-full bg-foreground/20" />)}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {[0, 1].map(i => <div key={i} className="h-5 rounded bg-foreground/10" />)}
        </div>
      </div>
    ),
  },
  magazine: {
    name: 'Magazine',
    desc: 'Editorial masthead, side-by-side hero and numbered video list.',
    sketch: (
      <div className="space-y-1.5">
        <div className="h-2 w-1/2 rounded bg-foreground/25" />
        <div className="grid grid-cols-2 gap-1">
          <div className="h-8 rounded bg-primary/30" />
          <div className="grid grid-cols-2 gap-1">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-3.5 rounded bg-foreground/15" />)}
          </div>
        </div>
        <div className="space-y-1">
          {[0, 1].map(i => <div key={i} className="h-2.5 rounded bg-foreground/10" />)}
        </div>
      </div>
    ),
  },
  cinematic: {
    name: 'Cinematic Desktop',
    desc: 'Desktop-first: persistent sidebar, topbar and wide hero — no bottom bar.',
    sketch: (
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
    ),
  },
};


export const LayoutPicker: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { config, setConfig } = useWhiteLabel();
  const { store, basePath } = useTenant();

  const current = (config.layout?.variant || DEFAULT_LAYOUT) as LayoutVariant;
  const [previewVariant, setPreviewVariant] = useState<LayoutVariant>(current);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('mobile');
  const [reloadKey, setReloadKey] = useState(0);

  const planType = store?.plan_type;
  const locked = (v: LayoutVariant) => !isLayoutAllowed(planType, v);

  const previewSrc = `${basePath || ''}/?preview_layout=${previewVariant}&t=${reloadKey}`;

  const apply = (variant: LayoutVariant) => {
    if (locked(variant)) {
      toast({
        title: t('admin.layout.locked', 'Layout available on paid plans'),
        description: t('admin.layout.lockedDesc', 'Upgrade your plan to unlock this layout.'),
        variant: 'destructive',
      });
      return;
    }
    setConfig({ ...config, layout: { variant } });
    toast({ title: t('admin.layout.saved', 'Layout updated!') });
  };

  return (
    <div className="space-y-6">
      {isTrialPlan(planType) && (
        <GlassCard className="p-4 flex items-center justify-between gap-4 border border-primary/25">
          <p className="text-sm text-muted-foreground">
            {t('admin.layout.trialNotice', 'On the trial plan only the Classic layout can be published. You can still preview the others.')}
          </p>
          <Link to={`${basePath || ''}/admin/plans`}>
            <Button size="sm">{t('admin.layout.upgrade', 'Upgrade')}</Button>
          </Link>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {LAYOUT_VARIANTS.map((variant, i) => {
          const meta = LAYOUT_META[variant];
          const isCurrent = current === variant;
          const isPreviewing = previewVariant === variant;
          return (
            <motion.button
              key={variant}
              type="button"
              onClick={() => setPreviewVariant(variant)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative rounded-2xl border p-4 text-left transition-colors ${
                isPreviewing ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40'
              }`}
            >
              <div className="rounded-lg bg-foreground/[0.03] p-2 mb-3">{meta.sketch}</div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-sm text-foreground">{meta.name}</span>
                {isCurrent && (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <Check className="w-3 h-3" />
                    {t('admin.layout.active', 'Active')}
                  </Badge>
                )}
                {locked(variant) && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{meta.desc}</p>

              <Button
                size="sm"
                variant={isCurrent ? 'outline' : 'default'}
                disabled={isCurrent}
                className="mt-3 w-full"
                onClick={(e) => { e.stopPropagation(); apply(variant); }}
              >
                {isCurrent ? t('admin.layout.inUse', 'In use') : t('admin.layout.use', 'Use this layout')}
              </Button>
            </motion.button>
          );
        })}
      </div>

      {/* Live preview */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t('admin.layout.preview', 'Preview')} — {LAYOUT_META[previewVariant].name}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('admin.layout.previewDesc', 'Live preview of your storefront with real data.')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant={device === 'mobile' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => setDevice('mobile')}>
              <Smartphone className="w-4 h-4" />
            </Button>
            <Button size="icon" variant={device === 'desktop' ? 'default' : 'ghost'} className="h-8 w-8" onClick={() => setDevice('desktop')}>
              <Monitor className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setReloadKey(k => k + 1)}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-center rounded-xl bg-foreground/[0.03] p-4 overflow-hidden">
          <div
            className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-xl transition-all"
            style={{ width: device === 'mobile' ? 390 : '100%', maxWidth: '100%', height: 640 }}
          >
            <iframe
              key={`${previewVariant}-${device}-${reloadKey}`}
              src={previewSrc}
              title={`${LAYOUT_META[previewVariant].name} preview`}
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default LayoutPicker;
