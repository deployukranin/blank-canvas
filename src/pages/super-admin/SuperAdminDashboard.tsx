import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Store, Users, DollarSign, TrendingUp, Activity, ShoppingBag,
  Crown, MessageSquare, LifeBuoy, Percent, BarChart3,
  Eye, Receipt, UserPlus, Gauge, Sparkles,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import SuperAdminLayout from './SuperAdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';

const PURPLE = '#8b5cf6';
const CYAN = '#06b6d4';
const AMBER = '#f59e0b';
const GREEN = '#10b981';

interface GlobalMetrics {
  total_stores: number;
  active_stores: number;
  suspended_stores: number;
  trial_stores: number;
  paid_stores: number;
  total_users: number;
  total_store_users: number;
  total_orders: number;
  paid_orders: number;
  total_revenue: number;
  active_vip_subs: number;
  total_vip_subs: number;
  vip_mrr: number;
  open_tickets: number;
  total_tickets: number;
  total_content: number;
  total_ideas: number;
  total_chat_messages: number;
  conversion_rate: number;
}

interface StoreMetrics {
  store_id: string;
  name: string;
  slug: string | null;
  status: string;
  plan_type: string;
  plan_expires_at: string | null;
  created_at: string;
  users_count: number;
  orders_total: number;
  orders_paid: number;
  revenue: number;
  vip_active: number;
  vip_total: number;
  vip_revenue: number;
  content_count: number;
  ideas_count: number;
  ideas_votes: number;
  chat_messages: number;
  tickets_open: number;
  tickets_total: number;
  invites_active: number;
  invites_used: number;
  recent_orders_30d: number;
  recent_users_30d: number;
  recent_messages_30d: number;
}

interface MonthlyGrowth {
  month: string;
  stores: number;
  users: number;
  new_stores: number;
  new_users: number;
  revenue: number;
}

const brl = (v: number) =>
  `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Minimal surface card */
const Panel: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm ${className}`}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-3">{children}</p>
);

const SuperAdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [global, setGlobal] = useState<GlobalMetrics | null>(null);
  const [perStore, setPerStore] = useState<StoreMetrics[]>([]);
  const [monthlyGrowth, setMonthlyGrowth] = useState<MonthlyGrowth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-metrics');
      if (error) throw error;
      setGlobal(data.global);
      setPerStore(data.per_store || []);
      setMonthlyGrowth(data.monthly_growth || []);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const g = global;

  const planData = useMemo(() => [
    { name: 'Trial', value: g?.trial_stores || 0, color: AMBER },
    { name: 'Pago', value: g?.paid_stores || 0, color: GREEN },
    { name: 'Suspenso', value: g?.suspended_stores || 0, color: '#374151' },
  ], [g]);

  const topStores = useMemo(() =>
    [...perStore].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    [perStore]);

  const mostActiveStores = useMemo(() =>
    [...perStore].sort((a, b) => (b.recent_messages_30d + b.recent_orders_30d) - (a.recent_messages_30d + a.recent_orders_30d)).slice(0, 5),
    [perStore]);

  /** Derived, purely presentational KPIs */
  const derived = useMemo(() => {
    const avgTicket = g && g.paid_orders > 0 ? g.total_revenue / g.paid_orders : 0;
    const arpa = g && g.active_stores > 0 ? g.total_revenue / g.active_stores : 0;
    const newUsers30d = perStore.reduce((acc, s) => acc + (s.recent_users_30d || 0), 0);
    const newOrders30d = perStore.reduce((acc, s) => acc + (s.recent_orders_30d || 0), 0);
    const activeRate = g && g.total_stores > 0 ? Math.round((g.active_stores / g.total_stores) * 100) : 0;
    const payingRate = g && g.total_orders > 0 ? Math.round((g.paid_orders / g.total_orders) * 100) : 0;
    const ticketHealth = g && g.total_tickets > 0
      ? Math.round(((g.total_tickets - g.open_tickets) / g.total_tickets) * 100)
      : 100;
    const health = Math.round((activeRate * 0.4) + ((g?.conversion_rate || 0) * 0.3) + (ticketHealth * 0.3));
    return { avgTicket, arpa, newUsers30d, newOrders30d, activeRate, payingRate, ticketHealth, health };
  }, [g, perStore]);

  const chartTooltipStyle = {
    contentStyle: { background: '#0a0a0a', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, fontSize: 12, color: '#fff' },
    itemStyle: { color: '#a78bfa' },
  };

  const MetricCard = ({ label, value, sub, icon: Icon, accent = 'purple', index = 0 }: {
    label: string; value: string | number; sub?: string; icon: any; accent?: string; index?: number;
  }) => {
    const accentMap: Record<string, string> = {
      purple: 'text-purple-300',
      cyan: 'text-cyan-300',
      amber: 'text-amber-300',
      green: 'text-emerald-300',
      rose: 'text-rose-300',
    };
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3), ease: 'easeOut' }}
        className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.12] hover:bg-white/[0.035]"
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/35 truncate">{label}</p>
          <Icon className={`w-3.5 h-3.5 shrink-0 ${accentMap[accent] || accentMap.purple} opacity-50 group-hover:opacity-100 transition-opacity`} />
        </div>
        <p className="mt-3 text-[26px] leading-none font-semibold tracking-tight text-white tabular-nums truncate">
          {isLoading ? <span className="text-white/20">—</span> : value}
        </p>
        {sub && <p className="mt-2 text-[11px] text-white/35 truncate">{sub}</p>}
      </motion.div>
    );
  };

  return (
    <SuperAdminLayout title={t('superAdmin.dashboard')}>
      <div className="space-y-8">
        {/* Hero summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Panel className="relative overflow-hidden p-6 sm:p-7">
            <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-purple-600/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-purple-300/70">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('superAdmin.metrics.overview', 'Visão geral')}
                </div>
                <p className="mt-3 text-3xl sm:text-[40px] leading-none font-semibold tracking-tight text-white tabular-nums">
                  {isLoading ? '—' : brl(g?.total_revenue || 0)}
                </p>
                <p className="mt-2 text-sm text-white/40">
                  {g?.total_stores || 0} {t('superAdmin.metrics.platforms')} · {g?.total_users || 0} {t('superAdmin.metrics.totalUsers').toLowerCase()}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6 shrink-0">
                {[
                  { k: t('superAdmin.activePlatforms'), v: `${derived.activeRate}%` },
                  { k: t('superAdmin.metrics.trialToPaid'), v: `${g?.conversion_rate || 0}%` },
                  { k: t('superAdmin.metrics.health', 'Saúde'), v: `${isLoading ? 0 : derived.health}` },
                ].map(item => (
                  <div key={item.k} className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/30 truncate">{item.k}</p>
                    <p className="mt-1.5 text-xl font-semibold text-white tabular-nums">{item.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </motion.div>

        {/* KPIs */}
        <section>
          <SectionTitle>{t('superAdmin.metrics.overview', 'Visão geral')}</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard index={0} label={t('superAdmin.metrics.platforms')} value={g?.total_stores || 0} sub={`${g?.active_stores || 0} ${t('superAdmin.activePlatforms')}`} icon={Store} />
            <MetricCard index={1} label={t('superAdmin.metrics.totalUsers')} value={g?.total_users || 0} sub={`${g?.total_store_users || 0} ${t('superAdmin.metrics.linkedToStores')}`} icon={Users} accent="cyan" />
            <MetricCard index={2} label={t('superAdmin.metrics.totalRevenue')} value={brl(g?.total_revenue || 0)} sub={`${g?.paid_orders || 0} ${t('superAdmin.metrics.paidOrders')}`} icon={DollarSign} accent="green" />
            <MetricCard index={3} label={t('superAdmin.metrics.trialToPaid')} value={`${g?.conversion_rate || 0}%`} sub={`${g?.trial_stores || 0} trial · ${g?.paid_stores || 0} ${t('superAdmin.paid')}`} icon={Percent} accent="amber" />
          </div>
        </section>

        {/* New derived cards */}
        <section>
          <SectionTitle>{t('superAdmin.metrics.performance', 'Performance')}</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard index={0} label={t('superAdmin.metrics.avgTicket', 'Ticket médio')} value={brl(derived.avgTicket)} sub={`${derived.payingRate}% ${t('superAdmin.paid').toLowerCase()}`} icon={Receipt} accent="green" />
            <MetricCard index={1} label={t('superAdmin.metrics.arpa', 'Receita por plataforma')} value={brl(derived.arpa)} sub={`${g?.active_stores || 0} ${t('superAdmin.activePlatforms').toLowerCase()}`} icon={Gauge} accent="purple" />
            <MetricCard index={2} label={t('superAdmin.metrics.newUsers30d', 'Novos usuários 30d')} value={derived.newUsers30d} sub={`${derived.newOrders30d} ${t('superAdmin.metrics.orders').toLowerCase()} 30d`} icon={UserPlus} accent="cyan" />
            <MetricCard index={3} label="MRR VIP" value={brl(g?.vip_mrr || 0)} sub={`${g?.active_vip_subs || 0} ${t('superAdmin.metrics.activeVIP').toLowerCase()}`} icon={Crown} accent="amber" />
          </div>
        </section>

        {/* Operation */}
        <section>
          <SectionTitle>{t('superAdmin.metrics.operation', 'Operação')}</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard index={0} label={t('superAdmin.metrics.orders')} value={g?.total_orders || 0} sub={`${g?.paid_orders || 0} ${t('superAdmin.paid')}`} icon={ShoppingBag} accent="cyan" />
            <MetricCard index={1} label={t('superAdmin.metrics.openTickets')} value={g?.open_tickets || 0} sub={`${derived.ticketHealth}% ${t('superAdmin.metrics.resolved', 'resolvidos')}`} icon={LifeBuoy} accent="rose" />
            <MetricCard index={2} label={t('superAdmin.metrics.vipContent')} value={g?.total_content || 0} icon={Eye} accent="purple" />
            <MetricCard index={3} label={t('superAdmin.metrics.engagement')} value={g?.total_chat_messages || 0} sub={`${g?.total_ideas || 0} ${t('superAdmin.metrics.videoIdeas')}`} icon={MessageSquare} accent="green" />
          </div>
        </section>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Panel className="lg:col-span-2 p-5">
            <Tabs defaultValue="growth">
              <div className="flex items-center justify-between mb-5 gap-3">
                <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30">{t('superAdmin.metrics.evolution')}</h3>
                <TabsList className="bg-white/[0.04] h-7 rounded-full p-0.5">
                  <TabsTrigger value="growth" className="text-[11px] h-6 px-3 rounded-full">{t('superAdmin.metrics.growthTab')}</TabsTrigger>
                  <TabsTrigger value="revenue" className="text-[11px] h-6 px-3 rounded-full">{t('superAdmin.metrics.revenueTab')}</TabsTrigger>
                  <TabsTrigger value="new" className="text-[11px] h-6 px-3 rounded-full">{t('superAdmin.metrics.newTab')}</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="growth" className="mt-0">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyGrowth}>
                    <defs>
                      <linearGradient id="gPurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PURPLE} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CYAN} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip {...chartTooltipStyle} />
                    <Area type="monotone" dataKey="stores" name={t('superAdmin.metrics.chartPlatforms')} stroke={PURPLE} fill="url(#gPurple)" strokeWidth={2} />
                    <Area type="monotone" dataKey="users" name={t('superAdmin.metrics.chartUsers')} stroke={CYAN} fill="url(#gCyan)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="revenue" className="mt-0">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip {...chartTooltipStyle} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    <Bar dataKey="revenue" name={t('superAdmin.metrics.chartRevenue')} fill={GREEN} radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="new" className="mt-0">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip {...chartTooltipStyle} />
                    <Bar dataKey="new_stores" name={t('superAdmin.metrics.chartNewStores')} fill={PURPLE} radius={[6, 6, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="new_users" name={t('superAdmin.metrics.chartNewUsers')} fill={CYAN} radius={[6, 6, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </Panel>

          <Panel className="p-5">
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-4">{t('superAdmin.metrics.planDistribution')}</h3>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={44} outerRadius={62} dataKey="value" strokeWidth={0} paddingAngle={2}>
                  {planData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-2">
              {planData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-white/40">{d.name}</span>
                  </div>
                  <span className="text-white/80 tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">{t('superAdmin.metrics.conversionFunnel')}</p>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-white/40">{t('superAdmin.metrics.signupToTrial')}</span>
                  <span className="text-white/60 tabular-nums">100%</span>
                </div>
                <Progress value={100} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-white/40">{t('superAdmin.metrics.trialToPaidFunnel')}</span>
                  <span className="text-white/60 tabular-nums">{g?.conversion_rate || 0}%</span>
                </div>
                <Progress value={g?.conversion_rate || 0} className="h-1" />
              </div>
            </div>
          </Panel>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Panel className="p-5">
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300/70" />
              {t('superAdmin.metrics.topRevenue')}
            </h3>
            {topStores.length === 0 ? (
              <p className="text-white/25 text-sm">{t('common.noData')}</p>
            ) : (
              <div className="space-y-3.5">
                {topStores.map((s, i) => {
                  const maxRevenue = topStores[0]?.revenue || 1;
                  return (
                    <div key={s.store_id} className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-white/25 w-4 text-center tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-white/75 truncate">{s.name}</span>
                          <span className="text-sm font-medium text-emerald-300 shrink-0 ml-2 tabular-nums">{brl(s.revenue)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={(s.revenue / maxRevenue) * 100} className="h-0.5 flex-1" />
                          <span className="text-[10px] text-white/30 shrink-0 tabular-nums">
                            {s.users_count} · {s.orders_paid} · {s.vip_active}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel className="p-5">
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-300/70" />
              {t('superAdmin.metrics.mostActive30d')}
            </h3>
            {mostActiveStores.length === 0 ? (
              <p className="text-white/25 text-sm">{t('common.noData')}</p>
            ) : (
              <div className="space-y-3.5">
                {mostActiveStores.map((s, i) => {
                  const engagement = s.recent_messages_30d + s.recent_orders_30d;
                  const maxEng = (mostActiveStores[0]?.recent_messages_30d || 0) + (mostActiveStores[0]?.recent_orders_30d || 0) || 1;
                  return (
                    <div key={s.store_id} className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-white/25 w-4 text-center tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-white/75 truncate">{s.name}</span>
                          <Badge variant="outline" className="text-[10px] border-cyan-500/20 text-cyan-300/80 shrink-0 ml-2 font-normal">
                            {engagement} {t('superAdmin.metrics.actions')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={(engagement / maxEng) * 100} className="h-0.5 flex-1" />
                          <span className="text-[10px] text-white/30 shrink-0 tabular-nums">
                            {s.recent_users_30d} · {s.recent_messages_30d} · {s.recent_orders_30d}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* Per-store table */}
        <Panel className="p-5">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-4 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-purple-300/70" />
            {t('superAdmin.metrics.metricsPerPlatform')}
          </h3>
          {isLoading ? (
            <p className="text-white/25 text-sm">{t('common.loading')}</p>
          ) : perStore.length === 0 ? (
            <p className="text-white/25 text-sm">{t('superAdmin.metrics.noPlatforms')}</p>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left">
                    <th className="pb-3 font-normal text-white/25 text-[10px] uppercase tracking-[0.12em] whitespace-nowrap">{t('superAdmin.metrics.colPlatform')}</th>
                    <th className="pb-3 font-normal text-white/25 text-[10px] uppercase tracking-[0.12em] text-center whitespace-nowrap">{t('superAdmin.metrics.colStatus')}</th>
                    <th className="pb-3 font-normal text-white/25 text-[10px] uppercase tracking-[0.12em] text-right whitespace-nowrap">{t('superAdmin.metrics.colUsers')}</th>
                    <th className="pb-3 font-normal text-white/25 text-[10px] uppercase tracking-[0.12em] text-right whitespace-nowrap">{t('superAdmin.metrics.colOrders')}</th>
                    <th className="pb-3 font-normal text-white/25 text-[10px] uppercase tracking-[0.12em] text-right whitespace-nowrap">{t('superAdmin.metrics.colRevenue')}</th>
                    <th className="pb-3 font-normal text-white/25 text-[10px] uppercase tracking-[0.12em] text-right whitespace-nowrap">{t('superAdmin.metrics.colVIP')}</th>
                    <th className="pb-3 font-normal text-white/25 text-[10px] uppercase tracking-[0.12em] text-right whitespace-nowrap">{t('superAdmin.metrics.colContent')}</th>
                    <th className="pb-3 font-normal text-white/25 text-[10px] uppercase tracking-[0.12em] text-right whitespace-nowrap">{t('superAdmin.metrics.colChat')}</th>
                    <th className="pb-3 font-normal text-white/25 text-[10px] uppercase tracking-[0.12em] text-right whitespace-nowrap">{t('superAdmin.metrics.colTickets')}</th>
                  </tr>
                </thead>
                <tbody>
                  {perStore.map(s => (
                    <tr key={s.store_id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 whitespace-nowrap">
                        <span className="font-medium text-white/85">{s.name}</span>
                        {s.slug && <span className="text-[10px] text-white/25 ml-1.5">/{s.slug}</span>}
                      </td>
                      <td className="py-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] ${s.status === 'active' ? 'text-emerald-300/90' : 'text-white/30'}`}>
                          <span className={`w-1 h-1 rounded-full ${s.status === 'active' ? 'bg-emerald-400' : 'bg-white/20'}`} />
                          {s.plan_type === 'trial' ? 'Trial' : t('superAdmin.metrics.statusPaid')}
                        </span>
                      </td>
                      <td className="py-3 text-right text-white/60 tabular-nums whitespace-nowrap">
                        {s.users_count}
                        {s.recent_users_30d > 0 && <span className="text-[10px] text-emerald-300/80 ml-1">+{s.recent_users_30d}</span>}
                      </td>
                      <td className="py-3 text-right text-white/60 tabular-nums whitespace-nowrap">{s.orders_paid}/{s.orders_total}</td>
                      <td className="py-3 text-right font-medium text-emerald-300 tabular-nums whitespace-nowrap">{brl(s.revenue)}</td>
                      <td className="py-3 text-right text-white/60 tabular-nums whitespace-nowrap">
                        {s.vip_active}
                        {s.vip_revenue > 0 && <span className="text-[10px] text-amber-300/80 ml-1">R${s.vip_revenue.toFixed(0)}</span>}
                      </td>
                      <td className="py-3 text-right text-white/60 tabular-nums whitespace-nowrap">{s.content_count}</td>
                      <td className="py-3 text-right text-white/60 tabular-nums whitespace-nowrap">{s.chat_messages}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        {s.tickets_open > 0 ? (
                          <Badge variant="outline" className="text-[10px] border-rose-500/20 text-rose-300/90 font-normal">
                            {s.tickets_open} {t('superAdmin.metrics.open')}
                          </Badge>
                        ) : (
                          <span className="text-white/25 tabular-nums">{s.tickets_total}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
