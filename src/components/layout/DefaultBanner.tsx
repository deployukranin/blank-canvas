/**
 * Generic fallback banner rendered when a store has no custom banner uploaded.
 * Pure CSS gradient built from the tenant's design tokens, so it adapts to any
 * palette configured in the admin panel (no static image involved).
 */
export const DefaultBanner = ({ className = '' }: { className?: string }) => (
  <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
    {/* base wash */}
    <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary)/0.55)_0%,hsl(var(--primary)/0.18)_45%,hsl(var(--background))_100%)]" />
    {/* soft glow accents */}
    <div className="absolute -top-1/3 -left-10 w-[60%] aspect-square rounded-full bg-primary/30 blur-[120px]" />
    <div className="absolute -bottom-1/3 right-0 w-[55%] aspect-square rounded-full bg-primary/20 blur-[130px]" />
    {/* subtle texture lines to avoid a flat look */}
    <div className="absolute inset-0 opacity-[0.07] bg-[repeating-linear-gradient(115deg,hsl(var(--foreground))_0px,hsl(var(--foreground))_1px,transparent_1px,transparent_14px)]" />
  </div>
);

export default DefaultBanner;
