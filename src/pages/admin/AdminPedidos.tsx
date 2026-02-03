import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle, Clock, XCircle, Upload, Video, Music, Play } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockAdminOrders, AdminOrder } from '@/lib/admin-mock-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VideoPlayer } from '@/components/video/VideoPlayer';

const AdminPedidos: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>(mockAdminOrders);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'audio'>('all');
  
  // Upload dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedOrderForUpload, setSelectedOrderForUpload] = useState<AdminOrder | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.userName.toLowerCase().includes(search.toLowerCase()) ||
                         order.productName.toLowerCase().includes(search.toLowerCase()) ||
                         order.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesType = typeFilter === 'all' || order.type === typeFilter;
    return matchesSearch && matchesFilter && matchesType;
  });

  const handleStatusChange = (id: string, newStatus: AdminOrder['status']) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status: newStatus } : order
    ));
  };

  const handleDeliverVideo = (order: AdminOrder) => {
    setSelectedOrderForUpload(order);
    setUploadedVideoUrl('');
    setShowUploadDialog(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simula upload - na realidade, faria upload para storage
      const reader = new FileReader();
      reader.onloadend = () => {
        // Use createObjectURL para melhor performance
        const url = URL.createObjectURL(file);
        setUploadedVideoUrl(url);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmDelivery = () => {
    if (selectedOrderForUpload && uploadedVideoUrl) {
      setOrders(orders.map(order => 
        order.id === selectedOrderForUpload.id 
          ? { ...order, status: 'completed' as const, videoUrl: uploadedVideoUrl } 
          : order
      ));
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
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400">Concluído</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400">Cancelado</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'video':
        return <Badge variant="outline" className="gap-1"><Video className="w-3 h-3" /> Vídeo</Badge>;
      case 'audio':
        return <Badge variant="outline" className="gap-1"><Music className="w-3 h-3" /> Áudio</Badge>;
      default:
        return null;
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

  return (
    <AdminLayout title="Gerenciar Pedidos">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-yellow-400 mb-2" />
            <p className="text-xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto text-blue-400 mb-2" />
            <p className="text-xl font-bold">{orders.filter(o => o.status === 'processing').length}</p>
            <p className="text-xs text-muted-foreground">Em Produção</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-green-400 mb-2" />
            <p className="text-xl font-bold">{orders.filter(o => o.status === 'completed').length}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <XCircle className="w-6 h-6 mx-auto text-red-400 mb-2" />
            <p className="text-xl font-bold">{orders.filter(o => o.status === 'cancelled').length}</p>
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
                      <span className="font-mono text-sm text-muted-foreground">{order.id}</span>
                      {getTypeBadge(order.type)}
                      {getStatusBadge(order.status)}
                    </div>
                    <h3 className="font-semibold">{order.productName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {order.userName} ({order.userEmail})
                    </p>
                    {order.details && (
                      <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                        📝 {order.details}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-bold text-primary">
                      R$ {order.price.toFixed(2)}
                    </p>
                    
                    <div className="flex gap-2 flex-wrap">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(order.id, 'processing')}
                          >
                            Iniciar
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
                      {order.status === 'processing' && (
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 gap-2"
                          onClick={() => handleDeliverVideo(order)}
                        >
                          <Upload className="w-4 h-4" />
                          Entregar {order.type === 'video' ? 'Vídeo' : 'Áudio'}
                        </Button>
                      )}
                      {order.status === 'completed' && order.videoUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            setSelectedOrderForUpload(order);
                            setUploadedVideoUrl(order.videoUrl || '');
                            setShowUploadDialog(true);
                          }}
                        >
                          <Play className="w-4 h-4" />
                          Ver Entrega
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
              {selectedOrderForUpload?.type === 'video' ? (
                <Video className="w-5 h-5 text-purple-400" />
              ) : (
                <Music className="w-5 h-5 text-blue-400" />
              )}
              {selectedOrderForUpload?.status === 'completed' 
                ? 'Visualizar Entrega' 
                : `Entregar ${selectedOrderForUpload?.type === 'video' ? 'Vídeo' : 'Áudio'}`
              }
            </DialogTitle>
            <DialogDescription>
              Pedido #{selectedOrderForUpload?.id} - {selectedOrderForUpload?.userName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Order Details */}
            <GlassCard className="p-4">
              <h4 className="font-semibold mb-2">{selectedOrderForUpload?.productName}</h4>
              {selectedOrderForUpload?.details && (
                <p className="text-sm text-muted-foreground">{selectedOrderForUpload.details}</p>
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
                  Clique para fazer upload do {selectedOrderForUpload?.type === 'video' ? 'vídeo' : 'áudio'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedOrderForUpload?.type === 'video' 
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
              accept={selectedOrderForUpload?.type === 'video' ? 'video/*' : 'audio/*'}
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Actions */}
            {selectedOrderForUpload?.status !== 'completed' && (
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPedidos;