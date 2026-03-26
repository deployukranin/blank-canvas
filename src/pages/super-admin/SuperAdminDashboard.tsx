import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Store, Users, DollarSign, TrendingUp, Ban, CheckCircle, Trash2, Clock, Activity } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import SuperAdminLayout from './SuperAdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface GlobalStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalRevenue: number;
  trialTenants: number;
  paidTenants: number;
}

interface TenantRow {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  plan_type: string;
  plan_expires_at: string | null;
  suspended_at: string | null;
  created_at: string;
}

const PURPLE = '#8b5cf6';
const PURPLE_LIGHT = '#a78bfa';
const PURPLE_DARK = '#6d28d9';
const PURPLE_DIM = '#4c1d95';

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<GlobalStats>({
    totalTenants: 0, activeTenants: 0, suspendedTenants: 0,
    totalUsers: 0, totalRevenue: 0, trialTenants: 0, paidTenants: 0,
  });
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: storesData, count: storesCount } = await supabase
        .from('stores')
        .select('id, name, slug, status, plan_type, plan_expires_at, suspended_at, created_at', { count: 'exact' });

      const stores = (storesData as TenantRow[]) || [];
      const active = stores.filter(s => s.status === 'active');
      const suspended = stores.filter(s => s.status === 'suspended');
      const trial = stores.filter(s => s.plan_type === 'trial');
      const paid = stores.filter(s => s.plan_type === 'paid');

      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      const { data: ordersData } = await supabase.from('custom_orders').select('amount_cents, status');
      const paidOrders = ordersData?.filter((o: any) => o.status === 'paid' || o.status === 'completed') || [];
      const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.amount_cents || 0), 0) / 100;

      setStats({
        totalTenants: storesCount || 0,
        activeTenants: active.length,
        suspendedTenants: suspended.length,
        totalUsers: usersCount || 0,
        totalRevenue,
        trialTenants: trial.length,
        paidTenants: paid.length,
      });
      setTenants(stores);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const manageStore = async (storeId: string, action: string, extra?: Record<string, unknown>) => {
    setActionLoading(storeId);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-manage-store', {
        body: { action, store_id: storeId, ...extra },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(action === 'suspend' ? 'Suspensa' : action === 'activate' ? 'Ativada' : action === 'delete' ? 'Apagada' : 'Atualizado');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro');
    } finally {
      setActionLoading(null);
    }
  };

  // Chart data
  const growthData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return months.map((m, i) => {
      const count = tenants.filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() <= i;
      }).length;
      return { month: m, plataformas: count, usuarios: Math.round(count * 3.5) };
    });
  }, [tenants]);

  const planData = useMemo(() => [
    { name: 'Trial', value: stats.trialTenants, color: PURPLE_LIGHT },
    { name: 'Pago', value: stats.paidTenants, color: PURPLE },
  ], [stats]);

  const statusData = useMemo(() => [
    { name: 'Ativas', value: stats.activeTenants, color: PURPLE },
    { name: 'Suspensas', value: stats.suspendedTenants, color: '#374151' },
  ], [stats]);

  const isExpired = (d: string | null) => d ? new Date(d) < new Date() : false;
  const daysRemaining = (d: string | null) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const MetricCard = ({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: any }) => (
    <div className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{isLoading ? '—' : value}</p>
          {sub && <p className="text-[11px] text-purple-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-600/20">
          <Icon className="w-4 h-4 text-purple-400" />
        </div>
      </div>
    </div>
  );

  const chartTooltipStyle = {
    contentStyle: { background: '#0a0a0a', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 12, color: '#fff' },
    itemStyle: { color: '#a78bfa' },
  };

  return (
    <SuperAdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Plataformas" value={stats.totalTenants} sub={`${stats.activeTenants} ativas`} icon={Store} />
          <MetricCard label="Usuários" value={stats.totalUsers} icon={Users} />
          <MetricCard label="Faturamento" value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} />
          <MetricCard label="Em Trial" value={stats.trialTenants} sub={`${stats.paidTenants} pagos`} icon={Activity} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Growth chart */}
          <div className="lg:col-span-2 bg-white/[0.03] border border-purple-500/10 rounded-xl p-5">
            <h3 className="text-sm font-medium text-white/70 mb-4">Crescimento</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PURPLE} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="plataformas" stroke={PURPLE} fill="url(#purpleGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="usuarios" stroke={PURPLE_LIGHT} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Plan distribution */}
          <div className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-5">
            <h3 className="text-sm font-medium text-white/70 mb-4">Planos</h3>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
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
          </div>
        </div>

        {/* Recent Tenants */}
        <div className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
            <Store className="w-4 h-4 text-purple-400" />
            Plataformas recentes
          </h3>

          {isLoading ? (
            <p className="text-white/30 text-sm">Carregando...</p>
          ) : tenants.length === 0 ? (
            <p className="text-white/30 text-sm">Nenhuma plataforma</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left">
                    <th className="pb-2 font-medium text-white/30 text-xs">Nome</th>
                    <th className="pb-2 font-medium text-white/30 text-xs">Status</th>
                    <th className="pb-2 font-medium text-white/30 text-xs">Plano</th>
                    <th className="pb-2 font-medium text-white/30 text-xs">Expira</th>
                    <th className="pb-2 font-medium text-white/30 text-xs text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.slice(0, 5).map((tenant) => {
                    const expired = isExpired(tenant.plan_expires_at);
                    const days = daysRemaining(tenant.plan_expires_at);
                    return (
                      <motion.tr key={tenant.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5">
                        <td className="py-2.5 font-medium text-white/90">{tenant.name}</td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center gap-1 text-xs ${tenant.status === 'active' ? 'text-purple-400' : 'text-white/30'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'active' ? 'bg-purple-400' : 'bg-white/20'}`} />
                            {tenant.status === 'active' ? 'Ativa' : 'Suspensa'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            expired ? 'bg-red-500/10 text-red-400' :
                            tenant.plan_type === 'trial' ? 'bg-purple-500/10 text-purple-400' :
                            'bg-purple-600/20 text-purple-300'
                          }`}>
                            {expired ? 'Expirado' : tenant.plan_type === 'trial' ? 'Trial' : 'Pago'}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-white/30">
                          {tenant.plan_expires_at ? (
                            <span className={expired ? 'text-red-400' : days !== null && days <= 3 ? 'text-yellow-400' : ''}>
                              {expired ? 'Expirado' : `${days}d`}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Select
                              defaultValue={tenant.plan_type}
                              onValueChange={value => manageStore(tenant.id, 'update_plan', {
                                plan_type: value,
                                plan_expires_at: value === 'paid'
                                  ? new Date(Date.now() + 30 * 86400000).toISOString()
                                  : new Date(Date.now() + 7 * 86400000).toISOString(),
                              })}
                            >
                              <SelectTrigger className="w-20 h-7 text-[11px] bg-transparent border-white/10 text-white/60">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                              </SelectContent>
                            </Select>

                            {tenant.status === 'active' ? (
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-white/40 hover:text-red-400 hover:bg-red-500/10"
                                disabled={actionLoading === tenant.id} onClick={() => manageStore(tenant.id, 'suspend')}>
                                <Ban className="w-3 h-3" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-white/40 hover:text-purple-400 hover:bg-purple-500/10"
                                disabled={actionLoading === tenant.id} onClick={() => manageStore(tenant.id, 'activate')}>
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/20 hover:text-red-400 hover:bg-red-500/10"
                                  disabled={actionLoading === tenant.id}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-black border-purple-500/20">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Apagar plataforma</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apagar <strong>{tenant.name}</strong> permanentemente? Todos os dados serão perdidos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => manageStore(tenant.id, 'delete')}>
                                    Apagar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
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
