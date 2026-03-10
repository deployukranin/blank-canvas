import React from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Lightbulb, 
  ShoppingCart, 
  Users, 
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Shield,
  CreditCard,
  Crown,
  Video,
  Headphones,
  Youtube,
  QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/use-user-role';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/ideias', icon: Lightbulb, label: 'Ideias' },
  { path: '/admin/pedidos', icon: ShoppingCart, label: 'Pedidos' },
  { path: '/admin/pix', icon: QrCode, label: 'Configurar PIX' },
  { path: '/admin/vip-precos', icon: Crown, label: 'Preços VIP' },
  { path: '/admin/videos', icon: Video, label: 'Vídeos' },
  { path: '/admin/audios', icon: Headphones, label: 'Áudios' },
  { path: '/admin/youtube', icon: Youtube, label: 'YouTube' },
  { path: '/admin/usuarios', icon: Users, label: 'Usuários' },
  { path: '/admin/conteudo', icon: FileText, label: 'Conteúdo' },
  { path: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, session, isLoading: authLoading } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRole();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const isStaff = roles.some((r) => r.role === 'admin' || r.role === 'ceo');

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Evita pisca/loop: só decide depois que auth/roles estiverem estáveis
  if (authLoading || (session && rolesLoading)) return null;
  if (!session || !isStaff) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card/80 backdrop-blur-xl border-b border-border z-50 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <h1 className="font-semibold">{title}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-card/95 backdrop-blur-xl border-r border-border z-40 transform transition-transform duration-300 lg:translate-x-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold gradient-text">Admin Panel</h2>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto flex-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive 
                    ? "bg-primary/20 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2 shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao App</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-border bg-card/50">
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao App
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 lg:p-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminLayout;
