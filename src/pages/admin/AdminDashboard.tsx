import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Crown, ShoppingCart, DollarSign, Lightbulb, TrendingUp, Clock, Activity } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';

const PURPLE = '#8b5cf6';
const PURPLE_LIGHT = '#a78bfa';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalUsers: 0, totalVIP: 0, totalOrders: 0, revenue: 0, pendingOrders: 0, newUsersToday: 0 });
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <AdminLayout title={t('admin.dashboard')}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label={t('admin.totalUsers')} value={stats.totalUsers.toLocaleString()} icon={Users} />
          <MetricCard label={t('admin.vipMembers')} value={stats.totalVIP} icon={Crown} />
          <MetricCard label={t('admin.orders')} value={stats.totalOrders} sub={`${stats.pendingOrders} ${t('admin.pending').toLowerCase()}`} icon={ShoppingCart} />
          <MetricCard label={t('admin.revenue')} value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white/[0.03] border border-purple-500/10 rounded-xl p-5">
            <h3 className="text-sm font-medium text-white/70 mb-4">{t('admin.weeklyActivity')}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="adminPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PURPLE} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="receita" stroke={PURPLE} fill="url(#adminPurpleGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="pedidos" stroke={PURPLE_LIGHT} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                {t('admin.pending')}
              </h3>
              <Link to="/admin/pedidos" className="text-[11px] text-purple-400 hover:text-purple-300">
                {t('admin.viewAll')} →
              </Link>
            </div>
            {isLoading ? (
              <p className="text-white/30 text-sm">{t('common.loading')}</p>
            ) : pendingOrders.length === 0 ? (
              <p className="text-white/30 text-sm">{t('common.none')}</p>
            ) : (
              <div className="space-y-2">
                {pendingOrders.map((order) => (
                  <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="font-medium text-xs text-white/80">{order.category_name || 'Custom'}</p>
                      <p className="text-[10px] text-white/30">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-xs text-white/80">R$ {(order.amount_cents / 100).toFixed(2)}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
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
          <div className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-4 text-center">
            <Lightbulb className="w-6 h-6 mx-auto text-purple-400 mb-2" />
            <p className="text-xl font-bold text-white">—</p>
            <p className="text-[11px] text-white/40">{t('admin.ideasLabel')}</p>
          </div>
          <div className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-purple-400 mb-2" />
            <p className="text-xl font-bold text-white">{isLoading ? '—' : stats.pendingOrders}</p>
            <p className="text-[11px] text-white/40">{t('admin.pending')}</p>
          </div>
          <div className="bg-white/[0.03] border border-purple-500/10 rounded-xl p-4 text-center">
            <Activity className="w-6 h-6 mx-auto text-purple-400 mb-2" />
            <p className="text-xl font-bold text-white">{isLoading ? '—' : stats.newUsersToday}</p>
            <p className="text-[11px] text-white/40">{t('admin.newToday')}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
