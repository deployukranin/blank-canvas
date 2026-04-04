import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Crown, ChevronRight, HelpCircle, FileText, Shield, Lightbulb, Package, Bell, LayoutDashboard, Camera, Check, X, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { getPendingOrdersCount } from '@/lib/order-store';
import { useCommunityNotifications } from '@/hooks/use-community-notifications';
import { useProfile } from '@/hooks/use-profile';
import { useUserRole } from '@/hooks/use-user-role';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

const PerfilPage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const pendingOrdersCount = getPendingOrdersCount();
  const { unreadCount } = useCommunityNotifications();
  const { profile, refetch: refetchProfile } = useProfile();
  const { isAdmin: isAdminFn, isCEO: isCEOFn } = useUserRole();
  const isAdmin = isAdminFn();
  const isCEO = isCEOFn();
  const { basePath } = useTenant();
  const myOrdersPath = basePath ? `${basePath}/orders` : '/orders';

  const quickAccessItems = [
    { icon: Package, label: t('profile.myOrders', 'My Orders'), description: t('profile.trackVideos', 'Track your videos'), path: myOrdersPath, gradient: 'from-purple-400 to-pink-500', badge: 'orders' as const },
    { icon: Bell, label: t('profile.notifications', 'Notifications'), description: t('profile.commentsVotes', 'Comments and votes'), path: '/notifications', gradient: 'from-blue-400 to-cyan-500', badge: 'notifications' as const },
    { icon: Lightbulb, label: t('profile.videoIdeas', 'Video Ideas'), description: t('profile.suggestVote', 'Suggest and vote on ideas'), path: '/ideas', gradient: 'from-amber-400 to-orange-500' },
    { icon: Crown, label: t('profile.vipCommunity', 'VIP Community'), description: t('profile.exclusiveAccess', 'Exclusive access'), path: '/vip', gradient: 'from-vip to-amber-500' },
  ];

  const menuItems = [
    { icon: HelpCircle, label: t('profile.help', 'Help'), description: t('profile.faqSupport', 'FAQ and support'), path: '/help' },
    { icon: FileText, label: t('profile.terms', 'Terms of Use'), description: t('profile.readTerms', 'Read our terms'), path: '/terms' },
    { icon: Shield, label: t('profile.privacy', 'Privacy'), description: t('profile.privacyPolicy', 'Privacy policy'), path: '/privacy' },
  ];

  const handleSaveAvatar = async () => {
    if (!user || !avatarUrl.trim()) return;
    setSavingAvatar(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, avatar_url: avatarUrl.trim() }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success(t('profile.avatarSaved', 'Profile photo updated!'));
      setEditingAvatar(false);
      setAvatarUrl('');
      refetchProfile();
    } catch (err) {
      console.error('Error saving avatar:', err);
      toast.error(t('profile.avatarError', 'Error updating profile photo'));
    } finally {
      setSavingAvatar(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <MobileLayout title={t('nav.profile')} hideHeader>
        <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="font-display text-xl font-bold mb-2">{t('storefront.enterAccount')}</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">{t('storefront.enterAccountDesc')}</p>
            <Button onClick={() => setShowAuthModal(true)} className="font-medium h-12 px-8">
              {t('storefront.enterOrCreate')}
            </Button>
          </motion.div>
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title={t('nav.profile')} hideHeader>
      <div className="px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
                {profile?.avatar_url || user?.avatar ? (
                  <img src={profile?.avatar_url || user?.avatar} alt={profile?.handle || user?.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary-foreground">
                    {profile?.handle?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {!isAdmin && !isCEO && (
                <button onClick={() => { setEditingAvatar(!editingAvatar); setAvatarUrl(profile?.avatar_url || ''); }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Camera className="w-3 h-3 text-primary-foreground" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg">
                  {profile?.handle ? `@${profile.handle}` : user?.username}
                </h2>
                {user?.isVIP && (
                  <span className="px-2 py-0.5 rounded-full bg-vip/20 text-vip text-xs font-medium">VIP 👑</span>
                )}
              </div>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </GlassCard>

          {editingAvatar && !isAdmin && !isCEO && (
            <div className="mt-3 flex gap-2 items-center">
              <Input placeholder={t('profile.avatarUrlPlaceholder', 'Paste image URL...')} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="flex-1 h-9 text-sm" />
              <Button size="sm" variant="ghost" onClick={handleSaveAvatar} disabled={savingAvatar || !avatarUrl.trim()}><Check className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingAvatar(false)}><X className="w-4 h-4" /></Button>
            </div>
          )}
        </motion.div>

        {(isAdmin || isCEO) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Link to={`${basePath}/admin`}>
              <GlassCard className="p-4" hover>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Dashboard</p>
                    <p className="text-xs text-muted-foreground">
                      {isCEO ? t('storefront.dashboardCEO') : t('storefront.dashboardAdmin')}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">{t('storefront.quickAccess')}</h3>
          {quickAccessItems.map((item) => {
            const badgeCount = item.badge === 'orders' ? pendingOrdersCount : item.badge === 'notifications' ? unreadCount : 0;
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

        {/* Language Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
          <GlassCard className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Globe className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{t('profile.language', 'Language')}</p>
                <p className="text-xs text-muted-foreground">{t('profile.changeLanguage', 'Change app language')}</p>
              </div>
              <LanguageSelector variant="minimal" />
            </div>
          </GlassCard>
        </motion.div>

        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.div key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 + 0.15 }}>
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Button variant="ghost" onClick={logout} className="w-full h-12 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-5 h-5" />
            {t('profile.logout', 'Log out')}
          </Button>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default PerfilPage;
