import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell, Lightbulb, LogIn, Menu, Package, Sparkles, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { translatePathLabel } from '@/lib/nav-i18n';
import { useProfile } from '@/hooks/use-profile';
import { useVIPSubscription } from '@/hooks/use-vip-subscription';
import { useProfileCustomization } from '@/hooks/use-profile-customization';
import defaultAvatar from '@/assets/default-profile-avatar.jpg.asset.json';

interface CinematicMobileShellProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  hideHeader?: boolean;
}

/**
 * Mobile counterpart of the "cinematic" storefront shell.
 * Keeps the same visual language as DesktopShell (glass topbar, brand mark, drawer nav)
 * instead of falling back to the classic mobile chrome.
 */
export const CinematicMobileShell = ({ children, title, showBack }: CinematicMobileShellProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { config } = useWhiteLabel();
  const { basePath, isTenantScope, store } = useTenant();
  const { isAuthenticated, user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { customization } = useProfileCustomization();
  const { isVIP, isLoading: vipLoading } = useVIPSubscription();

  const [open, setOpen] = useState(false);

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
  const brandLogo = config.logoImage || store?.avatar_url || '';
  const accountAvatar = customization.avatar_url || profile?.avatar_url || user?.avatar || defaultAvatar.url;
  const accountName = profile?.handle
    ? `@${profile.handle}`
    : profile?.display_name || user?.username || t('profile.member', 'Member');
  const [visibleAccountAvatar, setVisibleAccountAvatar] = useState(accountAvatar);
  useEffect(() => setVisibleAccountAvatar(accountAvatar), [accountAvatar]);

  const isActivePath = (path: string) => {
    const resolved = withBase(path);
    return (
      location.pathname === resolved ||
      (path === '/' && (location.pathname === basePath || location.pathname === '/'))
    );
  };

  const linkClass = (active: boolean) =>
    `flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all border ${
      active
        ? 'bg-primary/10 text-primary font-semibold border-primary/20'
        : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-foreground/5'
    }`;

  // Bottom bar keeps the 5 first primary destinations for thumb reach
  const bottomItems = navItems.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/[0.08] to-background">
      <header className="fixed top-0 left-0 right-0 z-50 safe-area-top">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-border/40 bg-background/70 backdrop-blur-xl">
          {showBack ? (
            <Link
              to={withBase('/')}
              className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl hover:bg-foreground/5"
              aria-label="back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl hover:bg-foreground/5"
                  aria-label={t('nav.menu', 'Menu')}
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-card/95 backdrop-blur-xl">
                <div className="p-6">
                  <Link to={withBase('/')} onClick={() => setOpen(false)} className="flex items-center gap-3 mb-8">
                    {brandLogo ? (
                      <img src={brandLogo} alt={storeName} className="h-10 w-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                    <span className="text-base font-display font-bold tracking-tight text-foreground truncate">
                      {storeName}
                    </span>
                  </Link>

                  <nav className="space-y-1.5">
                    {navItems.map((item) => (
                      <Link
                        key={item.id}
                        to={withBase(item.path)}
                        onClick={() => setOpen(false)}
                        className={linkClass(isActivePath(item.path))}
                      >
                        <DynamicIcon icon={item.icon} size={18} />
                        {translatePathLabel(t, item.path, item.label)}
                      </Link>
                    ))}

                    <div className="pt-4 mt-4 border-t border-border/40 space-y-1.5">
                      {secondaryItems.map((item) => (
                        <Link
                          key={item.path}
                          to={withBase(item.path)}
                          onClick={() => setOpen(false)}
                          className={linkClass(isActivePath(item.path))}
                        >
                          <item.icon className="w-[18px] h-[18px]" />
                          {item.label}
                        </Link>
                      ))}
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
                        <Link to={withBase('/vip')} onClick={() => setOpen(false)}>
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
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-foreground/5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border/60 flex items-center justify-center text-muted-foreground">
                      {isAuthenticated ? (
                        <img
                          src={visibleAccountAvatar}
                          alt={accountName}
                          className="w-full h-full object-cover"
                          onError={() => setVisibleAccountAvatar(profile?.avatar_url || user?.avatar || defaultAvatar.url)}
                        />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {isAuthenticated
                          ? profile?.handle || profile?.display_name || user?.username
                            ? accountName
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
              </SheetContent>
            </Sheet>
          )}

          <div className="flex-1 min-w-0 flex items-center gap-2">
            {title ? (
              <h1 className="font-display font-semibold text-sm text-foreground truncate">{title}</h1>
            ) : (
              <Link to={withBase('/')} className="flex items-center gap-2 min-w-0">
                {brandLogo && (
                  <img src={brandLogo} alt={storeName} className="h-7 w-7 rounded-lg object-cover" />
                )}
                <span className="font-display font-bold text-sm text-foreground truncate">{storeName}</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1">
            <LanguageSelector variant="store" />
            <Link
              to={withBase('/notifications')}
              className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={t('nav.notifications')}
            >
              <Bell className="w-[18px] h-[18px]" />
            </Link>
            {!isAuthenticated && (
              <Link to={withBase('/login')}>
                <Button size="sm" className="h-9 px-3 gap-1.5 font-semibold text-xs">
                  <LogIn className="w-3.5 h-3.5" />
                  {t('storefront.signIn')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16 pb-32 px-4">{children}</main>

      {/* Bottom rail — cinematic styling */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="mx-3 mb-3 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl px-1.5 py-1.5">
          <div className="flex items-center justify-around">
            {bottomItems.map((item) => {
              const active = isActivePath(item.path);
              return (
                <Link
                  key={item.id}
                  to={withBase(item.path)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[56px] transition-colors ${
                    active ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <DynamicIcon icon={item.icon} size={18} />
                  <span className="text-[10px] font-semibold truncate max-w-[56px]">
                    {translatePathLabel(t, item.path, item.label)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default CinematicMobileShell;
