import { devLog } from '@/lib/logger';
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Crown, ShoppingCart, DollarSign, Lightbulb, TrendingUp, Clock, Activity, ExternalLink, Copy, Check, AlertTriangle, Zap, Youtube, Eye, UserPlus, Video, CircleCheck, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { loadConfig } from '@/lib/config-storage';
import { publicUrl } from '@/lib/public-url';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';


import { GlassCard } from '@/components/ui/GlassCard';
import { toast } from 'sonner';
import { TrialCountdown } from '@/components/tenant/TrialCountdown';


interface YTMetrics {
  subscriber_count: number;
  total_view_count: number;
  total_video_count: number;
  views_last_30d: number;
  videos_last_30d: number;
  top_videos: Array<{ id: string; title: string; views: number; thumbnail: string }>;
  fetched_at: string;
}

const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { config } = useWhiteLabel();
  const { session } = useAuth();
  const { store: tenantStore, isLoading: tenantLoading } = useTenant();
  const base = slug ? `/${slug}/admin` : '/admin';
  const [stats, setStats] = useState({ totalUsers: 0, totalVIP: 0, totalOrders: 0, revenue: 0, pendingOrders: 0, newUsersToday: 0 });
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storePlan, setStorePlan] = useState<{ type: string; expiresAt: string | null } | null>(null);
  const [storeInfo, setStoreInfo] = useState<{ name: string; description: string | null; avatar_url: string | null } | null>(null);
  const [ytMetrics, setYtMetrics] = useState<YTMetrics | null>(null);
  const [ytLoading, setYtLoading] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(true);
  const checklistDismissKey = 'admin_setup_checklist_dismissed';
  const [checklistDismissed, setChecklistDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem('admin_setup_checklist_dismissed') === '1'; } catch { return false; }
  });
  const [checklistCompleted, setChecklistCompleted] = useState<boolean>(false);
  const [paymentLoaded, setPaymentLoaded] = useState(false);

  const [paymentConfigured, setPaymentConfigured] = useState(false);


  const platformUrl = storeSlug ? publicUrl(`/${storeSlug}`) : publicUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(platformUrl);
    setCopied(true);
    toast.success(t('admin.linkCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  // Resolve store
  useEffect(() => {
    if (tenantStore?.id) {
      let cancelled = false;
      setStoreSlug(tenantStore.slug);
      setStoreId(tenantStore.id);
      setStorePlan({ type: tenantStore.plan_type, expiresAt: tenantStore.plan_expires_at });
      setStoreInfo({ name: tenantStore.name, description: tenantStore.description, avatar_url: tenantStore.avatar_url });

      const loadTenantPaymentConfig = async () => {
        const payConf = await loadConfig<any>('payment_config', tenantStore.id);
        if (!cancelled) {
          setPaymentConfigured(!!(payConf?.stripe?.secretKey || payConf?.pixManual?.key));
          setPaymentLoaded(true);
        }
      };


      loadTenantPaymentConfig();
      return () => { cancelled = true; };
    }

    if (tenantLoading) return;

    const userId = session?.user?.id;
    if (!userId) { setStoreSlug(null); setStoreId(null); return; }
    let cancelled = false;

    const resolve = async () => {
      const { data: adminStore } = await supabase.from('store_admins').select('store_id').eq('user_id', userId).limit(1).maybeSingle();
      let sid = adminStore?.store_id ?? null;
      if (!sid) {
        const { data: owned } = await supabase.from('stores').select('id').eq('created_by', userId).limit(1).maybeSingle();
        sid = owned?.id ?? null;
      }
      // No insecure fallback to "first active store" — user must own/admin a store
      if (!sid) { if (!cancelled) setStoreSlug(null); return; }
      const { data: store } = await supabase.from('stores').select('slug, plan_type, plan_expires_at, name, description, avatar_url').eq('id', sid).maybeSingle();
      if (!cancelled) {
        setStoreSlug(store?.slug ?? null);
        setStoreId(sid);
        if (store) {
          setStorePlan({ type: store.plan_type, expiresAt: store.plan_expires_at });
          setStoreInfo({ name: store.name, description: store.description, avatar_url: store.avatar_url });
        }
        // Load payment config for checklist
        const payConf = await loadConfig<any>('payment_config', sid);
        if (!cancelled) {
          if (payConf) {
            const hasPayment = !!(payConf.stripe?.secretKey) || !!(payConf.pixManual?.key);
            setPaymentConfigured(hasPayment);
          }
          setPaymentLoaded(true);
        }
      }

    };
    resolve();
    return () => { cancelled = true; };
  }, [session?.user?.id, tenantLoading, tenantStore?.id, tenantStore?.slug, tenantStore?.plan_type, tenantStore?.plan_expires_at, tenantStore?.name, tenantStore?.description, tenantStore?.avatar_url]);

  // Once the checklist has been fully completed for this store, never show it again
  const checklistDoneKey = storeId ? `admin_setup_checklist_done:${storeId}` : null;
  useEffect(() => {
    if (!checklistDoneKey) return;
    try { setChecklistCompleted(localStorage.getItem(checklistDoneKey) === '1'); } catch { setChecklistCompleted(false); }
  }, [checklistDoneKey]);


  const [ytHistory, setYtHistory] = useState<Array<{ recorded_at: string; subscriber_count: number; views_last_30d: number; total_view_count: number }>>([]);

  // Fetch YouTube metrics from DB, trigger edge function if no data exists
  useEffect(() => {
    const channelId = config.youtube?.channelId?.trim();
    if (!channelId || !storeId) return;

    const fetchMetrics = async () => {
      setYtLoading(true);
      try {
        // Read current metrics from DB
        const { data: cached } = await supabase
          .from('youtube_channel_metrics')
          .select('*')
          .eq('store_id', storeId)
          .eq('channel_id', channelId)
          .maybeSingle();

        if (cached) {
          setYtMetrics({
            subscriber_count: cached.subscriber_count,
            total_view_count: cached.total_view_count,
            total_video_count: cached.total_video_count,
            views_last_30d: cached.views_last_30d,
            videos_last_30d: cached.videos_last_30d,
            top_videos: (cached.top_videos as any) || [],
            fetched_at: cached.fetched_at,
          });
        } else {
          // No metrics in DB yet — trigger one-time fetch via edge function
          devLog('[AdminDashboard] No YT metrics cached, triggering initial fetch...');
          const { data: fetchResult } = await supabase.functions.invoke('youtube-channel-metrics', {
            body: { channelId, storeId },
          });
          if (fetchResult?.metrics) {
            setYtMetrics({
              subscriber_count: fetchResult.metrics.subscriber_count,
              total_view_count: fetchResult.metrics.total_view_count,
              total_video_count: fetchResult.metrics.total_video_count,
              views_last_30d: fetchResult.metrics.views_last_30d || 0,
              videos_last_30d: fetchResult.metrics.videos_last_30d || 0,
              top_videos: fetchResult.metrics.top_videos || [],
              fetched_at: fetchResult.metrics.fetched_at || new Date().toISOString(),
            });
          }
        }

        // Read history for chart
        const { data: history } = await supabase
          .from('youtube_metrics_history')
          .select('recorded_at, subscriber_count, views_last_30d, total_view_count, total_video_count')
          .eq('store_id', storeId)
          .eq('channel_id', channelId)
          .order('recorded_at', { ascending: true });

        if (history?.length) {
          setYtHistory(history);
        }
      } catch (err) {
        console.error('Failed to fetch YT metrics:', err);
      } finally {
        setYtLoading(false);
      }
    };
    fetchMetrics();
  }, [config.youtube?.channelId, storeId]);

  const chartColor = useMemo(() => {
    const parts = config.colors.primary.split(/\s+/);
    if (parts.length === 3) return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
    return 'hsl(263, 70%, 58%)';
  }, [config.colors.primary]);

  const chartColorLight = useMemo(() => {
    const parts = config.colors.primary.split(/\s+/);
    if (parts.length === 3) return `hsl(${parts[0]}, ${parts[1]}, 70%)`;
    return 'hsl(263, 70%, 70%)';
  }, [config.colors.primary]);

  const [weekData, setWeekData] = useState<Array<{ name: string; orders: number; revenue: number }>>([]);

  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  // Build the last 7 days (oldest → today) with zeroed buckets
  const buildEmptyWeek = () => {
    const days: Array<{ key: string; date: Date; orders: number; revenue: number }> = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({ key: d.toISOString().slice(0, 10), date: d, orders: 0, revenue: 0 });
    }
    return days;
  };

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      if (!storeId) {
        setStats({ totalUsers: 0, totalVIP: 0, totalOrders: 0, revenue: 0, pendingOrders: 0, newUsersToday: 0 });
        setPendingOrders([]);
        setWeekData(buildEmptyWeek().map(b => ({
          name: t(`admin.days.${dayKeys[b.date.getDay()]}`),
          orders: 0,
          revenue: 0,
        })));
        setIsLoading(false);
        return;
      }

      try {
        const weekBuckets = buildEmptyWeek();
        const weekStart = weekBuckets[0]?.date.toISOString();

        const usersQuery = supabase.from('store_users').select('*', { count: 'exact', head: true }).eq('store_id', storeId);
        const vipQuery = supabase.from('vip_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('store_id', storeId);
        const ordersQuery = supabase.from('custom_orders').select('id, status, amount_cents, created_at', { count: 'exact' }).eq('store_id', storeId);
        const weeklyOrdersQuery = supabase.from('custom_orders').select('id, status, amount_cents, created_at').eq('store_id', storeId).gte('created_at', weekStart);
        const pendingQuery = supabase.from('custom_orders').select('id, customer_name, category_name, amount_cents').eq('status', 'pending').eq('store_id', storeId).order('created_at', { ascending: false }).limit(5);

        const [{ count: usersCount }, { count: vipCount }, { data: ordersData, count: ordersCount }, { data: weeklyOrdersData }, { data: pendingData, count: pendingCount }] = await Promise.all([
          usersQuery, vipQuery, ordersQuery, weeklyOrdersQuery, pendingQuery,
        ]);
        const paidOrders = ordersData?.filter(o => o.status === 'paid' || o.status === 'completed') || [];
        const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0) / 100;
        setStats({ totalUsers: usersCount || 0, totalVIP: vipCount || 0, totalOrders: ordersCount || 0, revenue: totalRevenue, pendingOrders: pendingCount || 0, newUsersToday: 0 });
        setPendingOrders(pendingData || []);

        // Weekly activity — real data from the last 7 days of orders
        const buckets = weekBuckets;
        (weeklyOrdersData || []).forEach((o: any) => {
          if (!o.created_at) return;
          const key = new Date(o.created_at).toISOString().slice(0, 10);
          const bucket = buckets.find(b => b.key === key);
          if (!bucket) return;
          bucket.orders += 1;
          if (o.status === 'paid' || o.status === 'completed') {
            bucket.revenue += (o.amount_cents || 0) / 100;
          }
        });
        setWeekData(buckets.map(b => ({
          name: t(`admin.days.${dayKeys[b.date.getDay()]}`),
          orders: b.orders,
          revenue: b.revenue,
        })));
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [storeId, i18n.language]);

  const chartData = weekData.length ? weekData : buildEmptyWeek().map(b => ({
    name: t(`admin.days.${dayKeys[b.date.getDay()]}`),
    orders: 0,
    revenue: 0,
  }));


  const MetricCard = ({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: any }) => (
    <div className="bg-foreground/[0.03] border border-primary/10 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-foreground/40 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{isLoading ? '—' : value}</p>
          {sub && <p className="text-[11px] text-primary mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/20">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );

  const isLight = config.colors.mode === 'light';
  const chartTooltipStyle = {
    contentStyle: { background: isLight ? '#ffffff' : '#0a0a0a', border: `1px solid ${chartColor}33`, borderRadius: 8, fontSize: 12, color: isLight ? '#111' : '#fff' },
    itemStyle: { color: chartColorLight },
  };

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <AdminLayout title={t('admin.dashboard')}>
      <div className="space-y-6">
        {/* Trial banner */}
        {storePlan?.type === 'trial' && storePlan.expiresAt && (
          <TrialCountdown expiresAt={storePlan.expiresAt} basePath={base} storeId={storeId} />
        )}


        {/* Platform quick actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/10 text-foreground" onClick={() => window.open(platformUrl, '_blank')}>
            <ExternalLink className="w-4 h-4" />{t('admin.viewPlatform')}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/10 text-foreground" onClick={handleCopyLink}>
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? t('admin.linkCopied') : t('admin.copyLink')}
          </Button>
        </div>

        {/* Setup Checklist */}
        {(() => {
          const defaultNames = ['WhisperScape', 'TingleBox', 'My Tingle Box'];
          const checks = [
            { key: 'storeName', done: !!storeInfo?.name && !defaultNames.includes(storeInfo.name), label: t('admin.checklist.storeName'), path: `${base}/customize` },
            { key: 'colors', done: !!config.setup?.colorsConfirmed || config.colors.primary !== '263 70% 58%' || config.colors.mode !== 'dark', label: t('admin.checklist.colors'), path: `${base}/customize` },
            { key: 'icon', done: !!storeInfo?.avatar_url || !!config.icons?.logoIcon?.value, label: t('admin.checklist.icon', 'Defina o ícone da plataforma'), path: `${base}/customize` },
            { key: 'banners', done: (config.banners?.filter(b => b.enabled && (b.desktopUrl || b.mobileUrl)).length || 0) > 0, label: t('admin.checklist.banners'), path: `${base}/customize` },
            { key: 'payments', done: paymentConfigured, label: t('admin.checklist.payments'), path: `${base}/payments` },
            { key: 'youtube', done: !!config.youtube?.channelId?.trim(), label: t('admin.checklist.youtube', 'Conecte seu canal do YouTube'), path: `${base}/youtube` },
          ];
          const doneCount = checks.filter(c => c.done).length;
          const allDone = doneCount === checks.length;
          const pct = Math.round((doneCount / checks.length) * 100);
          const nextStep = checks.find(c => !c.done);
          if (allDone && checklistDismissed) return null;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <button onClick={() => setChecklistOpen(o => !o)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${allDone ? 'bg-emerald-500/15' : 'bg-primary/20'}`}>
                      <CircleCheck className={`w-4 h-4 ${allDone ? 'text-emerald-400' : 'text-primary'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {allDone ? t('admin.checklist.allDoneTitle', 'Plataforma configurada!') : t('admin.checklist.title')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {allDone
                          ? t('admin.checklist.allDoneDesc', 'Todos os passos essenciais estão concluídos.')
                          : `${doneCount}/${checks.length} ${t('admin.checklist.completed')}${nextStep ? ` • ${t('admin.checklist.next', 'Próximo')}: ${nextStep.label}` : ''}`}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:block w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div className={`h-full rounded-full ${allDone ? 'bg-emerald-500' : 'bg-primary'}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
                    {allDone ? (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setChecklistDismissed(true); try { localStorage.setItem(checklistDismissKey, '1'); } catch {} }}>
                        {t('admin.checklist.dismiss', 'Ocultar')}
                      </Button>
                    ) : (
                      <button onClick={() => setChecklistOpen(o => !o)} aria-label="toggle">
                        {checklistOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    )}
                  </div>
                </div>
                {checklistOpen && !allDone && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 space-y-1.5">
                    {checks.map(c => (
                      <Link key={c.key} to={c.path} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${c.done ? 'opacity-60' : 'hover:bg-primary/5'}`}>
                        {c.done ? <CircleCheck className="w-4 h-4 text-primary shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                        <span className={`text-sm ${c.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{c.label}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </GlassCard>
            </motion.div>
          );
        })()}


        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label={t('admin.totalUsers')} value={stats.totalUsers.toLocaleString()} icon={Users} />
          <MetricCard label={t('admin.vipMembers')} value={stats.totalVIP} icon={Crown} />
          <MetricCard label={t('admin.orders')} value={stats.totalOrders} sub={`${stats.pendingOrders} ${t('admin.pending').toLowerCase()}`} icon={ShoppingCart} />
          <MetricCard label={t('admin.revenue')} value={new Intl.NumberFormat(i18n.language?.startsWith('pt') ? 'pt-BR' : 'en-US', { style: 'currency', currency: i18n.language?.startsWith('pt') ? 'BRL' : 'USD' }).format(stats.revenue)} icon={DollarSign} />
        </div>

        {/* YouTube Metrics */}
        {config.youtube?.channelId && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-5">
              <div className="flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-sm text-foreground">YouTube</h3>
                  {config.youtube?.channelHandle && (
                    <span className="text-xs text-muted-foreground">@{config.youtube.channelHandle.replace(/^@/, '')}</span>
                  )}
                </div>

              {ytLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  {t('common.loading')}
                </div>
              ) : ytMetrics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-foreground/[0.03] border border-primary/10 rounded-lg p-3 text-center">
                      <UserPlus className="w-4 h-4 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold text-foreground">{formatNumber(ytMetrics.subscriber_count)}</p>
                      <p className="text-[10px] text-foreground/40">{t('admin.ytSubs', 'Subscribers')}</p>
                    </div>
                    <div className="bg-foreground/[0.03] border border-primary/10 rounded-lg p-3 text-center">
                      <Video className="w-4 h-4 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold text-foreground">{formatNumber(ytMetrics.total_video_count)}</p>
                      <p className="text-[10px] text-foreground/40">{t('admin.ytTotalVideos', 'Total Videos')}</p>
                    </div>
                    <div className="bg-foreground/[0.03] border border-primary/10 rounded-lg p-3 text-center">
                      <Eye className="w-4 h-4 mx-auto text-primary mb-1" />
                      <p className="text-lg font-bold text-foreground">{formatNumber(ytMetrics.total_view_count)}</p>
                      <p className="text-[10px] text-foreground/40">{t('admin.ytTotalViews', 'Total Views')}</p>
                    </div>
                  </div>

                  {/* Top videos */}
                  {ytMetrics.top_videos?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground/60 mb-2">{t('admin.ytTopVideos')}</p>
                      <div className="space-y-1.5">
                        {ytMetrics.top_videos.map((video, i) => (
                          <div key={video.id} className="flex items-center gap-3 p-2 rounded-lg bg-foreground/[0.02] border border-border/50">
                            <span className="text-xs font-bold text-primary w-5 text-center">{i + 1}</span>
                            {video.thumbnail && (
                              <img src={video.thumbnail} alt="" className="w-12 h-7 rounded object-cover shrink-0" />
                            )}
                            <p className="text-xs text-foreground/80 flex-1 truncate">{video.title}</p>
                            <span className="text-xs font-medium text-foreground/60 shrink-0">{formatNumber(video.views)} views</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('admin.ytNoData')}</p>
              )}
            </GlassCard>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-foreground/[0.03] border border-primary/10 rounded-xl p-5">
            <h3 className="text-sm font-medium text-foreground/70 mb-4">{t('admin.weeklyActivity')}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="adminThemeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'} />
                <XAxis dataKey="name" tick={{ fill: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke={chartColor} fill="url(#adminThemeGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="orders" stroke={chartColorLight} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-foreground/[0.03] border border-primary/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />{t('admin.pending')}
              </h3>
              <Link to={`${base}/orders`} className="text-[11px] text-primary hover:text-primary/80">{t('admin.viewAll')} →</Link>
            </div>
            {isLoading ? (
              <p className="text-foreground/30 text-sm">{t('common.loading')}</p>
            ) : pendingOrders.length === 0 ? (
              <p className="text-foreground/30 text-sm">{t('common.none')}</p>
            ) : (
              <div className="space-y-2">
                {pendingOrders.map((order) => (
                  <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-foreground/[0.02] border border-border/50">
                    <div>
                      <p className="font-medium text-xs text-foreground/80">{order.category_name || 'Custom'}</p>
                      <p className="text-[10px] text-foreground/30">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-xs text-foreground/80">{new Intl.NumberFormat(i18n.language?.startsWith('pt') ? 'pt-BR' : 'en-US', { style: 'currency', currency: i18n.language?.startsWith('pt') ? 'BRL' : 'USD' }).format(order.amount_cents / 100)}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{t('admin.pending')}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-foreground/[0.03] border border-primary/10 rounded-xl p-4 text-center">
            <Lightbulb className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-xl font-bold text-foreground">—</p>
            <p className="text-[11px] text-foreground/40">{t('admin.ideasLabel')}</p>
          </div>
          <div className="bg-foreground/[0.03] border border-primary/10 rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-xl font-bold text-foreground">{isLoading ? '—' : stats.pendingOrders}</p>
            <p className="text-[11px] text-foreground/40">{t('admin.pending')}</p>
          </div>
          <div className="bg-foreground/[0.03] border border-primary/10 rounded-xl p-4 text-center">
            <Activity className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-xl font-bold text-foreground">{isLoading ? '—' : stats.newUsersToday}</p>
            <p className="text-[11px] text-foreground/40">{t('admin.newToday')}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
