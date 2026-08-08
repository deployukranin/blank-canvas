export type LayoutVariant = 'classic' | 'cinematic';

export const LAYOUT_VARIANTS: LayoutVariant[] = ['classic', 'cinematic'];

export const DEFAULT_LAYOUT: LayoutVariant = 'classic';

/** Variants available on the free trial */
export const FREE_LAYOUTS: LayoutVariant[] = ['classic'];

export const isTrialPlan = (planType?: string | null) =>
  !planType || ['trial', 'free', 'none'].includes(planType.toLowerCase());

export const isLayoutAllowed = (planType: string | null | undefined, variant: LayoutVariant) =>
  isTrialPlan(planType) ? FREE_LAYOUTS.includes(variant) : LAYOUT_VARIANTS.includes(variant);

export const normalizeLayout = (
  variant: string | undefined | null,
  planType?: string | null
): LayoutVariant => {
  const v = (variant || DEFAULT_LAYOUT) as LayoutVariant;
  if (!LAYOUT_VARIANTS.includes(v)) return DEFAULT_LAYOUT;
  if (!isLayoutAllowed(planType, v)) return DEFAULT_LAYOUT;
  return v;
};
