import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GlassCard } from '@/components/ui/GlassCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { onSupportRequest } from '@/lib/integrations';
import { toast } from 'sonner';

interface SupportChatProps {
  defaultCategory?: 'payment' | 'vip' | 'custom_order' | 'general';
}

export const SupportChat = ({ defaultCategory = 'general' }: SupportChatProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'payment' | 'vip' | 'custom_order' | 'general'>(defaultCategory);

  const handleOpen = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSupportRequest({
        userId: user?.id,
        userName: user?.username,
        userEmail: user?.email,
        subject: subject.trim(),
        message: message.trim(),
        category,
        priority: category === 'payment' ? 'high' : 'medium',
      });

      if (result.success) {
        setIsSuccess(true);
        toast.success('Mensagem enviada!', {
          description: `Ticket #${result.ticketId?.slice(-8) || 'criado'}`,
        });
        
        // Reset after 2 seconds
        setTimeout(() => {
          setIsSuccess(false);
          setIsOpen(false);
          setSubject('');
          setMessage('');
          setCategory(defaultCategory);
        }, 2000);
      } else {
        toast.error('Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Support request error:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-20 right-4 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
          onClick={handleOpen}
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe"
            >
              <GlassCard className="rounded-t-3xl rounded-b-none p-0 w-full max-w-lg mx-auto">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div>
                    <h3 className="font-display font-semibold">Suporte</h3>
                    <p className="text-xs text-muted-foreground">Como podemos ajudar?</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {isSuccess ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="font-semibold text-lg mb-2">Mensagem Enviada!</h4>
                      <p className="text-sm text-muted-foreground">
                        Responderemos em breve pelo email cadastrado.
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      {/* Category */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Categoria</label>
                        <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">Dúvida Geral</SelectItem>
                            <SelectItem value="payment">Pagamento</SelectItem>
                            <SelectItem value="vip">Acesso VIP</SelectItem>
                            <SelectItem value="custom_order">Pedido Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Subject */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Assunto</label>
                        <Input
                          placeholder="Resumo do problema..."
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Message */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mensagem</label>
                        <Textarea
                          placeholder="Descreva sua dúvida ou problema em detalhes..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* User info */}
                      {user && (
                        <p className="text-xs text-muted-foreground">
                          Responderemos para: <span className="text-foreground">{user.email}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                {!isSuccess && (
                  <div className="p-4 border-t border-white/10">
                    <Button
                      className="w-full gap-2"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !subject.trim() || !message.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Faça login para enviar uma mensagem ao suporte"
      />
    </>
  );
};
