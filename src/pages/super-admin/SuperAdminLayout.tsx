import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Store, TrendingUp, Settings, LogOut, Menu, X, ArrowLeft,
  LifeBuoy, Crown, Users, Handshake, Gift, Radar, ShieldAlert,
  PanelLeftClose, PanelLeftOpen, Search, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/use-user-role';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const COLLAPSE_KEY = 'admin-master:sidebar-collapsed';

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children, title }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isSuperAdmin, isTracker } = useUserRole();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });
  const [query, setQuery] = React.useState('');

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  };

  const trackerOnly = isTracker() && !isSuperAdmin();

  const menuItems = trackerOnly
    ? [
        { path: '/admin-master', icon: LayoutDashboard, label: t('superAdmin.dashboard') },
        { path: '/admin-master/tenants', icon: Store, label: t('superAdmin.platforms') },
        { path: '/admin-master/clients', icon: Users, label: t('nav.clients') },
        { path: '/admin-master/partners', icon: Handshake, label: t('nav.partners') },
        { path: '/admin-master/referrals', icon: Gift, label: t('nav.referrals') },
        { path: '/admin-master/ranking', icon: TrendingUp, label: t('superAdmin.ranking') },
        { path: '/admin-master/support', icon: LifeBuoy, label: t('superAdmin.supportNav') },
      ]
    : [
        { path: '/admin-master', icon: LayoutDashboard, label: t('superAdmin.dashboard') },
        { path: '/admin-master/tenants', icon: Store, label: t('superAdmin.platforms') },
        { path: '/admin-master/clients', icon: Users, label: t('nav.clients') },
        { path: '/admin-master/partners', icon: Handshake, label: t('nav.partners') },
        { path: '/admin-master/referrals', icon: Gift, label: t('nav.referrals') },
        { path: '/admin-master/tracking', icon: Radar, label: t('superAdmin.tracking', 'Tracking') },
        { path: '/admin-master/csp', icon: ShieldAlert, label: 'CSP Reports' },
        { path: '/admin-master/plans', icon: Crown, label: t('superAdmin.planConfig.navLabel', 'Planos') },
        { path: '/admin-master/ranking', icon: TrendingUp, label: t('superAdmin.ranking') },
        { path: '/admin-master/settings', icon: Settings, label: t('superAdmin.settings') },
        { path: '/admin-master/support', icon: LifeBuoy, label: t('superAdmin.supportNav') },
      ];

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return menuItems.filter(i => i.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query, menuItems]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const initial = user?.username?.charAt(0)?.toUpperCase() || 'S';
  const sidebarWidth = collapsed ? 'lg:w-[72px]' : 'lg:w-64';
  const mainOffset = collapsed ? 'lg:ml-[72px]' : 'lg:ml-64';

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen bg-black">
        {/* Mobile topbar */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-black/90 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/70 hover:text-white hover:bg-white/5">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <h1 className="font-semibold text-white truncate px-2">{title}</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white/70 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </header>

        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 w-64 bg-black border-r border-white/[0.06] z-40 flex flex-col",
          "transform transition-all duration-300 lg:translate-x-0",
          sidebarWidth,
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Brand / collapse */}
          <div className={cn(
            "h-14 shrink-0 flex items-center border-b border-white/[0.06]",
            collapsed ? "lg:justify-center px-3" : "justify-between px-4"
          )}>
            <div className={cn("flex items-center gap-2 min-w-0", collapsed && "lg:hidden")}>
              <div className="w-7 h-7 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0">
                <Crown className="w-3.5 h-3.5 text-purple-300" />
              </div>
              <span className="text-sm font-semibold text-white/90 tracking-tight truncate">CEO</span>
            </div>
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-white/35 hover:text-white/80 hover:bg-white/5 transition-colors"
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav */}
          <nav className={cn("py-3 space-y-1 overflow-y-auto flex-1", collapsed ? "lg:px-2 px-3" : "px-3")}>
            {menuItems.map((item) => {
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
                      ? "bg-white/[0.06] text-white"
                      : "text-white/45 hover:bg-white/[0.03] hover:text-white/80"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full bg-purple-400" />
                  )}
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-purple-300" : "")} />
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
          </nav>

          {/* Footer user (only expanded) */}
          <div className={cn("shrink-0 border-t border-white/[0.06] p-3", collapsed && "lg:hidden")}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-purple-600/15 flex items-center justify-center shrink-0">
                <span className="text-xs text-purple-300 font-semibold">{initial}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">{user?.username}</p>
                <p className="text-[10px] text-white/35 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/70 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main */}
        <main className={cn("pt-14 lg:pt-0 min-h-screen bg-black transition-all duration-300", mainOffset)}>
          {/* Desktop topbar */}
          <div className="hidden lg:flex sticky top-0 z-30 items-center gap-4 h-14 px-6 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
            <h1 className="text-base font-semibold text-white tracking-tight shrink-0">{title}</h1>

            {/* Quick search */}
            <div className="relative flex-1 max-w-sm ml-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('common.search', 'Buscar')}
                className="w-full h-8 pl-9 pr-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-purple-500/30 focus:bg-white/[0.05] transition-colors"
              />
              {results.length > 0 && (
                <div className="absolute top-10 left-0 right-0 rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-1.5 shadow-2xl">
                  {results.map(r => (
                    <button
                      key={r.path}
                      onClick={() => { navigate(r.path); setQuery(''); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      <r.icon className="w-3.5 h-3.5 text-purple-300/70" />
                      <span className="truncate">{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto shrink-0">
              <LanguageSelector variant="minimal" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 h-8 pl-1.5 pr-2 rounded-lg hover:bg-white/[0.05] transition-colors">
                    <span className="w-6 h-6 rounded-md bg-purple-600/20 flex items-center justify-center text-[11px] font-semibold text-purple-300">
                      {initial}
                    </span>
                    <span className="text-sm text-white/70 max-w-[120px] truncate">{user?.username}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs font-normal text-white/50 truncate">{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/')} className="text-sm">
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
            {children}
          </motion.div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default SuperAdminLayout;
