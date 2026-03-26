import React, { useEffect, useState, useCallback } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import { Store, Users, DollarSign, TrendingUp, Ban, CheckCircle, Crown, Clock, Trash2 } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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
  plan_type: string;
  plan_expires_at: string | null;
  suspended_at: string | null;
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: storesData, count: storesCount } = await supabase
        .from('stores')
        .select('id, name, slug, status, plan_type, plan_expires_at, suspended_at, created_at', { count: 'exact' });

      const activeStores = storesData?.filter((s: any) => s.status === 'active') || [];

      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: ordersData } = await supabase
        .from('custom_orders')
        .select('amount_cents, status');

      const paidOrders = ordersData?.filter((o: any) => o.status === 'paid' || o.status === 'completed') || [];
      const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.amount_cents || 0), 0) / 100;

      setStats({
        totalTenants: storesCount || 0,
        activeTenants: activeStores.length,
        totalUsers: usersCount || 0,
        totalRevenue,
        newUsersToday: 0,
      });

      setTenants((storesData as TenantRow[]) || []);
    } catch (error) {
      console.error('Error fetching super admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const manageStore = async (storeId: string, action: string, extra?: Record<string, unknown>) => {
    setActionLoading(storeId);
    try {
      const { data, error } = await supabase.functions.invoke('super-admin-manage-store', {
        body: { action, store_id: storeId, ...extra },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        action === 'suspend' ? 'Plataforma suspensa' :
        action === 'activate' ? 'Plataforma ativada' :
        'Plano atualizado'
      );
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerenciar plataforma');
    } finally {
      setActionLoading(null);
    }
  };

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'trial':
        return <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10">Trial</Badge>;
      case 'paid':
        return <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10">Pago</Badge>;
      case 'expired':
        return <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10">Expirado</Badge>;
      default:
        return <Badge variant="secondary">{planType}</Badge>;
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const daysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

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
            Gestão de Plataformas
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
                    <th className="pb-3 font-medium text-muted-foreground">Plano</th>
                    <th className="pb-3 font-medium text-muted-foreground">Expira em</th>
                    <th className="pb-3 font-medium text-muted-foreground">Criado em</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => {
                    const days = daysRemaining(tenant.plan_expires_at);
                    const expired = isExpired(tenant.plan_expires_at);

                    return (
                      <motion.tr
                        key={tenant.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-border/50"
                      >
                        <td className="py-3 font-medium">{tenant.name}</td>
                        <td className="py-3 text-muted-foreground">{tenant.slug || '—'}</td>
                        <td className="py-3">
                          <Badge variant={tenant.status === 'active' ? 'default' : 'destructive'}>
                            {tenant.status === 'active' ? 'Ativa' : 'Suspensa'}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {getPlanBadge(expired ? 'expired' : tenant.plan_type)}
                        </td>
                        <td className="py-3">
                          {tenant.plan_expires_at ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className={expired ? 'text-red-400' : days !== null && days <= 3 ? 'text-yellow-400' : 'text-muted-foreground'}>
                                {expired
                                  ? 'Expirado'
                                  : `${days}d restantes`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2 justify-end">
                            {/* Plan selector */}
                            <Select
                              defaultValue={tenant.plan_type}
                              onValueChange={(value) =>
                                manageStore(tenant.id, 'update_plan', {
                                  plan_type: value,
                                  plan_expires_at: value === 'paid'
                                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                                    : value === 'trial'
                                    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                                    : null,
                                })
                              }
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Suspend / Activate */}
                            {tenant.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 text-xs"
                                disabled={actionLoading === tenant.id}
                                onClick={() => manageStore(tenant.id, 'suspend')}
                              >
                                <Ban className="w-3 h-3 mr-1" />
                                Suspender
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 text-xs bg-green-600 hover:bg-green-700"
                                disabled={actionLoading === tenant.id}
                                onClick={() => manageStore(tenant.id, 'activate')}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Ativar
                              </Button>
                            )}

                            {/* Delete */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  disabled={actionLoading === tenant.id}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Apagar plataforma</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja apagar <strong>{tenant.name}</strong>? Todos os dados (pedidos, usuários, configurações) serão removidos permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => manageStore(tenant.id, 'delete')}
                                  >
                                    Apagar permanentemente
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
        </GlassCard>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
