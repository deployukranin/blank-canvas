import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Crown, Settings, ChevronRight, HelpCircle, FileText, Shield, Lightbulb, Package, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { getPendingOrdersCount } from '@/lib/order-store';
import { useCommunityNotifications } from '@/hooks/use-community-notifications';
import { HandleSelector } from '@/components/profile/HandleSelector';
import { useProfile } from '@/hooks/use-profile';

const quickAccessItems = [
  { icon: Package, label: 'Meus Pedidos', description: 'Acompanhe seus vídeos', path: '/meus-pedidos', gradient: 'from-purple-400 to-pink-500', badge: 'orders' as const },
  { icon: Bell, label: 'Notificações', description: 'Comentários e votos', path: '/notificacoes', gradient: 'from-blue-400 to-cyan-500', badge: 'notifications' as const },
  { icon: Lightbulb, label: 'Ideias de Vídeos', description: 'Sugira e vote em ideias', path: '/ideias', gradient: 'from-amber-400 to-orange-500' },
  { icon: Crown, label: 'Comunidade VIP', description: 'Acesso exclusivo', path: '/vip', gradient: 'from-vip to-amber-500' },
];

const menuItems = [
  { icon: Settings, label: 'Configurações', description: 'Preferências do app', path: '/perfil/configuracoes' },
  { icon: HelpCircle, label: 'Ajuda', description: 'FAQ e suporte', path: '/ajuda' },
  { icon: FileText, label: 'Termos de Uso', description: 'Leia nossos termos', path: '/termos' },
  { icon: Shield, label: 'Privacidade', description: 'Política de privacidade', path: '/privacidade' },
];

const PerfilPage = () => {
  const { user, isAuthenticated, logout, loginWithGoogle, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pendingOrdersCount = getPendingOrdersCount();
  const { unreadCount } = useCommunityNotifications();
  const { profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile();

  if (!isAuthenticated) {
    return (
      <MobileLayout title="Perfil" hideHeader>
        <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="font-display text-xl font-bold mb-2">Entre na sua conta</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Faça login para salvar suas preferências, votar em ideias e fazer compras
            </p>
            <Button
              onClick={() => setShowAuthModal(true)}
              className="gap-3 bg-white text-gray-900 hover:bg-gray-100 font-medium h-12 px-8"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </Button>
          </motion.div>

          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Perfil" hideHeader>
      <div className="px-4 py-6 space-y-6">
        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={profile?.handle || user.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {profile?.handle?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg">
                  {profile?.handle ? `@${profile.handle}` : user?.username}
                </h2>
                {user?.isVIP && (
                  <span className="px-2 py-0.5 rounded-full bg-vip/20 text-vip text-xs font-medium">
                    VIP 👑
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Handle Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <HandleSelector 
            currentHandle={profile?.handle} 
            onHandleSet={() => refetchProfile()}
          />
        </motion.div>

        {/* Quick Access - Ideias & VIP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <h3 className="text-sm font-medium text-muted-foreground px-1">Acesso Rápido</h3>
          {quickAccessItems.map((item) => {
            const badgeCount = item.badge === 'orders' ? pendingOrdersCount 
              : item.badge === 'notifications' ? unreadCount 
              : 0;
            
            return (
              <Link key={item.path} to={item.path}>
                <GlassCard className="p-4" hover>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center relative`}>
                      <item.icon className="w-5 h-5 text-white" />
                      {badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                          {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </motion.div>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 + 0.15 }}
            >
              <Link to={item.path}>
                <GlassCard className="p-4" hover>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full h-12 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            Sair da conta
          </Button>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default PerfilPage;
