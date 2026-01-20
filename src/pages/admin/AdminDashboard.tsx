import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Crown, 
  ShoppingCart, 
  DollarSign,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Clock
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { mockAdminStats, mockAdminOrders, mockAdminReports } from '@/lib/admin-mock-data';

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
  const pendingOrders = mockAdminOrders.filter(o => o.status === 'pending');
  const pendingReports = mockAdminReports.filter(r => r.status === 'pending');

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Usuários"
            value={mockAdminStats.totalUsers.toLocaleString()}
            trend="+12 hoje"
            color="bg-blue-500"
          />
          <StatCard
            icon={Crown}
            label="Membros VIP"
            value={mockAdminStats.totalVIP}
            trend="+3 esta semana"
            color="bg-yellow-500"
          />
          <StatCard
            icon={ShoppingCart}
            label="Pedidos"
            value={mockAdminStats.totalOrders}
            color="bg-purple-500"
          />
          <StatCard
            icon={DollarSign}
            label="Receita"
            value={`R$ ${mockAdminStats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            trend="+15% este mês"
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
                      <p className="text-xs text-muted-foreground">{order.userName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">R$ {order.price.toFixed(2)}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                        Pendente
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Pending Reports */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Denúncias Pendentes
              </h3>
              <Link to="/admin/denuncias" className="text-sm text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            
            {pendingReports.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma denúncia pendente</p>
            ) : (
              <div className="space-y-3">
                {pendingReports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{report.contentTitle}</p>
                      <p className="text-xs text-muted-foreground">{report.reason}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                      Pendente
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4 text-center">
            <Lightbulb className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{mockAdminStats.ideasCount}</p>
            <p className="text-sm text-muted-foreground">Ideias de Vídeos</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
            <p className="text-2xl font-bold">{mockAdminStats.pendingOrders}</p>
            <p className="text-sm text-muted-foreground">Pedidos Pendentes</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <AlertCircle className="w-8 h-8 mx-auto text-red-400 mb-2" />
            <p className="text-2xl font-bold">{mockAdminStats.pendingReports}</p>
            <p className="text-sm text-muted-foreground">Denúncias</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto text-green-400 mb-2" />
            <p className="text-2xl font-bold">{mockAdminStats.newUsersToday}</p>
            <p className="text-sm text-muted-foreground">Novos Hoje</p>
          </GlassCard>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
