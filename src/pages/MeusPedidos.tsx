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
  Loader2,
  CreditCard,
  MessageCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useNotifications } from '@/hooks/use-notifications';
import { supabase } from '@/integrations/supabase/client';
import { OrderChat } from '@/components/orders/OrderChat';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';

interface DBOrder {
  id: string;
  product_type: string;
  category: string;
  category_name: string | null;
  customer_name: string;
  duration_minutes: number | null;
  duration_label: string | null;
  amount_cents: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  observations: string | null;
  preferences: string | null;
  triggers: string | null;
  script: string | null;
  correlation_id: string;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; labelKey: string; color: string }> = {
  pending: { 
    icon: <CreditCard className="w-4 h-4" />, 
    label: 'Aguardando Pagamento', 
    labelKey: 'orders.awaitingPayment',
    color: 'text-yellow-500 bg-yellow-500/10' 
  },
  paid: { 
    icon: <CheckCircle2 className="w-4 h-4" />, 
    label: 'Pagamento Confirmado', 
    labelKey: 'orders.paymentConfirmed',
    color: 'text-blue-500 bg-blue-500/10' 
  },
  processing: { 
    icon: <Sparkles className="w-4 h-4" />, 
    label: 'Em Produção', 
    labelKey: 'orders.inProduction',
    color: 'text-purple-500 bg-purple-500/10' 
  },
  completed: { 
    icon: <PlayCircle className="w-4 h-4" />, 
    label: 'Concluído', 
    labelKey: 'orders.completed',
    color: 'text-green-500 bg-green-500/10' 
  },
  cancelled: { 
    icon: <Download className="w-4 h-4" />, 
    label: 'Cancelado', 
    labelKey: 'orders.cancelled',
    color: 'text-muted-foreground bg-muted/10' 
  },
};

const getProgressPercentage = (status: string): number => {
  switch (status) {
    case 'pending': return 10;
    case 'paid': return 35;
    case 'processing': return 65;
    case 'completed': return 100;
    case 'cancelled': return 0;
    default: return 0;
  }
};

const MeusPedidosPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { basePath, isTenantScope } = useTenant();
  const { permission, isSupported, requestPermission } = useNotifications();
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DBOrder | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [hasChatMessages, setHasChatMessages] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const profilePath = isTenantScope ? `${basePath}/profile` : '/profile';

  const isBR = i18n.language?.startsWith('pt');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(isTenantScope ? `${basePath}/login` : '/auth', { replace: true });
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['completed', 'cancelled'].includes(order.status);
    if (filter === 'completed') return order.status === 'completed';
    return true;
  });

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  const handleViewDetails = (order: DBOrder) => {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isBR ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat(isBR ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: isBR ? 'BRL' : 'USD',
    }).format(cents / 100);
  };

  const getStatus = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

  if (isLoading) {
    return (
      <MobileLayout title={t('orders.myOrders', 'Meus Pedidos')}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title={t('orders.myOrders', 'Meus Pedidos')}>
      <div className="px-4 py-6 space-y-6">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link to={profilePath} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t('orders.backToProfile', 'Voltar ao Perfil')}</span>
          </Link>
        </motion.div>

        {/* Notification Banner */}
        {isSupported && permission !== 'granted' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{t('orders.enableNotifications', 'Ative as notificações')}</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('orders.notificationDesc', 'Receba um aviso quando seu pedido estiver pronto!')}
                  </p>
                  <Button size="sm" onClick={handleEnableNotifications} className="h-8 text-xs">
                    {t('orders.activateNotifications', 'Ativar Notificações')}
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                filter === f ? 'bg-primary text-primary-foreground' : 'glass hover:bg-white/10'
              }`}
            >
              {f === 'all' ? t('orders.all', 'Todos') : f === 'active' ? t('orders.active', 'Ativos') : t('orders.completed', 'Concluídos')}
            </button>
          ))}
        </motion.div>

        {/* Orders List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => {
                const st = getStatus(order.status);
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <GlassCard className="p-4 cursor-pointer" hover onClick={() => handleViewDetails(order)}>
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          order.product_type === 'video' 
                            ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' 
                            : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
                        }`}>
                          {order.product_type === 'video' ? (
                            <Video className="w-6 h-6 text-purple-400" />
                          ) : (
                            <Music className="w-6 h-6 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {order.category_name || order.category}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {order.duration_label ? `${order.duration_label} • ` : ''}
                            {formatDate(order.created_at)}
                          </p>
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>
                            {st.icon}
                            {t(st.labelKey, st.label)}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-primary mb-1">
                            {formatCurrency(order.amount_cents)}
                          </p>
                          <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {!['completed', 'cancelled'].includes(order.status) && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{t('orders.progress', 'Progresso')}</span>
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
                );
              })
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{t('orders.noOrders', 'Nenhum pedido encontrado')}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t('orders.noOrdersDesc', 'Você ainda não fez nenhum pedido personalizado.')}
                </p>
                <Link to={isTenantScope ? `${basePath}/customs` : '/customs'}>
                  <Button className="bg-gradient-to-r from-primary to-accent">
                    {t('orders.makeFirstOrder', 'Fazer Primeiro Pedido')}
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
          {selectedOrder && (() => {
            const st = getStatus(selectedOrder.status);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedOrder.product_type === 'video' ? (
                      <Video className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Music className="w-5 h-5 text-blue-400" />
                    )}
                    {t('orders.orderDetails', 'Detalhes do Pedido')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('orders.orderNumber', 'Pedido')} #{selectedOrder.correlation_id.slice(0, 8)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${st.color}`}>
                      {st.icon}
                      {t(st.labelKey, st.label)}
                    </div>
                  </div>

                  {/* Pending payment message */}
                  {selectedOrder.status === 'pending' && (
                    <GlassCard className="p-4 bg-yellow-500/10 border-yellow-500/20">
                      <div className="flex items-start gap-3">
                        <CreditCard className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm text-yellow-500 mb-1">
                            {t('orders.awaitingPaymentTitle', 'Confirmando Pagamento')}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {t('orders.awaitingPaymentDesc', 'Seu pagamento está sendo verificado. Assim que for confirmado, a produção será iniciada.')}
                          </p>
                        </div>
                      </div>
                    </GlassCard>
                  )}

                  {/* Order Info */}
                  <GlassCard className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('orders.category', 'Categoria')}</span>
                      <span className="font-medium">{selectedOrder.category_name || selectedOrder.category}</span>
                    </div>
                    {selectedOrder.duration_label && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('orders.duration', 'Duração')}</span>
                        <span className="font-medium">{selectedOrder.duration_label}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('orders.price', 'Preço')}</span>
                      <span className="font-bold text-primary">{formatCurrency(selectedOrder.amount_cents)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('orders.orderDate', 'Data do pedido')}</span>
                      <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
                    </div>
                  </GlassCard>

                  {/* Personalization Details */}
                  {(selectedOrder.triggers || selectedOrder.script || selectedOrder.observations || selectedOrder.preferences) && (
                    <GlassCard className="p-4">
                      <h4 className="font-semibold text-sm mb-3">{t('orders.personalization', 'Personalização')}</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('orders.name', 'Nome')}:</span>
                          <span className="ml-2">{selectedOrder.customer_name}</span>
                        </div>
                        {selectedOrder.triggers && (
                          <div>
                            <span className="text-muted-foreground">Triggers:</span>
                            <p className="mt-1 text-muted-foreground/80">{selectedOrder.triggers}</p>
                          </div>
                        )}
                        {selectedOrder.script && (
                          <div>
                            <span className="text-muted-foreground">{t('orders.script', 'Roteiro')}:</span>
                            <p className="mt-1 text-muted-foreground/80">{selectedOrder.script}</p>
                          </div>
                        )}
                        {selectedOrder.preferences && (
                          <div>
                            <span className="text-muted-foreground">{t('orders.preferences', 'Preferências')}:</span>
                            <p className="mt-1 text-muted-foreground/80">{selectedOrder.preferences}</p>
                          </div>
                        )}
                        {selectedOrder.observations && (
                          <div>
                            <span className="text-muted-foreground">{t('orders.observations', 'Observações')}:</span>
                            <p className="mt-1 text-muted-foreground/80">{selectedOrder.observations}</p>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default MeusPedidosPage;
