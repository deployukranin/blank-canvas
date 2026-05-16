import React from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Lightbulb, ShoppingCart, Users, FileText,
  Settings, LogOut, Menu, X, ArrowLeft, CreditCard,
  Crown, Youtube, Palette, Star, Gem, LifeBuoy, Share2, Globe, Sparkles, AlertTriangle, Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/use-user-role';
import { useProfile } from '@/hooks/use-profile';
import { useTenant } from '@/contexts/TenantContext';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { user, logout } = useAuth();
  const { roles } = useUserRole();
  const { profile } = useProfile();
  const { store } = useTenant();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Trial expiry calculations
  const isTrialExpired = store?.plan_type === 'trial' && store?.plan_expires_at && new Date(store.plan_expires_at) < new Date();
  const daysUntilDeletion = isTrialExpired && store?.plan_expires_at
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(store.plan_expires_at).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const base = slug ? `/${slug}/admin` : '/admin';

  const menuItems = [
    { path: base, icon: LayoutDashboard, label: t('admin.dashboard') },
    { path: `${base}/customs`, icon: Sparkles, label: "Custom's" },
    { path: `${base}/orders`, icon: ShoppingCart, label: t('admin.orders') },
    { path: `${base}/payments`, icon: CreditCard, label: t('admin.payments') },
    { path: `${base}/vip`, icon: Crown, label: 'VIP' },
    { path: `${base}/vipcontent`, icon: Star, label: t('admin.vipContent', 'VIP Content') },
    { path: `${base}/youtube`, icon: Youtube, label: t('admin.youtube') },
    { path: `${base}/content`, icon: FileText, label: t('admin.content') },
    { path: `${base}/ideas`, icon: Lightbulb, label: t('admin.ideas') },
    { path: `${base}/users`, icon: Users, label: t('admin.users') },
    { path: `${base}/customize`, icon: Palette, label: t('admin.personalization') },
    { path: `${base}/social-links`, icon: Share2, label: t('admin.socialLinks.title', 'Social Links') },
    { path: `${base}/domain`, icon: Globe, label: t('admin.domain.title', 'Custom Domain') },
    { path: `${base}/plans`, icon: Gem, label: t('admin.plans.title') },
    { path: `${base}/settings`, icon: Settings, label: t('admin.settings') },
    { path: `${base}/support`, icon: LifeBuoy, label: t('admin.supportLabel') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background/90 backdrop-blur-xl border-b border-border/30 z-50 flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-foreground/70 hover:text-foreground hover:bg-foreground/5">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <h1 className="font-semibold text-foreground">{title}</h1>
        <Button variant="ghost" size="icon" onClick={() => navigate(slug ? `/${slug}` : '/')} className="text-foreground/70 hover:text-foreground hover:bg-foreground/5">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-background border-r border-primary/10 z-40 transform transition-transform duration-300 lg:translate-x-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-primary/10 shrink-0">
          <div className="flex items-center gap-2 mt-1">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs text-primary font-bold">
                  {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground/90">{user?.username}</p>
              <p className="text-[11px] text-foreground/40">{user?.email}</p>
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
                    ? "bg-primary/20 text-primary border border-primary/20"
                    : "text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80 border border-transparent"
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

      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen bg-background">
        {isTrialExpired && (
          <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-3 flex items-center gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-destructive font-medium">
              Seu trial expirou! {daysUntilDeletion !== null && daysUntilDeletion > 0
                ? `Contrate um plano em ${daysUntilDeletion} dia${daysUntilDeletion !== 1 ? 's' : ''} ou sua loja será apagada automaticamente.`
                : 'Sua loja será apagada em breve. Contrate um plano agora!'}
            </p>
            <Link to={`${base}/plans`} className="shrink-0 ml-auto text-xs font-semibold text-destructive underline hover:no-underline">
              Ver planos
            </Link>
          </div>
        )}
        <div className="hidden lg:flex items-center justify-between h-14 px-6 border-b border-primary/10">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <div className="flex items-center gap-2">
            <LanguageSelector variant="minimal" />
            <Button variant="ghost" size="sm" onClick={() => navigate(slug ? `/${slug}` : '/')}
              className="gap-2 text-foreground/40 hover:text-foreground/80 hover:bg-foreground/5 text-sm">
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </Button>
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

export default AdminLayout;
