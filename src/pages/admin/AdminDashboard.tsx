import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Crown, ShoppingCart, DollarSign, Lightbulb, TrendingUp, Clock, Activity, ExternalLink, Copy, Check, AlertTriangle, Zap } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { differenceInDays, parseISO } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { config } = useWhiteLabel();
  const { session } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, totalVIP: 0, totalOrders: 0, revenue: 0, pendingOrders: 0, newUsersToday: 0 });
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [storePlan, setStorePlan] = useState<{ type: string; expiresAt: string | null } | null>(null);

  // Use published domain; fall back to current origin for local/preview
  const getPublishedOrigin = () => {
    const host = window.location.hostname;
    // If on lovableproject.com (preview), use the published lovable.app domain
    if (host.includes('lovableproject.com')) {
      return 'https://cozy-corner-seed.lovable.app';
    }
    // If on lovable.app or custom domain, use current origin
    return window.location.origin;
  };
  const platformUrl = storeSlug ? `${getPublishedOrigin()}/${storeSlug}` : getPublishedOrigin();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(platformUrl);
    setCopied(true);
    toast.success(t('admin.linkCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setStoreSlug(null);
      return;
    }

    let cancelled = false;

    const resolveStoreSlug = async () => {
      const { data: adminStore } = await supabase
        .from('store_admins')
        .select('store_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      let storeId = adminStore?.store_id ?? null;

      if (!storeId) {
        const { data: ownedStore } = await supabase
          .from('stores')
          .select('id')
          .eq('created_by', userId)
          .limit(1)
          .maybeSingle();

        storeId = ownedStore?.id ?? null;
      }

      if (!storeId) {
        if (!cancelled) setStoreSlug(null);
        return;
      }

      const { data: storeData } = await supabase
        .from('stores')
        .select('slug, plan_type, plan_expires_at')
        .eq('id', storeId)
        .maybeSingle();

      if (!cancelled) {
        setStoreSlug(storeData?.slug ?? null);
        if (storeData) {
          setStorePlan({ type: storeData.plan_type, expiresAt: storeData.plan_expires_at });
        }
      }
    };

    resolveStoreSlug();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // Derive chart color from the current primary HSL
  const chartColor = useMemo(() => {
    const parts = config.colors.primary.split(/\s+/);
    if (parts.length === 3) {
      const h = parts[0];
      const s = parts[1];
      const l = parts[2];
      return `hsl(${h}, ${s}, ${l})`;
    }
    return 'hsl(263, 70%, 58%)';
  }, [config.colors.primary]);

  const chartColorLight = useMemo(() => {
    const parts = config.colors.primary.split(/\s+/);
    if (parts.length === 3) {
      const h = parts[0];
      const s = parts[1];
      return `hsl(${h}, ${s}, 70%)`;
    }
    return 'hsl(263, 70%, 70%)';
  }, [config.colors.primary]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: profilesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: vipCount } = await supabase.from('vip_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
        const { data: ordersData, count: ordersCount } = await supabase.from('custom_orders').select('*', { count: 'exact' });
        const paidOrders = ordersData?.filter(o => o.status === 'paid' || o.status === 'completed') || [];
        const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0) / 100;
        const { data: pendingData, count: pendingCount } = await supabase
          .from('custom_orders').select('id, customer_name, category_name, amount_cents')
          .eq('status', 'pending').order('created_at', { ascending: false }).limit(5);
        setStats({ totalUsers: profilesCount || 0, totalVIP: vipCount || 0, totalOrders: ordersCount || 0, revenue: totalRevenue, pendingOrders: pendingCount || 0, newUsersToday: 0 });
        setPendingOrders(pendingData || []);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Mon', pedidos: 2, receita: 45 },
    { name: 'Tue', pedidos: 5, receita: 120 },
    { name: 'Wed', pedidos: 3, receita: 80 },
    { name: 'Thu', pedidos: 7, receita: 200 },
    { name: 'Fri', pedidos: 4, receita: 150 },
    { name: 'Sat', pedidos: 8, receita: 280 },
    { name: 'Sun', pedidos: 6, receita: 190 },
  ];

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

  return (
    <AdminLayout title={t('admin.dashboard')}>
      <div className="space-y-6">
        {/* Trial banner */}
        {storePlan?.type === 'trial' && storePlan.expiresAt && (() => {
          const daysLeft = differenceInDays(parseISO(storePlan.expiresAt), new Date());
          const isUrgent = daysLeft <= 2;
          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${
                isUrgent
                  ? 'bg-destructive/10 border-destructive/30'
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {isUrgent ? (
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                ) : (
                  <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
                )}
                <div>
                  <p className={`font-semibold text-sm ${isUrgent ? 'text-destructive' : 'text-yellow-500'}`}>
                    {daysLeft <= 0
                      ? t('admin.trial.expired', 'Seu trial expirou!')
                      : t('admin.trial.daysLeft', '{{days}} dias restantes de trial', { days: Math.max(0, daysLeft) })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.trial.upgradeHint', 'Faça upgrade para manter sua plataforma ativa.')}
                  </p>
                </div>
              </div>
              <Link to="/admin/planos">
                <Button size="sm" className="bg-primary hover:bg-primary/90 shrink-0">
                  {t('admin.trial.upgrade', 'Ver Planos')}
                </Button>
              </Link>
            </motion.div>
          );
        })()}

        {/* Platform quick actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-primary/20 hover:bg-primary/10 text-foreground"
            onClick={() => window.open(platformUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            {t('admin.viewPlatform')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-primary/20 hover:bg-primary/10 text-foreground"
            onClick={handleCopyLink}
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? t('admin.linkCopied') : t('admin.copyLink')}
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label={t('admin.totalUsers')} value={stats.totalUsers.toLocaleString()} icon={Users} />
          <MetricCard label={t('admin.vipMembers')} value={stats.totalVIP} icon={Crown} />
          <MetricCard label={t('admin.orders')} value={stats.totalOrders} sub={`${stats.pendingOrders} ${t('admin.pending').toLowerCase()}`} icon={ShoppingCart} />
          <MetricCard label={t('admin.revenue')} value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} />
        </div>

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
                <Area type="monotone" dataKey="receita" stroke={chartColor} fill="url(#adminThemeGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="pedidos" stroke={chartColorLight} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-foreground/[0.03] border border-primary/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {t('admin.pending')}
              </h3>
              <Link to="/admin/pedidos" className="text-[11px] text-primary hover:text-primary/80">
                {t('admin.viewAll')} →
              </Link>
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
                      <p className="font-medium text-xs text-foreground/80">R$ {(order.amount_cents / 100).toFixed(2)}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {t('admin.pending')}
                      </span>
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
