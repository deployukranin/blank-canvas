import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Filter,
  Eye,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  customer_name: string;
  product_type: string;
  amount_cents: number;
  payout_amount_cents: number | null;
  status: string;
  payout_status: string | null;
  paid_at: string | null;
  created_at: string;
  category_name: string | null;
  duration_label: string | null;
}

interface Metrics {
  totalReceived: number;
  totalPending: number;
  totalPaid: number;
  totalFailed: number;
  countPending: number;
  countPaid: number;
  countFailed: number;
}

const AdminPagamentosPix = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    totalReceived: 0,
    totalPending: 0,
    totalPaid: 0,
    totalFailed: 0,
    countPending: 0,
    countPaid: 0,
    countFailed: 0,
  });

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      calculateMetrics(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Erro ao carregar pedidos',
        description: 'Não foi possível buscar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (data: Order[]) => {
    const metrics: Metrics = {
      totalReceived: 0,
      totalPending: 0,
      totalPaid: 0,
      totalFailed: 0,
      countPending: 0,
      countPaid: 0,
      countFailed: 0,
    };

    data.forEach((order) => {
      const amount = order.amount_cents || 0;

      if (order.status === 'pending') {
        metrics.totalPending += amount;
        metrics.countPending++;
      } else if (order.status === 'paid' || order.status === 'payout_done') {
        metrics.totalPaid += amount;
        metrics.totalReceived += amount;
        metrics.countPaid++;
      } else if (order.payout_status === 'failed') {
        metrics.totalFailed += amount;
        metrics.countFailed++;
      }
    });

    setMetrics(metrics);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = [...orders];

    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filtered = filtered.filter((o) => o.status === 'pending');
      } else if (statusFilter === 'paid') {
        filtered = filtered.filter((o) => o.status === 'paid' || o.status === 'payout_done');
      } else if (statusFilter === 'failed') {
        filtered = filtered.filter((o) => o.payout_status === 'failed');
      }
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((o) => o.product_type === typeFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, typeFilter]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const getStatusBadge = (order: Order) => {
    if (order.status === 'pending') {
      return <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">Pendente</Badge>;
    }
    if (order.status === 'paid' || order.status === 'payout_done') {
      return <Badge variant="outline" className="text-green-500 border-green-500/50">Pago</Badge>;
    }
    if (order.payout_status === 'failed') {
      return <Badge variant="destructive">Falhou</Badge>;
    }
    return <Badge variant="secondary">{order.status}</Badge>;
  };

  const getProductTypeBadge = (type: string) => {
    if (type === 'vip_subscription') {
      return <Badge className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">VIP</Badge>;
    }
    return <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Vídeo</Badge>;
  };

  return (
    <AdminLayout title="Pagamentos PIX">
      <div className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recebido</p>
                <p className="text-xl font-bold text-green-500">
                  {formatCurrency(metrics.totalReceived)}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold text-yellow-500">
                  {metrics.countPending}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(metrics.totalPending)}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagos</p>
                <p className="text-xl font-bold text-green-500">
                  {metrics.countPaid}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(metrics.totalPaid)}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Falhos</p>
                <p className="text-xl font-bold text-destructive">
                  {metrics.countFailed}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(metrics.totalFailed)}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros:</span>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="failed">Falhos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="video">Vídeos</SelectItem>
                <SelectItem value="vip_subscription">VIP</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={fetchOrders} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <span className="text-sm text-muted-foreground ml-auto">
              {filteredOrders.length} registro(s)
            </span>
          </div>
        </GlassCard>

        {/* Orders Table */}
        <GlassCard className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Repasse (79%)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.customer_name}
                    </TableCell>
                    <TableCell>
                      {getProductTypeBadge(order.product_type)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(order.amount_cents)}
                    </TableCell>
                    <TableCell>
                      {order.payout_amount_cents 
                        ? formatCurrency(order.payout_amount_cents)
                        : formatCurrency(Math.round(order.amount_cents * 0.79))
                      }
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order)}
                    </TableCell>
                    <TableCell>
                      {order.paid_at 
                        ? format(new Date(order.paid_at), "dd/MM/yy HH:mm", { locale: ptBR })
                        : format(new Date(order.created_at), "dd/MM/yy HH:mm", { locale: ptBR })
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </GlassCard>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Pagamento</DialogTitle>
              <DialogDescription>
                Informações completas do pedido
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    {getProductTypeBadge(selectedOrder.product_type)}
                  </div>
                </div>

                {selectedOrder.product_type === 'video' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Categoria</p>
                      <p className="font-medium">{selectedOrder.category_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duração</p>
                      <p className="font-medium">{selectedOrder.duration_label || '-'}</p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="text-lg font-bold">{formatCurrency(selectedOrder.amount_cents)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Repasse (79%)</p>
                      <p className="text-lg font-bold text-green-500">
                        {selectedOrder.payout_amount_cents 
                          ? formatCurrency(selectedOrder.payout_amount_cents)
                          : formatCurrency(Math.round(selectedOrder.amount_cents * 0.79))
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status Pagamento</p>
                      {getStatusBadge(selectedOrder)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status Repasse</p>
                      <Badge variant="outline">
                        {selectedOrder.payout_status || 'Aguardando'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="text-sm">
                      {format(new Date(selectedOrder.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {selectedOrder.paid_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Pago em</p>
                      <p className="text-sm">
                        {format(new Date(selectedOrder.paid_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPagamentosPix;
