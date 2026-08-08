import { useSearchParams } from 'react-router-dom';

import { useIsMobile } from '@/hooks/use-mobile';
import { useTenant } from '@/contexts/TenantContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { LAYOUT_VARIANTS, normalizeLayout, type LayoutVariant } from '@/lib/store-layouts';

/** True when the storefront runs the "cinematic" desktop shell (desktop viewport only). */
export const useCinematicDesktop = (): boolean => {
  const isMobile = useIsMobile();
  const { store } = useTenant();
  const { config } = useWhiteLabel();
  const [searchParams] = useSearchParams();

  const previewParam = searchParams.get('preview_layout') as LayoutVariant | null;
  const variant =
    previewParam && LAYOUT_VARIANTS.includes(previewParam)
      ? previewParam
      : normalizeLayout(config.layout?.variant, store?.plan_type);

  return variant === 'cinematic' && !isMobile;
};
