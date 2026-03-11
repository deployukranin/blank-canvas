import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export type AdFormat = 'horizontal' | 'rectangle' | 'vertical' | 'fluid';

interface AdBannerProps {
  adSlot?: string;
  /** Which slot key to use from config (home, gallery, community, videos, ideas) */
  slotKey?: 'home' | 'gallery' | 'community' | 'videos' | 'ideas';
  format?: AdFormat;
  className?: string;
  fullWidth?: boolean;
}

const formatStyles: Record<AdFormat, string> = {
  horizontal: 'min-h-[90px]',
  rectangle: 'min-h-[250px]',
  vertical: 'min-h-[600px]',
  fluid: 'min-h-[100px]',
};

export const AdBanner = ({ adSlot, slotKey, format = 'horizontal', className, fullWidth = true }: AdBannerProps) => {
  const { config } = useWhiteLabel();
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  const publisherId = config.adsense?.publisherId || '';
  const resolvedSlot = adSlot || (slotKey ? config.adsense?.slots?.[slotKey] : '') || '';
  const isEnabled = config.adsense?.enabled && publisherId && resolvedSlot;

  useEffect(() => {
    if (pushed.current || !isEnabled) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet
    }
  }, [isEnabled]);

  if (!isEnabled) {
    return <AdPlaceholder format={format} className={className} />;
  }

  return (
    <div
      ref={adRef}
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-xl',
        'bg-muted/30 border border-border/40',
        formatStyles[format],
        fullWidth && 'w-full',
        className
      )}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={resolvedSlot}
        data-ad-format={format === 'fluid' ? 'fluid' : 'auto'}
        data-full-width-responsive={fullWidth ? 'true' : 'false'}
      />
    </div>
  );
};

/**
 * Placeholder ad banner shown when AdSense is not configured.
 * Shows a subtle placeholder that doesn't disrupt UX.
 */
export const AdPlaceholder = ({ format = 'horizontal', className }: { format?: AdFormat; className?: string }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-xl',
        'bg-muted/20 border border-dashed border-border/30',
        format === 'horizontal' ? 'h-[90px]' : format === 'rectangle' ? 'h-[250px]' : 'h-[100px]',
        'w-full',
        className
      )}
    >
      <span className="text-xs text-muted-foreground/50 select-none">Anúncio</span>
    </div>
  );
};
