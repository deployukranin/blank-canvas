import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Crown, 
  ShoppingCart, 
  DollarSign,
  Lightbulb,
  TrendingUp,
  Clock
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalUsers: number;
  totalVIP: number;
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
  ideasCount: number;
  newUsersToday: number;
}

interface PendingOrder {
  id: string;
  productName: string;
  customerName: string;
  amountCents: number;
}

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  color: string;
}> = ({ icon: Icon, label, value, trend, color }) => (
  <GlassCard className="p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {trend && (
          <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </GlassCard>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalVIP: 0,
    totalOrders: 0,
    revenue: 0,
    pendingOrders: 0,
    ideasCount: 0,
    newUsersToday: 0,
  });
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch VIP count
        const { count: vipCount } = await supabase
          .from('vip_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString());

        // Fetch orders
        const { data: orders } = await supabase
          .from('custom_orders')
          .select('amount_cents, status, id, customer_name, category_name');

        const totalOrders = orders?.length || 0;
        const revenue = orders?.filter(o => o.status === 'paid' || o.status === 'delivered')
          .reduce((sum, o) => sum + (o.amount_cents || 0), 0) || 0;
        const pending = orders?.filter(o => o.status === 'pending') || [];

        setStats({
          totalUsers: userCount || 0,
          totalVIP: vipCount || 0,
          totalOrders,
          revenue: revenue / 100,
          pendingOrders: pending.length,
          ideasCount: 0,
          newUsersToday: 0,
        });

        setPendingOrders(pending.map(o => ({
          id: o.id,
          productName: o.category_name || 'Pedido Personalizado',
          customerName: o.customer_name,
          amountCents: o.amount_cents,
        })));
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Usuários"
            value={loading ? '...' : stats.totalUsers.toLocaleString()}
            color="bg-blue-500"
          />
          <StatCard
            icon={Crown}
            label="Membros VIP"
            value={loading ? '...' : stats.totalVIP}
            color="bg-yellow-500"
          />
          <StatCard
            icon={ShoppingCart}
            label="Pedidos"
            value={loading ? '...' : stats.totalOrders}
            color="bg-purple-500"
          />
          <StatCard
            icon={DollarSign}
            label="Receita"
            value={loading ? '...' : `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            color="bg-green-500"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Orders */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Pedidos Pendentes
              </h3>
              <Link to="/admin/pedidos" className="text-sm text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            
            {pendingOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum pedido pendente</p>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{order.productName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">R$ {(order.amountCents / 100).toFixed(2)}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                        Pendente
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <GlassCard className="p-4 text-center">
            <Lightbulb className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.ideasCount}</p>
            <p className="text-sm text-muted-foreground">Ideias de Vídeos</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
            <p className="text-sm text-muted-foreground">Pedidos Pendentes</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto text-green-400 mb-2" />
            <p className="text-2xl font-bold">{stats.newUsersToday}</p>
            <p className="text-sm text-muted-foreground">Novos Hoje</p>
          </GlassCard>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
