import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Search, 
  Filter, 
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PaymentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAID' | 'EXPIRED' | 'REFUNDED';

const statusConfig: Record<PaymentStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  PENDING: { label: 'Pendente', icon: Clock, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  ACTIVE: { label: 'Ativo', icon: Clock, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  COMPLETED: { label: 'Concluído', icon: CheckCircle2, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  PAID: { label: 'Pago', icon: CheckCircle2, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  EXPIRED: { label: 'Expirado', icon: XCircle, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  REFUNDED: { label: 'Reembolsado', icon: AlertTriangle, className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

interface Influencer {
  id: string;
  name: string;
}

interface PixPayment {
  id: string;
  correlation_id: string;
  charge_id: string | null;
  value: number;
  status: string;
  product_type: string;
  product_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  influencer_id: string | null;
  split_platform_value: number | null;
  split_influencer_value: number | null;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
}

const AdminPagamentosPix = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [influencerFilter, setInfluencerFilter] = useState<string>('all');

  // Fetch influencers
  const { data: influencers = [] } = useQuery({
    queryKey: ['admin-influencers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Influencer[];
    },
  });

  // Fetch payments
  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-pix-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pix_payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as PixPayment[];
    },
  });

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          payment.correlation_id?.toLowerCase().includes(search) ||
          payment.charge_id?.toLowerCase().includes(search) ||
          payment.customer_name?.toLowerCase().includes(search) ||
          payment.customer_email?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && payment.status !== statusFilter) {
        return false;
      }

      // Influencer filter
      if (influencerFilter !== 'all' && payment.influencer_id !== influencerFilter) {
        return false;
      }

      return true;
    });
  }, [payments, searchTerm, statusFilter, influencerFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = payments.length;
    const completed = payments.filter(p => p.status === 'COMPLETED' || p.status === 'PAID').length;
    const pending = payments.filter(p => p.status === 'PENDING' || p.status === 'ACTIVE').length;
    const totalValue = payments
      .filter(p => p.status === 'COMPLETED' || p.status === 'PAID')
      .reduce((sum, p) => sum + (p.value || 0), 0);
    const platformValue = payments
      .filter(p => p.status === 'COMPLETED' || p.status === 'PAID')
      .reduce((sum, p) => sum + (p.split_platform_value || 0), 0);

    return { total, completed, pending, totalValue, platformValue };
  }, [payments]);

  const getInfluencerName = (influencerId: string | null) => {
    if (!influencerId) return '-';
    const influencer = influencers.find(i => i.id === influencerId);
    return influencer?.name || 'Desconhecido';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as PaymentStatus] || statusConfig.PENDING;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`gap-1 ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <AdminLayout title="Pagamentos PIX">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Cobranças</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Pagos</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(stats.platformValue)}</p>
                <p className="text-xs text-muted-foreground">Receita Plataforma</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, cliente ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="COMPLETED">Concluído</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="EXPIRED">Expirado</SelectItem>
                  <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={influencerFilter} onValueChange={setInfluencerFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Influencer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Influencers</SelectItem>
                  {influencers.map((influencer) => (
                    <SelectItem key={influencer.id} value={influencer.id}>
                      {influencer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        </GlassCard>

        {/* Payments Table */}
        <GlassCard className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CreditCard className="w-12 h-12 mb-4 opacity-50" />
              <p>Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Split Plataforma</TableHead>
                    <TableHead>Split Influencer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">
                              {format(new Date(payment.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(payment.created_at), 'HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.customer_name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{payment.customer_email || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getInfluencerName(payment.influencer_id)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{formatCurrency(payment.value)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-primary font-medium">
                          {payment.split_platform_value ? formatCurrency(payment.split_platform_value) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-400 font-medium">
                          {payment.split_influencer_value ? formatCurrency(payment.split_influencer_value) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {payment.product_type}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </GlassCard>
      </div>
    </AdminLayout>
  );
};

export default AdminPagamentosPix;
