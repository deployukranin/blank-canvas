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
  Download
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useNotifications } from '@/hooks/use-notifications';
import { 
  getOrders, 
  Order, 
  getStatusLabel, 
  getStatusColor,
  OrderStatus 
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
  const { basePath, isTenantScope } = useTenant();
  const { permission, isSupported, requestPermission } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const profilePath = isTenantScope ? `${basePath}/profile` : '/profile';

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(isTenantScope ? `${basePath}/login` : '/auth', { replace: true });
    }
  }, [isAuthenticated, navigate, basePath, isTenantScope]);

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

  // Check if order has video/audio URL to play
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

  return (
    <MobileLayout title="Meus Pedidos">
      <div className="px-4 py-6 space-y-6">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to={profilePath} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
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
                    Receba um aviso quando seu vídeo personalizado estiver pronto!
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
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        order.type === 'video' 
                          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' 
                          : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
                      }`}>
                        {order.type === 'video' ? (
                          <Video className="w-6 h-6 text-purple-400" />
                        ) : (
                          <Music className="w-6 h-6 text-blue-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">
                            {order.type === 'video' && 'categoryIcon' in order ? order.categoryIcon : '🎬'}
                          </span>
                          <h4 className="font-semibold text-sm truncate">
                            {order.type === 'video' ? (order as any).categoryName : 'Áudio Personalizado'}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {order.type === 'video' && 'durationLabel' in order 
                            ? `${(order as any).durationLabel} • ` 
                            : ''
                          }
                          {formatDate(order.createdAt)}
                        </p>
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {statusIcons[order.status]}
                          {getStatusLabel(order.status)}
                        </div>
                      </div>

                      {/* Price & Arrow */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary mb-1">
                          R$ {order.price.toFixed(2).replace('.', ',')}
                        </p>
                        <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                      </div>
                    </div>

                    {/* Progress Bar for active orders */}
                    {order.status !== 'delivered' && (
                      <div className="mt-4">
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
                <Link to="/videos">
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
                {/* Video/Audio Player - Show when ready or delivered with URL */}
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
                      {selectedOrder.type === 'video' && (selectedOrder as any).personalization?.observations && (
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

                {/* Download Button for Ready/Delivered with media */}
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

                {/* Message when ready but no media yet */}
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
    </MobileLayout>
  );
};

// Helper function to calculate progress percentage
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