import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Crown, ChevronRight, HelpCircle, FileText, Shield, Lightbulb, Package, Bell, LayoutDashboard, Camera, Check, Trophy, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { getPendingOrdersCount } from '@/lib/order-store';
import { useCommunityNotifications } from '@/hooks/use-community-notifications';
import { useProfile } from '@/hooks/use-profile';
import { useUserRole } from '@/hooks/use-user-role';
import { useTenant } from '@/contexts/TenantContext';
import { useVIPSubscription } from '@/hooks/use-vip-subscription';
import { useCinematicDesktop } from '@/hooks/use-cinematic-desktop';
import { PremiumProfileHeader } from '@/components/profile/PremiumProfileHeader';
import { HandleSelector } from '@/components/profile/HandleSelector';
import { useProfileCustomization } from '@/hooks/use-profile-customization';
import { useReputation, useLeaderboard } from '@/hooks/use-gamification';
import { supabase } from '@/integrations/supabase/client';
import { BugReportDialog } from '@/components/bugs/BugReportDialog';

const PerfilPage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pendingOrdersCount = getPendingOrdersCount();
  const { unreadCount } = useCommunityNotifications();
  const { profile, refetch: refetchProfile } = useProfile();
  const { customization } = useProfileCustomization();
  const { isAdmin: isAdminFn, isCEO: isCEOFn } = useUserRole();
  const isAdmin = isAdminFn();
  const isCEO = isCEOFn();
  const { basePath, store } = useTenant();
  const withBase = (p: string) => (basePath ? `${basePath}${p}` : p);

  const { isVIP } = useVIPSubscription();
  const isCinematic = useCinematicDesktop();
  const { reputation } = useReputation();
  const { entries: leaderboard } = useLeaderboard(10);
  const [handle, setHandle] = useState<string | null>(null);
  const visibleHandle = handle ?? profile?.handle ?? null;
  const [hasOrder, setHasOrder] = useState(false);
  const [hasIdea, setHasIdea] = useState(false);
  const [journeyHidden, setJourneyHiddenState] = useState(() => {
    try {
      return localStorage.getItem('profile:journeyHidden') === '1';
    } catch {
      return false;
    }
  });
  const setJourneyHidden = (v: boolean) => {
    try {
      localStorage.setItem('profile:journeyHidden', v ? '1' : '0');
    } catch { /* ignore */ }
    setJourneyHiddenState(v);
  };

  useEffect(() => {
    setHandle(profile?.handle ?? null);
  }, [profile?.handle]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let active = true;

    const load = async () => {
      const ordersQuery = supabase
        .from('custom_orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      const ideasQuery = supabase
        .from('video_ideas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (store?.id) {
        ordersQuery.eq('store_id', store.id);
        ideasQuery.eq('store_id', store.id);
      }

      const [orders, ideas] = await Promise.all([ordersQuery, ideasQuery]);
      if (!active) return;
      setHasOrder((orders.count ?? 0) > 0);
      setHasIdea((ideas.count ?? 0) > 0);
    };

    void load();
    return () => {
      active = false;
    };
  }, [user?.id, store?.id]);

  const quickAccessItems = [
    { icon: Package, label: t('profile.myOrders', 'My Orders'), description: t('profile.trackVideos', 'Track your videos'), path: withBase('/orders'), gradient: 'from-purple-400 to-pink-500', badge: 'orders' as const },
    { icon: Bell, label: t('profile.notifications', 'Notifications'), description: t('profile.commentsVotes', 'Comments and votes'), path: withBase('/notifications'), gradient: 'from-blue-400 to-cyan-500', badge: 'notifications' as const },
    { icon: Lightbulb, label: t('profile.videoIdeas', 'Video Ideas'), description: t('profile.suggestVote', 'Suggest and vote on ideas'), path: withBase('/ideas'), gradient: 'from-amber-400 to-orange-500' },
    { icon: Crown, label: t('profile.vipCommunity', 'VIP Community'), description: t('profile.exclusiveAccess', 'Exclusive access'), path: withBase('/vip'), gradient: 'from-vip to-amber-500' },
  ];

  const hasAvatar = !!(profile?.avatar_url || customization.avatar_url || user?.avatar);

  const steps = [
    { label: t('profile.stepAvatar', 'Add a profile photo'), done: hasAvatar, icon: Camera, path: withBase('/profile') },
    { label: t('profile.stepOrder', 'Request your first custom video'), done: hasOrder || pendingOrdersCount > 0, icon: Package, path: withBase('/customs') },
    { label: t('profile.stepIdea', 'Share a video idea'), done: hasIdea, icon: Lightbulb, path: withBase('/ideas') },
    { label: t('profile.stepVip', 'Join the VIP community'), done: isVIP, icon: Crown, path: withBase('/vip') },
  ];
  const completed = steps.filter((s) => s.done).length;

  const menuItems = [
    { icon: HelpCircle, label: t('profile.help', 'Help'), description: t('profile.faqSupport', 'FAQ and support'), path: withBase('/help') },
    { icon: FileText, label: t('profile.terms', 'Terms of Use'), description: t('profile.readTerms', 'Read our terms'), path: withBase('/terms') },
    { icon: Shield, label: t('profile.privacy', 'Privacy'), description: t('profile.privacyPolicy', 'Privacy policy'), path: withBase('/privacy') },
  ];

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
        <PremiumProfileHeader
          isVIP={isVIP}
          vipPath={withBase('/vip')}
          fallbackName={t('profile.member', 'Member')}
          handle={visibleHandle}
          fallbackAvatar={profile?.avatar_url || user?.avatar}
          reputation={reputation}
        />

        {/* Handle — can only be chosen once */}
        <HandleSelector
          currentHandle={visibleHandle}
          onHandleSet={(h) => {
            setHandle(h);
            void refetchProfile();
          }}
        />

        {/* Reputation & ranking */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  {t('profile.reputationTitle', 'Your reputation')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {reputation.icon} {reputation.title} · {t('profile.premium.level', 'Lv.')}{reputation.level}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{reputation.totalPoints}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('profile.points', 'points')}</p>
              </div>
            </div>

            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${reputation.progressPercent}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            {reputation.nextLevelPoints !== null && (
              <p className="text-[11px] text-muted-foreground">
                {t('profile.pointsToNext', '{{points}} points to the next level', {
                  points: Math.max(0, reputation.nextLevelPoints - reputation.totalPoints),
                })}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/[0.03] py-2">
                <p className="text-sm font-bold">{reputation.ideasCreated}</p>
                <p className="text-[10px] text-muted-foreground">{t('profile.statIdeas', 'ideas')}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] py-2">
                <p className="text-sm font-bold">{reputation.votesReceived}</p>
                <p className="text-[10px] text-muted-foreground">{t('profile.statVotes', 'votes')}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] py-2">
                <p className="text-sm font-bold">{reputation.commentsGiven}</p>
                <p className="text-[10px] text-muted-foreground">{t('profile.statComments', 'comments')}</p>
              </div>
            </div>

            {reputation.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {reputation.badges.map((badge) => (
                  <span key={badge.id} title={badge.description} className="px-2 py-1 rounded-lg bg-white/[0.05] text-xs">
                    {badge.icon} {badge.name}
                  </span>
                ))}
              </div>
            )}

            {leaderboard.length > 0 && (
              <div className="pt-2 border-t border-border/40 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">{t('profile.topMembers', 'Top members')}</p>
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg ${entry.userId === user?.id ? 'bg-primary/10' : ''}`}
                  >
                    <span className="w-5 text-xs text-muted-foreground">{index + 1}</span>
                    <span className="flex-1 truncate">
                      {entry.icon} {entry.displayName || (entry.handle ? `@${entry.handle}` : t('profile.member', 'Member'))}
                    </span>
                    <span className="text-xs font-semibold">{entry.totalPoints}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
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

        {/* Membership journey — conversion mechanic (dismissible) */}
        {journeyHidden || completed === steps.length ? (
          completed === steps.length ? null : (
            <button
              type="button"
              onClick={() => setJourneyHidden(false)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              {t('profile.journeyShow', 'Show your journey')}
            </button>
          )
        ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-base">{t('profile.journeyTitle', 'Your journey')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('profile.journeySubtitle', 'Complete the steps and unlock exclusive perks')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">{completed}/{steps.length}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label={t('profile.journeyHide', 'Hide journey')}
                  onClick={() => setJourneyHidden(true)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>


            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${(completed / steps.length) * 100}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>

            <div className="space-y-2">
              {steps.map((step) => (
                <Link key={step.label} to={step.path} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-muted-foreground'}`}>
                      {step.done ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                    </div>
                    <p className={`flex-1 text-sm ${step.done ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                      {step.label}
                    </p>
                    {!step.done && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>
        </motion.div>
        )}


        {/* VIP upsell */}
        {!isVIP && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <Link to={withBase('/vip')}>
              <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-primary to-primary/40">
                <div className="relative z-10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70 mb-1">
                    {t('nav.vip')}
                  </p>
                  <p className="text-sm font-semibold text-primary-foreground mb-3 max-w-[80%]">
                    {t('profile.vipUpsell', 'Unlock exclusive content and priority on your custom videos')}
                  </p>
                  <Button size="sm" variant="secondary" className="text-xs font-bold uppercase">
                    {t('profile.vipCta', 'Become VIP')}
                  </Button>
                </div>
                <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-primary-foreground/10 rounded-full blur-2xl" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Quick access (mobile only — desktop shows these in the sidebar) */}
        {!isCinematic && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
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
        )}

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

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="pt-1">
            <BugReportDialog variant="ghost" className="px-4 py-2 text-xs" />
          </motion.div>
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
