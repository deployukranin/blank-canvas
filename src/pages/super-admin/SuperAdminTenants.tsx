import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Store, Ban, CheckCircle, Trash2, Clock, Search, Plus } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface TenantRow {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  plan_type: string;
  plan_expires_at: string | null;
  suspended_at: string | null;
  created_at: string;
  description: string | null;
}

const SuperAdminTenants: React.FC = () => {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [filtered, setFiltered] = useState<TenantRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('stores')
        .select('id, name, slug, status, plan_type, plan_expires_at, suspended_at, created_at, description')
        .order('created_at', { ascending: false });
      setTenants((data as TenantRow[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let result = tenants;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q) || t.slug?.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    setFiltered(result);
  }, [tenants, search, statusFilter]);

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
        action === 'delete' ? 'Plataforma apagada' :
        'Plano atualizado'
      );
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerenciar plataforma');
    } finally {
      setActionLoading(null);
    }
  };

  const isExpired = (d: string | null) => d ? new Date(d) < new Date() : false;
  const daysRemaining = (d: string | null) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getPlanBadge = (planType: string, expired: boolean) => {
    if (expired) return <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10">Expirado</Badge>;
    if (planType === 'trial') return <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10">Trial</Badge>;
    return <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10">Pago</Badge>;
  };

  return (
    <SuperAdminLayout title="Plataformas">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou slug..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="suspended">Suspensas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold">{tenants.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{tenants.filter(t => t.status === 'active').length}</p>
            <p className="text-xs text-muted-foreground">Ativas</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{tenants.filter(t => t.plan_type === 'trial').length}</p>
            <p className="text-xs text-muted-foreground">Em Trial</p>
          </GlassCard>
        </div>

        {/* List */}
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : filtered.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Store className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma plataforma encontrada</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filtered.map(tenant => {
              const expired = isExpired(tenant.plan_expires_at);
              const days = daysRemaining(tenant.plan_expires_at);

              return (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <GlassCard className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{tenant.name}</h4>
                          <Badge variant={tenant.status === 'active' ? 'default' : 'destructive'} className="text-[10px]">
                            {tenant.status === 'active' ? 'Ativa' : 'Suspensa'}
                          </Badge>
                          {getPlanBadge(tenant.plan_type, expired)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {tenant.slug && <span>/{tenant.slug}</span>}
                          <span>Criada em {new Date(tenant.created_at).toLocaleDateString('pt-BR')}</span>
                          {tenant.plan_expires_at && (
                            <span className={expired ? 'text-red-400' : days !== null && days <= 3 ? 'text-yellow-400' : ''}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {expired ? 'Expirado' : `${days}d restantes`}
                            </span>
                          )}
                        </div>
                        {tenant.description && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{tenant.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          defaultValue={tenant.plan_type}
                          onValueChange={value =>
                            manageStore(tenant.id, 'update_plan', {
                              plan_type: value,
                              plan_expires_at: value === 'paid'
                                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                                : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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

                        {tenant.status === 'active' ? (
                          <Button size="sm" variant="destructive" className="h-8 text-xs" disabled={actionLoading === tenant.id}
                            onClick={() => manageStore(tenant.id, 'suspend')}>
                            <Ban className="w-3 h-3 mr-1" /> Suspender
                          </Button>
                        ) : (
                          <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700" disabled={actionLoading === tenant.id}
                            onClick={() => manageStore(tenant.id, 'activate')}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Ativar
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              disabled={actionLoading === tenant.id}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Apagar plataforma</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja apagar <strong>{tenant.name}</strong>? Todos os dados serão removidos permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => manageStore(tenant.id, 'delete')}>
                                Apagar permanentemente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminTenants;
