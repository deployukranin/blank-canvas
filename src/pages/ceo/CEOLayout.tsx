import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Store,
  ArrowLeft,
  Crown,
  LogOut,
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/use-user-role';

interface CEOLayoutProps {
  children: ReactNode;
  title: string;
}

const menuSections = [
  {
    label: 'Geral',
    items: [
      { icon: LayoutDashboard, label: 'Visão Geral', path: '/ceo' },
      { icon: Store, label: 'Minhas Lojas', path: '/ceo/lojas' },
    ],
  },
  {
    label: 'Análises',
    items: [
      { icon: DollarSign, label: 'Vendas', path: '/ceo/vendas' },
      { icon: Users, label: 'Usuários', path: '/ceo/usuarios' },
      { icon: BarChart3, label: 'Tráfego', path: '/ceo/trafego' },
      { icon: TrendingUp, label: 'Métricas', path: '/ceo/metricas' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { icon: Bell, label: 'Alertas', path: '/ceo/alertas' },
      { icon: Settings, label: 'Configurações', path: '/ceo/configuracoes' },
    ],
  },
];

export const CEOLayout = ({ children, title }: CEOLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isCEO, isLoading: rolesLoading } = useUserRole();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isCEO()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <Crown className="w-16 h-16 mx-auto text-amber-400 mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">
            Apenas contas CEO têm acesso a este painel.
          </p>
          <Button onClick={() => navigate('/admin/login')}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-amber-950/40 to-background border-r border-amber-600/20 fixed h-full flex flex-col">
        <div className="p-6 flex-1 pb-32">
          <Link to="/" className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar ao App</span>
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-950" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-amber-100">Meu Painel</h1>
              <p className="text-xs text-amber-400/70 flex items-center gap-1">
                <Store className="w-3 h-3" />
                Multi-Loja
              </p>
            </div>
          </div>

          <nav className="space-y-5">
            {menuSections.map((section, sIdx) => (
              <div key={section.label}>
                {sIdx > 0 && <Separator className="mb-4 bg-amber-600/15" />}
                <p className="text-[10px] uppercase tracking-widest text-amber-500/50 font-semibold mb-2 px-4">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-500/30'
                            : 'text-amber-100/70 hover:text-amber-100 hover:bg-amber-500/10'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User info at bottom */}
        <div className="p-6 border-t border-amber-600/20 space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-sm font-bold text-amber-950">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-amber-100 text-sm">{user?.username}</p>
              <p className="text-xs text-amber-400/60 flex items-center gap-1">
                <Crown className="w-3 h-3" /> CEO
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-amber-400/70 hover:text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-amber-600/20 px-8 py-4 flex items-center justify-between">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl font-bold text-amber-100"
          >
            {title}
          </motion.h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-amber-400/70 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </header>

        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CEOLayout;