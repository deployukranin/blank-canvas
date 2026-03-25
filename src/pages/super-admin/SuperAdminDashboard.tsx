import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Users, DollarSign, TrendingUp, Clock, Zap } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface GlobalStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
  newUsersToday: number;
}

interface TenantRow {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  created_at: string;
}

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<GlobalStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalRevenue: 0,
    newUsersToday: 0,
  });
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stores (tenants)
        const { data: storesData, count: storesCount } = await supabase
          .from('stores')
          .select('id, name, slug, status, created_at', { count: 'exact' });

        const activeStores = storesData?.filter((s) => s.status === 'active') || [];

        // Fetch total users (profiles)
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch revenue from paid orders
        const { data: ordersData } = await supabase
          .from('custom_orders')
          .select('amount_cents, status');

        const paidOrders = ordersData?.filter((o) => o.status === 'paid' || o.status === 'completed') || [];
        const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0) / 100;

        setStats({
          totalTenants: storesCount || 0,
          activeTenants: activeStores.length,
          totalUsers: usersCount || 0,
          totalRevenue,
          newUsersToday: 0,
        });

        setTenants(storesData || []);
      } catch (error) {
        console.error('Error fetching super admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <SuperAdminLayout title="Dashboard Global">
      <div className="space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plataformas</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? '...' : stats.totalTenants}</p>
                <p className="text-xs text-green-400 mt-1">{stats.activeTenants} ativas</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500">
                <Store className="w-5 h-5 text-white" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários Totais</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? '...' : stats.totalUsers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Bruto</p>
                <p className="text-2xl font-bold mt-1">
                  {isLoading ? '...' : `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novos Hoje</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? '...' : stats.newUsersToday}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-500">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Tenant Table */}
        <GlassCard className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-primary" />
            Plataformas Cadastradas
          </h3>

          {isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : tenants.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma plataforma cadastrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Nome</th>
                    <th className="pb-3 font-medium text-muted-foreground">Slug</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <motion.tr
                      key={tenant.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border/50"
                    >
                      <td className="py-3 font-medium">{tenant.name}</td>
                      <td className="py-3 text-muted-foreground">{tenant.slug || '—'}</td>
                      <td className="py-3">
                        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                          {tenant.status === 'active' ? 'Ativa' : 'Suspensa'}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
