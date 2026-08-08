import { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { DesktopShell } from './DesktopShell';
import { CinematicMobileShell } from './CinematicMobileShell';

import { useIsMobile } from '@/hooks/use-mobile';
import { useTenant } from '@/contexts/TenantContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { LAYOUT_VARIANTS, normalizeLayout, type LayoutVariant } from '@/lib/store-layouts';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  hideHeader?: boolean;
  /** Desktop cinematic shell: render children without the framed card wrapper */
  fullBleed?: boolean;
}

export const MobileLayout = ({ children, title, showBack, hideHeader, fullBleed }: MobileLayoutProps) => {
  const isMobile = useIsMobile();
  const { store } = useTenant();
  const { config } = useWhiteLabel();
  const [searchParams] = useSearchParams();

  const previewParam = searchParams.get('preview_layout') as LayoutVariant | null;
  const variant =
    previewParam && LAYOUT_VARIANTS.includes(previewParam)
      ? previewParam
      : normalizeLayout(config.layout?.variant, store?.plan_type);

  if (variant === 'cinematic') {
    if (!isMobile) {
      return <DesktopShell title={title} fullBleed={fullBleed}>{children}</DesktopShell>;
    }
    return (
      <CinematicMobileShell title={hideHeader ? undefined : title} showBack={showBack}>
        {children}
      </CinematicMobileShell>
    );
  }


  return (
    <div className="min-h-screen flex flex-col pb-20">
      {!hideHeader && <MobileHeader title={title} showBack={showBack} />}
      <main className={`flex-1 ${hideHeader ? '' : 'pt-14'}`}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
