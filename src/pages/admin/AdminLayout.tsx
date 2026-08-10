import React from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Lightbulb, Trophy, ShoppingCart, Users, FileText,
  Settings, LogOut, Menu, X, ArrowLeft, CreditCard,
  Crown, Youtube, Palette, Star, Gem, LifeBuoy, Share2, Globe, Sparkles,
  AlertTriangle, Gift, Handshake, PanelLeftClose, PanelLeftOpen, Search, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useTranslation } from 'react-i18next';
import { BugReportDialog } from '@/components/bugs/BugReportDialog';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { expiresAtMs, isTrialExpired as checkTrialExpired } from '@/lib/trial';
import { provisionStoreDrive } from '@/lib/external-storage';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';


interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const COLLAPSE_KEY = 'store-admin:sidebar-collapsed';

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { user, logout } = useAuth();
  const { store } = useTenant();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });
  const [query, setQuery] = React.useState('');

  // Garante a estrutura de pastas do cliente no Drive (config/vip/customs)
  React.useEffect(() => {
    if (store?.id) void provisionStoreDrive(store.id);
  }, [store?.id]);



  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  };

  // Trial expiry calculations (UTC-safe, stable across timezones/refreshes)
  const isTrialExpired = checkTrialExpired(store);
  const expiresMs = expiresAtMs(store?.plan_expires_at);
  const daysUntilDeletion = isTrialExpired && expiresMs !== null
    ? Math.max(0, 7 - Math.floor((Date.now() - expiresMs) / (1000 * 60 * 60 * 24)))
    : null;

  const base = slug ? `/${slug}/admin` : '/admin';

  const menuGroups = [
    {
      label: t('admin.groups.overview', 'Visão geral'),
      items: [
        { path: base, icon: LayoutDashboard, label: t('admin.dashboard') },
        { path: `${base}/orders`, icon: ShoppingCart, label: t('admin.orders') },
        { path: `${base}/payments`, icon: CreditCard, label: t('admin.payments') },
      ],
    },
    {
      label: t('admin.groups.content', 'Conteúdo'),
      items: [
        { path: `${base}/customs`, icon: Sparkles, label: "Custom's" },
        { path: `${base}/vip`, icon: Crown, label: 'VIP' },
        { path: `${base}/vipcontent`, icon: Star, label: t('admin.vipContent', 'VIP Content') },
        { path: `${base}/youtube`, icon: Youtube, label: t('admin.youtube') },
        { path: `${base}/content`, icon: FileText, label: t('admin.content') },
        { path: `${base}/ideas`, icon: Lightbulb, label: t('admin.ideas') },
        { path: `${base}/rewards`, icon: Trophy, label: t('admin.gamification.title', 'Gamification') },
      ],
    },
    {
      label: t('admin.groups.growth', 'Crescimento'),
      items: [
        { path: `${base}/users`, icon: Users, label: t('admin.users') },
        { path: `${base}/referrals`, icon: Gift, label: t('nav.referrals') },
        { path: `${base}/affiliates`, icon: Handshake, label: t('nav.affiliates') },
        { path: `${base}/plans`, icon: Gem, label: t('admin.plans.title') },
      ],
    },
    {
      label: t('admin.groups.store', 'Loja'),
      items: [
        { path: `${base}/customize`, icon: Palette, label: t('admin.personalization') },
        { path: `${base}/social-links`, icon: Share2, label: t('admin.socialLinks.title', 'Social Links') },
        { path: `${base}/domain`, icon: Globe, label: t('admin.domain.title', 'Custom Domain') },
        { path: `${base}/settings`, icon: Settings, label: t('admin.settings') },
        { path: `${base}/support`, icon: LifeBuoy, label: t('admin.supportLabel') },
      ],
    },
  ];

  const allItems = React.useMemo(() => menuGroups.flatMap(g => g.items), [menuGroups]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allItems.filter(i => i.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query, allItems]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const initial = user?.username?.charAt(0)?.toUpperCase() || 'A';
  const sidebarWidth = collapsed ? 'lg:w-[72px]' : 'lg:w-64';
  const mainOffset = collapsed ? 'lg:ml-[72px]' : 'lg:ml-64';

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen bg-background">
        {/* Mobile topbar */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background/85 backdrop-blur-xl border-b border-border/40 z-50 flex items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-foreground/70 hover:text-foreground hover:bg-foreground/5">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <h1 className="font-semibold text-foreground truncate px-2">{title}</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate(slug ? `/${slug}` : '/')} className="text-foreground/70 hover:text-foreground hover:bg-foreground/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </header>

        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 w-64 bg-background border-r border-border/40 z-40 flex flex-col",
          "transform transition-all duration-300 lg:translate-x-0",
          sidebarWidth,
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Brand / collapse */}
          <div className={cn(
            "h-14 shrink-0 flex items-center border-b border-border/40",
            collapsed ? "lg:justify-center px-3" : "justify-between px-4"
          )}>
            <div className={cn("flex items-center gap-2 min-w-0", collapsed && "lg:hidden")}>
              {store?.avatar_url ? (
                <img src={store.avatar_url} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <span className="text-sm font-semibold text-foreground/90 tracking-tight truncate">
                {store?.name || t('admin.dashboard')}
              </span>
            </div>
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-foreground/35 hover:text-foreground/80 hover:bg-foreground/5 transition-colors"
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav */}
          <nav className={cn("py-3 space-y-4 overflow-y-auto flex-1", collapsed ? "lg:px-2 px-3" : "px-3")}>
            {menuGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className={cn(
                  "px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/25",
                  collapsed && "lg:hidden"
                )}>
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const link = (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl transition-all text-sm px-3 py-2.5",
                        collapsed && "lg:justify-center lg:px-0 lg:h-10 lg:py-0",
                        isActive
                          ? "bg-primary/10 text-foreground"
                          : "text-foreground/45 hover:bg-foreground/[0.04] hover:text-foreground/80"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full bg-primary" />
                      )}
                      <item.icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
                      <span className={cn("font-medium truncate", collapsed && "lg:hidden")}>{item.label}</span>
                    </Link>
                  );

                  if (!collapsed) return link;
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </nav>



        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/70 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main */}
        <main className={cn("pt-14 lg:pt-0 min-h-screen bg-background transition-all duration-300", mainOffset)}>
          {isTrialExpired && (
            <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-3 flex items-center gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-destructive font-medium">
                {t('admin.trial.expired')}{' '}
                {daysUntilDeletion !== null && daysUntilDeletion > 0
                  ? t('admin.trial.deleteWarning', { days: daysUntilDeletion })
                  : t('admin.trial.deleteSoon')}
              </p>
              <Link to={`${base}/plans`} className="shrink-0 ml-auto text-xs font-semibold text-destructive underline hover:no-underline">
                {t('admin.trial.upgrade')}
              </Link>
            </div>
          )}

          {/* Desktop topbar */}
          <div className="hidden lg:flex sticky top-0 z-30 items-center gap-4 h-14 px-6 border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <h1 className="text-base font-semibold text-foreground tracking-tight shrink-0">{title}</h1>

            <div className="relative flex-1 max-w-sm ml-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/25" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('common.search', 'Buscar')}
                className="w-full h-8 pl-9 pr-3 rounded-lg bg-foreground/[0.03] border border-border/40 text-sm text-foreground/80 placeholder:text-foreground/25 outline-none focus:border-primary/40 focus:bg-foreground/[0.05] transition-colors"
              />
              {results.length > 0 && (
                <div className="absolute top-10 left-0 right-0 rounded-xl border border-border/60 bg-popover p-1.5 shadow-2xl">
                  {results.map(r => (
                    <button
                      key={r.path}
                      onClick={() => { navigate(r.path); setQuery(''); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] transition-colors"
                    >
                      <r.icon className="w-3.5 h-3.5 text-primary/70" />
                      <span className="truncate">{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto shrink-0">
              <BugReportDialog variant="ghost" className="hidden sm:flex" />
              <LanguageSelector variant="minimal" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 h-8 pl-1.5 pr-2 rounded-lg hover:bg-foreground/[0.05] transition-colors">
                    <span className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center text-[11px] font-semibold text-primary">
                      {initial}
                    </span>
                    <span className="text-sm text-foreground/70 max-w-[120px] truncate">{user?.username}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-foreground/30" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs font-normal text-foreground/50 truncate">{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(slug ? `/${slug}` : '/')} className="text-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('common.backToSite', 'Voltar ao site')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-sm text-red-400 focus:text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('common.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 lg:p-6 max-w-[1600px] mx-auto"
          >
            <EmailVerificationBanner className="mb-4" />
            {children}

          </motion.div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default AdminLayout;
