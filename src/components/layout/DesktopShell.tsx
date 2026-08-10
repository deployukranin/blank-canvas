import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Lightbulb, LogIn, Package, Sparkles, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { Button } from '@/components/ui/button';
import { translatePathLabel } from '@/lib/nav-i18n';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useProfile } from '@/hooks/use-profile';
import { useVIPSubscription } from '@/hooks/use-vip-subscription';
import { useProfileCustomization } from '@/hooks/use-profile-customization';
import defaultAvatar from '@/assets/default-profile-avatar.jpg.asset.json';

interface DesktopShellProps {
  children: ReactNode;
  title?: string;
  /** Render children without the framed card wrapper */
  fullBleed?: boolean;
}

/**
 * Desktop-first application shell used by the "cinematic" storefront layout.
 * Replaces the mobile header + bottom tab bar with a persistent sidebar and topbar.
 */
export const DesktopShell = ({ children, title, fullBleed }: DesktopShellProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { config } = useWhiteLabel();
  const { basePath, isTenantScope, store } = useTenant();
  const { isAuthenticated, user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { customization } = useProfileCustomization();
  const { isVIP, isLoading: vipLoading } = useVIPSubscription();


  const withBase = (path: string) => {
    if (!isTenantScope) return path;
    if (path === '/') return basePath || '/';
    return `${basePath}${path}`;
  };

  const navItems = config.navigationTabs
    .filter((tab) => tab.enabled && tab.path !== '/loja')
    .sort((a, b) => a.order - b.order);

  const navPaths = new Set(navItems.map((tab) => tab.path));
  const secondaryItems = [
    { path: '/orders', icon: Package, label: t('nav.myOrders', 'My Orders') },
    { path: '/ideas', icon: Lightbulb, label: t('nav.ideas', 'Ideas') },
  ].filter((item) => !navPaths.has(item.path));

  const storeName = store?.name || config.siteName || '';
  // The favicon uploaded in /customize is the tenant brand mark — reuse it as the shell logo
  const brandLogo = config.logoImage || store?.avatar_url || '';
  const homePath = withBase('/');
  const isHome = location.pathname === homePath || location.pathname === `${homePath}/`;
  const accountAvatar = customization.avatar_url || profile?.avatar_url || user?.avatar || defaultAvatar.url;

  return (
    <div className="min-h-screen w-full bg-background flex">
      {/* Persistent sidebar */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-border/40 bg-card/40 backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-7">
          <Link to={withBase('/')} className="flex items-center gap-3 mb-9">
            {brandLogo ? (
              <img src={brandLogo} alt={storeName} className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_-2px_hsl(var(--primary)/0.6)]">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <span className="text-lg font-display font-bold tracking-tight text-foreground truncate">
              {storeName}
            </span>
          </Link>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const resolved = withBase(item.path);
              const isActive =
                location.pathname === resolved ||
                (item.path === '/' && (location.pathname === basePath || location.pathname === '/'));
              const label = translatePathLabel(t, item.path, item.label);

              return (
                <Link
                  key={item.id}
                  to={resolved}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all border ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold border-primary/20'
                      : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-foreground/5'
                  }`}
                >
                  <DynamicIcon icon={item.icon} size={18} />
                  {label}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-border/40 space-y-1.5">
              {secondaryItems.map((item) => {
                const resolved = withBase(item.path);
                const isActive = location.pathname === resolved;
                return (
                  <Link
                    key={item.path}
                    to={resolved}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all border ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold border-primary/20'
                        : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    <item.icon className="w-[18px] h-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="mt-auto p-5 space-y-4">
          {!vipLoading && !isVIP && (
            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-primary to-primary/40">
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70 mb-1">
                  {t('nav.vip')}
                </p>
                <p className="text-sm font-semibold text-primary-foreground mb-3">
                  {t('storefront.joinCommunityDesc')}
                </p>
                <Link to={withBase('/vip')}>
                  <Button size="sm" variant="secondary" className="w-full text-xs font-bold uppercase">
                    {t('storefront.viewAll')}
                  </Button>
                </Link>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-foreground/10 rounded-full blur-2xl" />
            </div>
          )}

          <Link
            to={isAuthenticated ? withBase('/profile') : withBase('/login')}
            className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-foreground/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border/60 flex items-center justify-center text-muted-foreground">
              {isAuthenticated ? (
                <img src={accountAvatar} alt={profile?.handle ? `@${profile.handle}` : t('profile.member', 'Member')} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">
                {isAuthenticated
                  ? profile?.handle
                    ? `@${profile.handle}`
                    : profileLoading
                      ? '\u00A0'
                      : t('profile.member', 'Member')
                  : t('storefront.signIn')}
              </p>
              <p className="text-[10px] uppercase font-bold tracking-tight text-muted-foreground">
                {isAuthenticated ? t('nav.profile') : t('storefront.joinCommunity')}
              </p>
            </div>

          </Link>
        </div>
      </aside>

      {/* Main canvas */}
      <div className="flex-1 min-w-0 flex flex-col bg-gradient-to-b from-primary/[0.06] to-background">
        <header className="h-20 shrink-0 flex items-center justify-between px-10 border-b border-border/40 sticky top-0 z-40 bg-background/70 backdrop-blur-xl">
          <div className="flex items-center gap-4 min-w-0">
            {title && (
              <h1 className="font-display font-semibold text-lg text-muted-foreground truncate">{title}</h1>
            )}
          </div>



          <div className="flex items-center gap-5">
            <LanguageSelector variant="store" />
            <Link
              to={withBase('/notifications')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t('nav.notifications')}
            >
              <Bell className="w-5 h-5" />
            </Link>
            <span className="h-8 w-px bg-border" />
            {isAuthenticated ? (
              <Link to={withBase('/profile')}>
                <Button size="sm" variant="outline" className="gap-2">
                  <User className="w-4 h-4" />
                  {t('nav.profile')}
                </Button>
              </Link>
            ) : (
              <Link to={withBase('/login')}>
                <Button size="sm" className="gap-2 font-semibold">
                  <LogIn className="w-4 h-4" />
                  {t('storefront.signIn')}
                </Button>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 px-10 py-8 max-w-[1600px] w-full mx-auto">
          {isHome || fullBleed ? (
            children
          ) : (
            <div className="rounded-[32px] border border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden [&_.pb-20]:pb-0 [&_.min-h-screen]:min-h-0">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DesktopShell;
