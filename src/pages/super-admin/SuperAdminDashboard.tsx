import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Store, Users, DollarSign, TrendingUp, Activity, ShoppingBag,
  Crown, MessageSquare, Lightbulb, LifeBuoy, Percent, BarChart3,
  ArrowUpRight, ArrowDownRight, Eye,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import SuperAdminLayout from './SuperAdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

const PURPLE = '#8b5cf6';
const PURPLE_LIGHT = '#a78bfa';
const CYAN = '#06b6d4';
const AMBER = '#f59e0b';
const GREEN = '#10b981';
const ROSE = '#f43f5e';

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

const SuperAdminDashboard: React.FC = () => {
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

  const chartTooltipStyle = {
    contentStyle: { background: '#0a0a0a', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 12, color: '#fff' },
    itemStyle: { color: '#a78bfa' },
  };

  const MetricCard = ({ label, value, sub, icon: Icon, color = 'purple' }: {
    label: string; value: string | number; sub?: string; icon: any; color?: string;
  }) => {
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-600/20 text-purple-400',
      cyan: 'bg-cyan-600/20 text-cyan-400',
      amber: 'bg-amber-600/20 text-amber-400',
      green: 'bg-green-600/20 text-green-400',
      rose: 'bg-rose-600/20 text-rose-400',
    };
    return (
      <div className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{isLoading ? '—' : value}</p>
            {sub && <p className="text-[11px] text-white/50 mt-0.5">{sub}</p>}
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.purple}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <SuperAdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Row 1: Primary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Plataformas" value={g?.total_stores || 0} sub={`${g?.active_stores || 0} ativas · ${g?.suspended_stores || 0} suspensas`} icon={Store} />
          <MetricCard label="Usuários Totais" value={g?.total_users || 0} sub={`${g?.total_store_users || 0} vinculados a lojas`} icon={Users} color="cyan" />
          <MetricCard label="Faturamento Total" value={`R$ ${(g?.total_revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} sub={`${g?.paid_orders || 0} pedidos pagos`} icon={DollarSign} color="green" />
          <MetricCard label="Conversão Trial→Pago" value={`${g?.conversion_rate || 0}%`} sub={`${g?.trial_stores || 0} trial · ${g?.paid_stores || 0} pagos`} icon={Percent} color="amber" />
        </div>

        {/* Row 2: Secondary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard label="VIP Ativos" value={g?.active_vip_subs || 0} sub={`MRR: R$ ${(g?.vip_mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Crown} color="amber" />
          <MetricCard label="Pedidos" value={g?.total_orders || 0} sub={`${g?.paid_orders || 0} pagos`} icon={ShoppingBag} color="cyan" />
          <MetricCard label="Tickets Abertos" value={g?.open_tickets || 0} sub={`${g?.total_tickets || 0} total`} icon={LifeBuoy} color="rose" />
          <MetricCard label="Conteúdo VIP" value={g?.total_content || 0} icon={Eye} color="purple" />
          <MetricCard label="Engajamento" value={g?.total_chat_messages || 0} sub={`${g?.total_ideas || 0} ideias de vídeo`} icon={MessageSquare} color="green" />
        </div>

        {/* Row 3: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Growth + Revenue Chart */}
          <div className="lg:col-span-2 bg-white/[0.03] border border-purple-500/10 rounded-xl p-5">
            <Tabs defaultValue="growth">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/70">Evolução</h3>
                <TabsList className="bg-white/5 h-7">
                  <TabsTrigger value="growth" className="text-[11px] h-6 px-2.5">Crescimento</TabsTrigger>
                  <TabsTrigger value="revenue" className="text-[11px] h-6 px-2.5">Receita</TabsTrigger>
                  <TabsTrigger value="new" className="text-[11px] h-6 px-2.5">Novos</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="growth" className="mt-0">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyGrowth}>
                    <defs>
                      <linearGradient id="gPurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PURPLE} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CYAN} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...chartTooltipStyle} />
                    <Area type="monotone" dataKey="stores" name="Plataformas" stroke={PURPLE} fill="url(#gPurple)" strokeWidth={2} />
                    <Area type="monotone" dataKey="users" name="Usuários" stroke={CYAN} fill="url(#gCyan)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="revenue" className="mt-0">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...chartTooltipStyle} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                    <Bar dataKey="revenue" name="Receita" fill={GREEN} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="new" className="mt-0">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...chartTooltipStyle} />
                    <Bar dataKey="new_stores" name="Novas Lojas" fill={PURPLE} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="new_users" name="Novos Usuários" fill={CYAN} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </div>

          {/* Plan distribution */}
          <div className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-5">
            <h3 className="text-sm font-medium text-white/70 mb-4">Distribuição de Planos</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                  {planData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {planData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-white/50">{d.name}</span>
                  <span className="text-white font-medium">{d.value}</span>
                </div>
              ))}
            </div>

            {/* Conversion funnel */}
            <div className="mt-5 space-y-2">
              <p className="text-[11px] text-white/40 uppercase tracking-wider">Funil de Conversão</p>
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-white/50">Cadastros → Trial</span>
                    <span className="text-white/70">100%</span>
                  </div>
                  <Progress value={100} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-white/50">Trial → Pago</span>
                    <span className="text-white/70">{g?.conversion_rate || 0}%</span>
                  </div>
                  <Progress value={g?.conversion_rate || 0} className="h-1.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Per-store ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Revenue */}
          <div className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-5">
            <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Top Receita
            </h3>
            {topStores.length === 0 ? (
              <p className="text-white/30 text-sm">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {topStores.map((s, i) => {
                  const maxRevenue = topStores[0]?.revenue || 1;
                  return (
                    <div key={s.store_id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white/30 w-5 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white/80 truncate">{s.name}</span>
                          <span className="text-sm font-medium text-green-400 shrink-0 ml-2">
                            R$ {s.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={(s.revenue / maxRevenue) * 100} className="h-1 flex-1" />
                          <div className="flex items-center gap-2 text-[10px] text-white/40 shrink-0">
                            <span>{s.users_count} 👥</span>
                            <span>{s.orders_paid} 📦</span>
                            <span>{s.vip_active} 👑</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Most Active (engagement) */}
          <div className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-5">
            <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Mais Ativas (30 dias)
            </h3>
            {mostActiveStores.length === 0 ? (
              <p className="text-white/30 text-sm">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {mostActiveStores.map((s, i) => {
                  const engagement = s.recent_messages_30d + s.recent_orders_30d;
                  const maxEng = (mostActiveStores[0]?.recent_messages_30d || 0) + (mostActiveStores[0]?.recent_orders_30d || 0) || 1;
                  return (
                    <div key={s.store_id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white/30 w-5 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white/80 truncate">{s.name}</span>
                          <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 shrink-0 ml-2">
                            {engagement} ações
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={(engagement / maxEng) * 100} className="h-1 flex-1" />
                          <div className="flex items-center gap-2 text-[10px] text-white/40 shrink-0">
                            <span>{s.recent_users_30d} novos 👥</span>
                            <span>{s.recent_messages_30d} 💬</span>
                            <span>{s.recent_orders_30d} 📦</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Row 5: Per-store detailed table */}
        <div className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            Métricas por Plataforma
          </h3>
          {isLoading ? (
            <p className="text-white/30 text-sm">Carregando...</p>
          ) : perStore.length === 0 ? (
            <p className="text-white/30 text-sm">Nenhuma plataforma</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left">
                    <th className="pb-2 font-medium text-white/30 text-[11px]">Plataforma</th>
                    <th className="pb-2 font-medium text-white/30 text-[11px] text-center">Status</th>
                    <th className="pb-2 font-medium text-white/30 text-[11px] text-right">Usuários</th>
                    <th className="pb-2 font-medium text-white/30 text-[11px] text-right">Pedidos</th>
                    <th className="pb-2 font-medium text-white/30 text-[11px] text-right">Receita</th>
                    <th className="pb-2 font-medium text-white/30 text-[11px] text-right">VIP</th>
                    <th className="pb-2 font-medium text-white/30 text-[11px] text-right">Conteúdo</th>
                    <th className="pb-2 font-medium text-white/30 text-[11px] text-right">Chat</th>
                    <th className="pb-2 font-medium text-white/30 text-[11px] text-right">Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {perStore.map(s => (
                    <tr key={s.store_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5">
                        <div>
                          <span className="font-medium text-white/90">{s.name}</span>
                          {s.slug && <span className="text-[10px] text-white/30 ml-1.5">/{s.slug}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] ${s.status === 'active' ? 'text-green-400' : 'text-white/30'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-green-400' : 'bg-white/20'}`} />
                          {s.plan_type === 'trial' ? 'Trial' : 'Pago'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-white/70">
                        {s.users_count}
                        {s.recent_users_30d > 0 && (
                          <span className="text-[10px] text-green-400 ml-1">+{s.recent_users_30d}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-white/70">{s.orders_paid}/{s.orders_total}</td>
                      <td className="py-2.5 text-right font-medium text-green-400">
                        R$ {s.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-right text-white/70">
                        {s.vip_active}
                        {s.vip_revenue > 0 && (
                          <span className="text-[10px] text-amber-400 ml-1">R${s.vip_revenue.toFixed(0)}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-white/70">{s.content_count}</td>
                      <td className="py-2.5 text-right text-white/70">{s.chat_messages}</td>
                      <td className="py-2.5 text-right">
                        {s.tickets_open > 0 ? (
                          <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-400">
                            {s.tickets_open} abertos
                          </Badge>
                        ) : (
                          <span className="text-white/30">{s.tickets_total}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
