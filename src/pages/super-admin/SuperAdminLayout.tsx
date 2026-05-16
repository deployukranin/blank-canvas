import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Store, TrendingUp, Settings, LogOut, Menu, X, ArrowLeft, LifeBuoy, Crown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children, title }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const menuItems = [
    { path: '/admin-master', icon: LayoutDashboard, label: t('superAdmin.dashboard') },
    { path: '/admin-master/tenants', icon: Store, label: t('superAdmin.platforms') },
    { path: '/admin-master/clients', icon: Users, label: 'Clientes' },
    { path: '/admin-master/plans', icon: Crown, label: t('superAdmin.planConfig.navLabel', 'Planos') },
    { path: '/admin-master/ranking', icon: TrendingUp, label: t('superAdmin.ranking') },
    { path: '/admin-master/settings', icon: Settings, label: t('superAdmin.settings') },
    { path: '/admin-master/support', icon: LifeBuoy, label: t('superAdmin.supportNav') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-black">
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-black/90 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/70 hover:text-white hover:bg-white/5">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <h1 className="font-semibold text-white">{title}</h1>
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white/70 hover:text-white hover:bg-white/5">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-black border-r border-purple-500/10 z-40 transform transition-transform duration-300 lg:translate-x-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-purple-500/10 shrink-0">
          <div className="flex items-center gap-2 mt-3">
            <div className="w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center">
              <span className="text-xs text-purple-400 font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || 'S'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white/90">{user?.username}</p>
              <p className="text-[11px] text-white/40">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",
                  isActive
                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/20"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80 border border-transparent"
                )}>
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen bg-black">
        <div className="hidden lg:flex items-center justify-between h-14 px-6 border-b border-purple-500/10">
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <div className="flex items-center gap-2">
            <LanguageSelector variant="minimal" />
            <Button variant="ghost" size="sm" onClick={handleLogout}
              className="gap-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-sm">
              <LogOut className="w-4 h-4" />
              {t('common.logout')}
            </Button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-4 lg:p-6">
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
