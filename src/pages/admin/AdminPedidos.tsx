import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle, Clock, XCircle, Upload, Video, Music, Play, MessageCircle, CreditCard, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { OrderChat } from '@/components/orders/OrderChat';
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
  triggers: string | null;
  script: string | null;
  user_id: string | null;
  payment_proof_url: string | null;
}

const AdminPedidos: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { store } = useTenant();
  const storeId = store?.id ?? null;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'audio'>('all');
  
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedOrderForUpload, setSelectedOrderForUpload] = useState<Order | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [showProofDialog, setShowProofDialog] = useState(false);

  const isBR = i18n.language?.startsWith('pt');
  const currencySymbol = isBR ? 'R$' : '$';

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('custom_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      } else {
        // No store context — show nothing (avoids leaking other stores' history)
        setOrders([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(t('orders.loadError', 'Erro ao carregar pedidos'));
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
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }
      if (newStatus === 'completed') {
        updateData.delivered_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('custom_orders')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      setOrders(orders.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      ));
      toast.success(t('orders.statusUpdated', 'Status atualizado'));
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('orders.statusUpdateError', 'Erro ao atualizar status'));
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

  const handleViewProof = async (order: Order) => {
    if (order.payment_proof_url) {
      const { data } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(order.payment_proof_url, 300);
      if (data?.signedUrl) {
        setProofUrl(data.signedUrl);
        setShowProofDialog(true);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400">{t('orders.awaitingPayment', 'Aguardando Pagamento')}</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-500/20 text-emerald-400">{t('orders.paymentConfirmed', 'Pagamento Confirmado')}</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-400">{t('orders.processing', 'Em Produção')}</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400">{t('orders.completed', 'Concluído')}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400">{t('orders.cancelled', 'Cancelado')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'video':
        return <Badge variant="outline" className="gap-1"><Video className="w-3 h-3" /> {t('orders.video', 'Vídeo')}</Badge>;
      case 'audio':
        return <Badge variant="outline" className="gap-1"><Music className="w-3 h-3" /> {t('orders.audio', 'Áudio')}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(isBR ? 'pt-BR' : 'en-US', {
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
  };

  if (isLoading) {
    return (
      <AdminLayout title={t('orders.title', 'Pedidos')}>
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">{t('common.loading', 'Carregando...')}</p>
        </GlassCard>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('orders.title', 'Pedidos')}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4 text-center">
            <CreditCard className="w-6 h-6 mx-auto text-yellow-400 mb-2" />
            <p className="text-xl font-bold">{orderStats.pending}</p>
            <p className="text-xs text-muted-foreground">{t('orders.awaitingPayment', 'Aguardando Pagamento')}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
            <p className="text-xl font-bold">{orderStats.paid}</p>
            <p className="text-xs text-muted-foreground">{t('orders.paymentConfirmed', 'Pagamento Confirmado')}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto text-blue-400 mb-2" />
            <p className="text-xl font-bold">{orderStats.processing}</p>
            <p className="text-xs text-muted-foreground">{t('orders.inProduction', 'Em Produção')}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-green-400 mb-2" />
            <p className="text-xl font-bold">{orderStats.completed}</p>
            <p className="text-xs text-muted-foreground">{t('orders.completed', 'Concluídos')}</p>
          </GlassCard>
        </div>

        <GlassCard className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('orders.searchPlaceholder', 'Buscar pedidos...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('orders.allStatuses', 'Todos os status')}</SelectItem>
                <SelectItem value="pending">{t('orders.awaitingPayment', 'Aguardando Pagamento')}</SelectItem>
                <SelectItem value="paid">{t('orders.paymentConfirmed', 'Pagamento Confirmado')}</SelectItem>
                <SelectItem value="processing">{t('orders.processing', 'Em Produção')}</SelectItem>
                <SelectItem value="completed">{t('orders.completed', 'Concluído')}</SelectItem>
                <SelectItem value="cancelled">{t('orders.cancelled', 'Cancelado')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder={t('contentAdmin.type', 'Tipo')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('orders.allTypes', 'Todos os tipos')}</SelectItem>
                <SelectItem value="video">{t('orders.video', 'Vídeo')}</SelectItem>
                <SelectItem value="audio">{t('orders.audio', 'Áudio')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCard>

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
                      {t('orders.client', 'Cliente')}: {order.customer_name}
                    </p>
                    {(order.observations || order.preferences) && (
                      <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                        📝 {order.observations || order.preferences}
                      </p>
                    )}
                    {(order.triggers || order.script) && (
                      <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted/50 rounded space-y-1">
                        {order.triggers && <p>🎯 Triggers: {order.triggers}</p>}
                        {order.script && <p>📄 {t('orders.script', 'Roteiro')}: {order.script}</p>}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold text-primary">
                      {currencySymbol} {(order.amount_cents / 100).toFixed(2)}
                    </p>
                    
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => setChatOrder(order)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </Button>

                      {/* View payment proof */}
                      {order.payment_proof_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleViewProof(order)}
                        >
                          <Eye className="w-4 h-4" />
                          {t('orders.viewProof', 'Ver Comprovante')}
                        </Button>
                      )}

                      {/* PENDING: Confirm Payment + Cancel */}
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 gap-1"
                            onClick={() => handleStatusChange(order.id, 'paid')}
                          >
                            <CreditCard className="w-4 h-4" />
                            {t('orders.confirmPayment', 'Confirmar Pagamento')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-400 border-red-400/50"
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                          >
                            {t('orders.cancel', 'Cancelar')}
                          </Button>
                        </>
                      )}

                      {/* PAID: Start Production */}
                      {order.status === 'paid' && (
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => handleStatusChange(order.id, 'processing')}
                        >
                          <Play className="w-4 h-4" />
                          {t('orders.start', 'Iniciar Produção')}
                        </Button>
                      )}

                      {/* PROCESSING: Deliver */}
                      {order.status === 'processing' && (
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 gap-2"
                          onClick={() => handleDeliverVideo(order)}
                        >
                          <Upload className="w-4 h-4" />
                          {t('orders.deliver', 'Entregar')}
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
            <p className="text-muted-foreground">{t('orders.noOrders', 'Nenhum pedido encontrado')}</p>
          </GlassCard>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="glass max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOrderForUpload?.product_type === 'video' ? (
                <Video className="w-5 h-5 text-purple-400" />
              ) : (
                <Music className="w-5 h-5 text-blue-400" />
              )}
              {selectedOrderForUpload?.product_type === 'video' ? t('orders.deliverVideo', 'Entregar Vídeo') : t('orders.deliverAudio', 'Entregar Áudio')}
            </DialogTitle>
            <DialogDescription>
              {t('orders.orderFrom', { name: selectedOrderForUpload?.customer_name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <GlassCard className="p-4">
              <h4 className="font-semibold mb-2">{selectedOrderForUpload?.category_name || selectedOrderForUpload?.category}</h4>
              {(selectedOrderForUpload?.observations || selectedOrderForUpload?.preferences) && (
                <p className="text-sm text-muted-foreground">
                  {selectedOrderForUpload?.observations || selectedOrderForUpload?.preferences}
                </p>
              )}
            </GlassCard>
            {uploadedVideoUrl ? (
              <div className="rounded-lg overflow-hidden">
                <VideoPlayer videoUrl={uploadedVideoUrl} title={t('orders.videoPreview', 'Preview')} />
              </div>
            ) : (
              <GlassCard 
                className="p-8 text-center cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-2">
                  {selectedOrderForUpload?.product_type === 'video' ? t('orders.clickToUploadVideo', 'Clique para enviar o vídeo') : t('orders.clickToUploadAudio', 'Clique para enviar o áudio')}
                </p>
              </GlassCard>
            )}
            <input ref={fileInputRef} type="file" accept={selectedOrderForUpload?.product_type === 'video' ? 'video/*' : 'audio/*'} className="hidden" onChange={handleFileUpload} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>{t('common.cancel', 'Cancelar')}</Button>
              <Button disabled={!uploadedVideoUrl || isUploading} onClick={handleConfirmDelivery} className="bg-green-500 hover:bg-green-600">
                {t('orders.confirmDelivery', 'Confirmar Entrega')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Proof Dialog */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="glass max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('orders.paymentProof', 'Comprovante de Pagamento')}</DialogTitle>
          </DialogHeader>
          {proofUrl && (
            <div className="mt-4">
              <img src={proofUrl} alt="Comprovante" className="w-full rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Chat Dialog */}
      <Dialog open={!!chatOrder} onOpenChange={(open) => { if (!open) setChatOrder(null); }}>
        <DialogContent className="glass max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Chat - {chatOrder?.customer_name}
            </DialogTitle>
            <DialogDescription>
              {t('orders.orderNumber', 'Pedido')}: {chatOrder?.category_name || chatOrder?.category} • {chatOrder?.correlation_id.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          {chatOrder && (
            <OrderChat orderId={chatOrder.id} customerName={chatOrder.customer_name} />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPedidos;
