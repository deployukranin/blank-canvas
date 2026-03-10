import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle, Clock, XCircle, Upload, Video, Music, Play, DollarSign } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { toast } from 'sonner';

interface Order {
  id: string;
  correlation_id: string;
  customer_name: string;
  category: string;
  category_name: string | null;
  product_type: string;
  amount_cents: number;
  status: string;
  created_at: string;
  observations: string | null;
  preferences: string | null;
}

const AdminPedidos: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'audio'>('all');
  
  // Upload dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedOrderForUpload, setSelectedOrderForUpload] = useState<Order | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                         (order.category_name || '').toLowerCase().includes(search.toLowerCase()) ||
                         order.correlation_id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesType = typeFilter === 'all' || order.product_type === typeFilter;
    return matchesSearch && matchesFilter && matchesType;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('custom_orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setOrders(orders.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      ));
      toast.success('Status atualizado');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDeliverVideo = (order: Order) => {
    setSelectedOrderForUpload(order);
    setUploadedVideoUrl('');
    setShowUploadDialog(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const url = URL.createObjectURL(file);
      setUploadedVideoUrl(url);
      setIsUploading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (selectedOrderForUpload && uploadedVideoUrl) {
      await handleStatusChange(selectedOrderForUpload.id, 'completed');
      setShowUploadDialog(false);
      setSelectedOrderForUpload(null);
      setUploadedVideoUrl('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pendente</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-400">Processando</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-500/20 text-emerald-400">Pago</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400">Concluído</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'video':
        return <Badge variant="outline" className="gap-1"><Video className="w-3 h-3" /> Vídeo</Badge>;
      case 'audio':
        return <Badge variant="outline" className="gap-1"><Music className="w-3 h-3" /> Áudio</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const orderStats = {
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  if (isLoading) {
    return (
      <AdminLayout title="Gerenciar Pedidos">
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </GlassCard>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gerenciar Pedidos">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-yellow-400 mb-2" />
            <p className="text-xl font-bold">{orderStats.pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto text-blue-400 mb-2" />
            <p className="text-xl font-bold">{orderStats.processing}</p>
            <p className="text-xs text-muted-foreground">Em Produção</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-green-400 mb-2" />
            <p className="text-xl font-bold">{orderStats.completed}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <XCircle className="w-6 h-6 mx-auto text-red-400 mb-2" />
            <p className="text-xl font-bold">{orderStats.cancelled}</p>
            <p className="text-xs text-muted-foreground">Cancelados</p>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, produto ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="audio">Áudio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCard>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-sm text-muted-foreground">{order.correlation_id.slice(0, 8)}...</span>
                      {getTypeBadge(order.product_type)}
                      {getStatusBadge(order.status)}
                    </div>
                    <h3 className="font-semibold">{order.category_name || order.category}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {order.customer_name}
                    </p>
                    {(order.observations || order.preferences) && (
                      <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                        📝 {order.observations || order.preferences}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold text-primary">
                      R$ {(order.amount_cents / 100).toFixed(2)}
                    </p>
                    
                    <div className="flex gap-2 flex-wrap">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="gap-1"
                            variant="outline"
                            onClick={() => handleStatusChange(order.id, 'paid')}
                          >
                            <DollarSign className="w-4 h-4" />
                            Confirmar Pagamento
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-400 border-red-400/50"
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                      {order.status === 'paid' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(order.id, 'processing')}
                        >
                          Iniciar Produção
                        </Button>
                      )}
                      {order.status === 'processing' && (
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 gap-2"
                          onClick={() => handleDeliverVideo(order)}
                        >
                          <Upload className="w-4 h-4" />
                          Entregar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum pedido encontrado</p>
          </GlassCard>
        )}
      </div>

      {/* Upload/Delivery Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="glass max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOrderForUpload?.product_type === 'video' ? (
                <Video className="w-5 h-5 text-purple-400" />
              ) : (
                <Music className="w-5 h-5 text-blue-400" />
              )}
              Entregar {selectedOrderForUpload?.product_type === 'video' ? 'Vídeo' : 'Áudio'}
            </DialogTitle>
            <DialogDescription>
              Pedido de {selectedOrderForUpload?.customer_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Order Details */}
            <GlassCard className="p-4">
              <h4 className="font-semibold mb-2">{selectedOrderForUpload?.category_name || selectedOrderForUpload?.category}</h4>
              {(selectedOrderForUpload?.observations || selectedOrderForUpload?.preferences) && (
                <p className="text-sm text-muted-foreground">
                  {selectedOrderForUpload?.observations || selectedOrderForUpload?.preferences}
                </p>
              )}
            </GlassCard>

            {/* Video Preview */}
            {uploadedVideoUrl ? (
              <div className="rounded-lg overflow-hidden">
                <VideoPlayer 
                  videoUrl={uploadedVideoUrl} 
                  title="Preview do Vídeo"
                />
              </div>
            ) : (
              <GlassCard 
                className="p-8 text-center cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-2">
                  Clique para fazer upload do {selectedOrderForUpload?.product_type === 'video' ? 'vídeo' : 'áudio'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedOrderForUpload?.product_type === 'video' 
                    ? 'Formatos aceitos: MP4, WebM, MOV' 
                    : 'Formatos aceitos: MP3, WAV, OGG'
                  }
                </p>
                {isUploading && (
                  <div className="mt-4">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary animate-pulse w-1/2" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Carregando...</p>
                  </div>
                )}
              </GlassCard>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={selectedOrderForUpload?.product_type === 'video' ? 'video/*' : 'audio/*'}
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowUploadDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                disabled={!uploadedVideoUrl || isUploading}
                onClick={handleConfirmDelivery}
                className="bg-green-500 hover:bg-green-600"
              >
                Confirmar Entrega
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPedidos;
