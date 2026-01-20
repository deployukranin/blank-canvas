import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, BellOff, Check, CheckCheck, Trash2, MessageCircle, ThumbsUp, 
  ChevronLeft, Filter, BellRing
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityNotifications } from '@/hooks/use-community-notifications';
import { AuthModal } from '@/components/auth/AuthModal';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Agora mesmo';
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'comment':
      return <MessageCircle className="w-4 h-4" />;
    case 'vote':
      return <ThumbsUp className="w-4 h-4" />;
    case 'reply':
      return <MessageCircle className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'comment':
      return 'from-blue-500 to-cyan-500';
    case 'vote':
      return 'from-green-500 to-emerald-500';
    case 'reply':
      return 'from-purple-500 to-pink-500';
    default:
      return 'from-primary to-accent';
  }
};

const NotificacoesPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll 
  } = useCommunityNotifications();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  if (!isAuthenticated) {
    return (
      <MobileLayout title="Notificações">
        <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <BellOff className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">Faça login para ver notificações</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Entre na sua conta para acompanhar comentários e votos nas suas ideias
            </p>
            <Button
              onClick={() => setShowAuthModal(true)}
              className="gap-3 bg-primary hover:bg-primary/90 font-medium h-12 px-8"
            >
              Fazer login
            </Button>
          </motion.div>

          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Notificações">
      <div className="px-4 py-6 space-y-4">
        {/* Header with stats */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <BellRing className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold">Suas Notificações</h2>
                  <p className="text-xs text-muted-foreground">
                    {unreadCount > 0 
                      ? `${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}`
                      : 'Tudo em dia!'
                    }
                  </p>
                </div>
              </div>
              <Badge variant={unreadCount > 0 ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                {notifications.length}
              </Badge>
            </div>
          </GlassCard>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('all')}
            className="flex-1"
          >
            <Filter className="w-4 h-4 mr-2" />
            Todas
          </Button>
          <Button 
            variant={filter === 'unread' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('unread')}
            className="flex-1"
          >
            <Bell className="w-4 h-4 mr-2" />
            Não lidas ({unreadCount})
          </Button>
        </motion.div>

        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex gap-2"
          >
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs flex-1"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              className="text-xs text-destructive hover:text-destructive flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpar todas
            </Button>
          </motion.div>
        )}

        {/* Notifications List */}
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <GlassCard 
                    className={`p-4 cursor-pointer transition-all ${
                      !notification.read 
                        ? 'ring-1 ring-accent/50 bg-accent/5' 
                        : 'opacity-80'
                    }`}
                    hover
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                      navigate('/comunidade');
                    }}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getNotificationColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                        {notification.fromAvatar ? (
                          <span className="text-sm">{notification.fromAvatar}</span>
                        ) : (
                          getNotificationIcon(notification.type)
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm">
                              <span className="font-semibold">@{notification.fromUsername}</span>
                              {' '}{notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              "{notification.ideaTitle}"
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <GlassCard className="p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">
                  {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'unread' 
                    ? 'Você está em dia com todas as notificações!'
                    : 'Quando alguém comentar ou votar nas suas ideias, você verá aqui'
                  }
                </p>
                <Link to="/comunidade">
                  <Button variant="outline" className="mt-4">
                    Explorar a comunidade
                  </Button>
                </Link>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
};

export default NotificacoesPage;
