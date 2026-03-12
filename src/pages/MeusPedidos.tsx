import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle2, 
  PlayCircle,
  Video,
  Music,
  ChevronRight,
  Bell,
  Sparkles,
  Download,
  Upload,
  ImageIcon,
  Send,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { supabase } from '@/integrations/supabase/client';
import { 
  getOrders, 
  Order, 
  getStatusLabel, 
  getStatusColor,
  OrderStatus,
  saveOrders
} from '@/lib/order-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VideoPlayer } from '@/components/video/VideoPlayer';

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  confirmed: <CheckCircle2 className="w-4 h-4" />,
  in_production: <Sparkles className="w-4 h-4" />,
  ready: <PlayCircle className="w-4 h-4" />,
  delivered: <Download className="w-4 h-4" />,
};

const MeusPedidosPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { permission, isSupported, requestPermission } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered'>('all');

  // Proof upload state
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [proofOrderId, setProofOrderId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/perfil');
    }
  }, [isAuthenticated, navigate]);

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'active') return order.status !== 'delivered';
    if (filter === 'delivered') return order.status === 'delivered';
    return true;
  });

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const hasMediaUrl = (order: Order): boolean => {
    if (order.type === 'video' && 'videoUrl' in order && order.videoUrl) return true;
    if (order.type === 'audio' && 'audioUrl' in order && order.audioUrl) return true;
    return false;
  };

  const getMediaUrl = (order: Order): string | undefined => {
    if (order.type === 'video' && 'videoUrl' in order) return order.videoUrl;
    if (order.type === 'audio' && 'audioUrl' in order) return order.audioUrl;
    return undefined;
  };

  // Proof upload handlers
  const handleOpenProof = (orderId: string) => {
    setProofOrderId(orderId);
    setProofFile(null);
    setProofPreview(null);
    setShowProofDialog(true);
    setShowDetailsDialog(false);
  };

  const handleProofFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Apenas imagens são aceitas', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande (máx 5MB)', variant: 'destructive' });
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmitProof = async () => {
    if (!proofFile || !proofOrderId) return;

    setIsUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Erro de autenticação', variant: 'destructive' });
      setIsUploading(false);
      return;
    }

    const ext = proofFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('payment-proofs').upload(fileName, proofFile);
    
    if (error) {
      console.error('Upload error:', error);
      toast({ title: 'Erro ao enviar comprovante', description: 'Tente novamente.', variant: 'destructive' });
      setIsUploading(false);
      return;
    }

    const proofStoragePath = fileName;

    // Update payment_proof_url in the database (latest pending order without proof)
    let proofLinkedToBackend = false;
    const { data: pendingOrder, error: findOrderError } = await supabase
      .from('custom_orders')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .is('payment_proof_url', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findOrderError) {
      console.error('Error finding pending order:', findOrderError);
    } else if (pendingOrder?.id) {
      const { error: dbError } = await supabase
        .from('custom_orders')
        .update({ payment_proof_url: proofStoragePath })
        .eq('id', pendingOrder.id)
        .eq('user_id', user.id);

      if (dbError) {
        console.error('DB update error:', dbError);
      } else {
        proofLinkedToBackend = true;
      }
    }

    // Update local order with proof reference
    const allOrders = getOrders();
    const idx = allOrders.findIndex(o => o.id === proofOrderId);
    if (idx !== -1) {
      allOrders[idx] = {
        ...allOrders[idx],
        paymentProofUrl: proofStoragePath,
        updatedAt: new Date().toISOString(),
      } as Order;
      saveOrders(allOrders);
      setOrders([...allOrders]);
    }

    setIsUploading(false);
    setShowProofDialog(false);

    if (proofLinkedToBackend) {
      toast({ 
        title: 'Comprovante enviado! ✅', 
        description: 'Aguarde a validação do pagamento pelo administrador.' 
      });
    } else {
      toast({
        title: 'Comprovante enviado, mas sem vínculo no pedido',
        description: 'Tente novamente em instantes para concluir a validação.',
        variant: 'destructive',
      });
    }
  };

  const orderNeedsProof = (order: Order): boolean => {
    return order.status === 'pending' && !order.paymentProofUrl;
  };

  const orderHasProof = (order: Order): boolean => {
    return !!order.paymentProofUrl;
  };

  return (
    <MobileLayout title="Meus Pedidos">
      <div className="px-4 py-6 space-y-6">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to="/perfil" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar ao Perfil</span>
          </Link>
        </motion.div>

        {/* Notification Banner */}
        {isSupported && permission !== 'granted' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">Ative as notificações</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Receba um aviso quando seu pedido estiver pronto!
                  </p>
                  <Button 
                    size="sm" 
                    onClick={handleEnableNotifications}
                    className="h-8 text-xs"
                  >
                    Ativar Notificações
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          {(['all', 'active', 'delivered'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'glass hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Entregues'}
            </button>
          ))}
        </motion.div>

        {/* Orders List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <GlassCard 
                    className="p-4 cursor-pointer" 
                    hover
                    onClick={() => handleViewDetails(order)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        order.type === 'video' 
                          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' 
                          : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
                      }`}>
                        {order.type === 'video' ? (
                          <Video className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Music className="w-5 h-5 text-blue-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {order.type === 'video' && 'categoryIcon' in order ? order.categoryIcon : '🎬'}
                          </span>
                          <h4 className="font-semibold text-sm truncate">
                            {order.type === 'video' ? (order as any).categoryName : (order as any).categoryName || 'Áudio Personalizado'}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {order.type === 'video' && 'durationLabel' in order 
                            ? `${(order as any).durationLabel} • ` 
                            : ''
                          }
                          {formatDate(order.createdAt)}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {statusIcons[order.status]}
                            {getStatusLabel(order.status)}
                          </div>
                          {orderNeedsProof(order) && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-amber-500 bg-amber-500/10">
                              <AlertCircle className="w-3 h-3" />
                              Enviar comprovante
                            </div>
                          )}
                          {orderHasProof(order) && order.status === 'pending' && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-blue-500 bg-blue-500/10">
                              <CheckCircle2 className="w-3 h-3" />
                              Aguardando validação
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price & Arrow */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary text-sm mb-1">
                          R$ {order.price.toFixed(2).replace('.', ',')}
                        </p>
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                      </div>
                    </div>

                    {/* Progress Bar for active orders */}
                    {order.status !== 'delivered' && order.status !== 'pending' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progresso</span>
                          <span>{getProgressPercentage(order.status)}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getProgressPercentage(order.status)}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* Proof upload CTA for pending orders */}
                    {orderNeedsProof(order) && (
                      <Button
                        size="sm"
                        className="w-full mt-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-2 h-9"
                        onClick={(e) => { e.stopPropagation(); handleOpenProof(order.id); }}
                      >
                        <Upload className="w-4 h-4" />
                        Enviar Comprovante PIX
                      </Button>
                    )}
                  </GlassCard>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Nenhum pedido encontrado</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {filter === 'all' 
                    ? 'Você ainda não fez nenhum pedido personalizado.'
                    : filter === 'active'
                    ? 'Nenhum pedido em andamento.'
                    : 'Nenhum pedido entregue ainda.'}
                </p>
                <Link to="/customs">
                  <Button className="bg-gradient-to-r from-primary to-accent">
                    Fazer Primeiro Pedido
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="glass mx-4 max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedOrder.type === 'video' ? (
                    <Video className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Music className="w-5 h-5 text-blue-400" />
                  )}
                  Detalhes do Pedido
                </DialogTitle>
                <DialogDescription>
                  Pedido #{selectedOrder.id.slice(-8)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Video/Audio Player */}
                {(selectedOrder.status === 'ready' || selectedOrder.status === 'delivered') && hasMediaUrl(selectedOrder) && (
                  <div className="rounded-lg overflow-hidden">
                    {selectedOrder.type === 'video' ? (
                      <VideoPlayer 
                        videoUrl={getMediaUrl(selectedOrder) || ''} 
                        title={(selectedOrder as any).categoryName || 'Seu vídeo personalizado'}
                        description="Aproveite seu conteúdo exclusivo!"
                      />
                    ) : (
                      <GlassCard className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                            <Music className="w-8 h-8 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">Seu Áudio Personalizado</h4>
                            <audio 
                              controls 
                              className="w-full h-10"
                              src={getMediaUrl(selectedOrder)}
                            >
                              Seu navegador não suporta o elemento de áudio.
                            </audio>
                          </div>
                        </div>
                      </GlassCard>
                    )}
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {statusIcons[selectedOrder.status]}
                    {getStatusLabel(selectedOrder.status)}
                  </div>
                </div>

                {/* Proof Status */}
                {selectedOrder.status === 'pending' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Comprovante</span>
                    {orderHasProof(selectedOrder) ? (
                      <span className="text-xs font-medium text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Enviado - Aguardando
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Não enviado
                      </span>
                    )}
                  </div>
                )}

                {/* Order Info */}
                <GlassCard className="p-4 space-y-3">
                  {selectedOrder.type === 'video' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Categoria</span>
                        <span className="font-medium">
                          {(selectedOrder as any).categoryIcon} {(selectedOrder as any).categoryName}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duração</span>
                        <span className="font-medium">{(selectedOrder as any).durationLabel}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preço</span>
                    <span className="font-bold text-primary">
                      R$ {selectedOrder.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data do pedido</span>
                    <span className="font-medium">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  {selectedOrder.estimatedDelivery && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Entrega prevista</span>
                      <span className="font-medium">{formatDate(selectedOrder.estimatedDelivery)}</span>
                    </div>
                  )}
                </GlassCard>

                {/* Personalization Details */}
                {selectedOrder.personalization && (
                  <GlassCard className="p-4">
                    <h4 className="font-semibold text-sm mb-3">Personalização</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nome:</span>
                        <span className="ml-2">{selectedOrder.personalization.name}</span>
                      </div>
                      {selectedOrder.type === 'video' && (selectedOrder as any).personalization?.triggers && (
                        <div>
                          <span className="text-muted-foreground">Triggers:</span>
                          <p className="mt-1 text-muted-foreground/80">{(selectedOrder as any).personalization.triggers}</p>
                        </div>
                      )}
                      {selectedOrder.type === 'video' && (selectedOrder as any).personalization?.script && (
                        <div>
                          <span className="text-muted-foreground">Roteiro:</span>
                          <p className="mt-1 text-muted-foreground/80">{(selectedOrder as any).personalization.script}</p>
                        </div>
                      )}
                      {(selectedOrder as any).personalization?.observations && (
                        <div>
                          <span className="text-muted-foreground">Observações:</span>
                          <p className="mt-1 text-muted-foreground/80">{(selectedOrder as any).personalization.observations}</p>
                        </div>
                      )}
                      {selectedOrder.type === 'audio' && (selectedOrder as any).personalization?.preferences && (
                        <div>
                          <span className="text-muted-foreground">Preferências:</span>
                          <p className="mt-1 text-muted-foreground/80">{(selectedOrder as any).personalization.preferences}</p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                )}

                {/* Proof upload button for pending without proof */}
                {orderNeedsProof(selectedOrder) && (
                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-2"
                    onClick={() => handleOpenProof(selectedOrder.id)}
                  >
                    <Upload className="w-4 h-4" />
                    Enviar Comprovante PIX
                  </Button>
                )}

                {/* Proof sent badge */}
                {orderHasProof(selectedOrder) && selectedOrder.status === 'pending' && (
                  <GlassCard className="p-4 text-center bg-blue-500/5 border-blue-500/20">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-sm font-medium">Comprovante enviado!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aguarde a validação do administrador.
                    </p>
                  </GlassCard>
                )}

                {/* Download Button */}
                {(selectedOrder.status === 'ready' || selectedOrder.status === 'delivered') && hasMediaUrl(selectedOrder) && (
                  <a 
                    href={getMediaUrl(selectedOrder)} 
                    download={`${selectedOrder.type === 'video' ? 'video' : 'audio'}-${selectedOrder.id}.${selectedOrder.type === 'video' ? 'mp4' : 'mp3'}`}
                    className="block"
                  >
                    <Button className="w-full bg-gradient-to-r from-primary to-accent gap-2">
                      <Download className="w-4 h-4" />
                      Baixar {selectedOrder.type === 'video' ? 'Vídeo' : 'Áudio'}
                    </Button>
                  </a>
                )}

                {/* Ready but no media */}
                {(selectedOrder.status === 'ready' || selectedOrder.status === 'delivered') && !hasMediaUrl(selectedOrder) && (
                  <GlassCard className="p-4 text-center bg-primary/5 border-primary/20">
                    <Sparkles className="w-8 h-8 mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium">Seu pedido está pronto!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      O conteúdo será disponibilizado em breve.
                    </p>
                  </GlassCard>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Proof Upload Dialog */}
      <Dialog open={showProofDialog} onOpenChange={() => !isUploading && setShowProofDialog(false)}>
        <DialogContent className="glass mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Enviar Comprovante PIX
            </DialogTitle>
            <DialogDescription>
              Envie o print/screenshot do comprovante de pagamento para validação do administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {proofPreview ? (
              <div className="relative">
                <img 
                  src={proofPreview} 
                  alt="Comprovante" 
                  className="w-full max-h-64 object-contain rounded-lg border border-border" 
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-7 text-xs bg-background/80 backdrop-blur-sm"
                  onClick={() => { setProofFile(null); setProofPreview(null); }}
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 active:border-primary/70 transition-colors">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium block mb-1">Toque para selecionar</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG (máx 5MB)</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleProofFileSelect(e.target.files[0])}
                />
              </label>
            )}
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                className="flex-1" 
                onClick={() => setShowProofDialog(false)} 
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-accent gap-2"
                onClick={handleSubmitProof}
                disabled={isUploading || !proofFile}
              >
                <Send className="w-4 h-4" />
                {isUploading ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

const getProgressPercentage = (status: OrderStatus): number => {
  const percentages: Record<OrderStatus, number> = {
    pending: 10,
    confirmed: 25,
    in_production: 60,
    ready: 90,
    delivered: 100,
  };
  return percentages[status];
};

export default MeusPedidosPage;
