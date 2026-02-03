import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Crown, ChevronRight, HelpCircle, FileText, Shield, Lightbulb, Package, Bell, Link as LinkIcon, Check, Loader2, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { getPendingOrdersCount } from '@/lib/order-store';
import { useCommunityNotifications } from '@/hooks/use-community-notifications';
import { HandleSelector } from '@/components/profile/HandleSelector';
import { useProfile } from '@/hooks/use-profile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/use-user-role';

const quickAccessItems = [
  { icon: Package, label: 'Meus Pedidos', description: 'Acompanhe seus vídeos', path: '/meus-pedidos', gradient: 'from-purple-400 to-pink-500', badge: 'orders' as const },
  { icon: Bell, label: 'Notificações', description: 'Comentários e votos', path: '/notificacoes', gradient: 'from-blue-400 to-cyan-500', badge: 'notifications' as const },
  { icon: Lightbulb, label: 'Ideias de Vídeos', description: 'Sugira e vote em ideias', path: '/ideias', gradient: 'from-amber-400 to-orange-500' },
  { icon: Crown, label: 'Comunidade VIP', description: 'Acesso exclusivo', path: '/vip', gradient: 'from-vip to-amber-500' },
];

const menuItems = [
  { icon: HelpCircle, label: 'Ajuda', description: 'FAQ e suporte', path: '/ajuda' },
  { icon: FileText, label: 'Termos de Uso', description: 'Leia nossos termos', path: '/termos' },
  { icon: Shield, label: 'Privacidade', description: 'Política de privacidade', path: '/privacidade' },
];

const PerfilPage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const pendingOrdersCount = getPendingOrdersCount();
  const { unreadCount } = useCommunityNotifications();
  const { profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const { toast } = useToast();
  const { isAdmin, isCEO } = useUserRole();

  const handleSaveAvatar = async () => {
    if (!avatarUrl.trim() || !user) return;
    
    setIsSavingAvatar(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Foto atualizada!', description: 'Sua foto de perfil foi salva.' });
      setAvatarUrl('');
      refetchProfile();
    } catch (err) {
      console.error('Error saving avatar:', err);
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSavingAvatar(false);
    }
  };

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
              className="font-medium h-12 px-8"
            >
              Entrar ou Criar Conta
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
              {profile?.avatar_url || user?.avatar ? (
                <img 
                  src={profile?.avatar_url || user?.avatar} 
                  alt={profile?.handle || user?.username} 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <span className="text-2xl font-bold text-primary-foreground">
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

        {/* Handle Selector - only show if no handle set */}
        {!profile?.handle && (
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
        )}

        {/* Avatar URL Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <GlassCard className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Foto de perfil</p>
                <p className="text-xs text-muted-foreground">Cole o link de uma imagem</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                className="flex-1"
                disabled={isSavingAvatar}
              />
              <Button 
                onClick={handleSaveAvatar} 
                disabled={!avatarUrl.trim() || isSavingAvatar}
                size="sm"
                className="shrink-0"
              >
                {isSavingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Admin Dashboard Link */}
        {(isAdmin || isCEO) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link to={isCEO ? '/ceo' : '/admin'}>
              <GlassCard className="p-4" hover>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Dashboard</p>
                    <p className="text-xs text-muted-foreground">
                      {isCEO ? 'Painel CEO' : 'Painel Admin'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        )}

        {/* Quick Access - Ideias & VIP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
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
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
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
