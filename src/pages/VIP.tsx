import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, Zap } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { mockVIPBenefits } from '@/lib/mock-data';
import { onPurchase, onVIPStatusChange, trackEvent } from '@/lib/integrations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const VIPPage = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const VIP_PRICE = 19.90;

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setShowPurchaseDialog(true);
  };

  const handleConfirmSubscription = async () => {
    setIsProcessing(true);

    const result = await onPurchase({
      productId: 'vip-monthly',
      productType: 'vip',
      userId: user?.id,
      amount: VIP_PRICE,
      currency: 'BRL',
    });

    if (result.success) {
      await onVIPStatusChange({
        userId: user!.id,
        action: 'activate',
        subscriptionId: result.orderId,
      });

      trackEvent('vip_subscription', { userId: user?.id });

      toast({
        title: 'Bem-vindo ao VIP! 👑',
        description: 'Sua assinatura foi ativada',
      });
      setShowPurchaseDialog(false);
    }

    setIsProcessing(false);
  };

  return (
    <MobileLayout title="VIP">
      <div className="px-4 py-6 space-y-6">
        {/* Hero VIP */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard glow className="text-center py-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-vip/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-vip to-amber-400 flex items-center justify-center"
            >
              <Crown className="w-10 h-10 text-vip-foreground" />
            </motion.div>

            <h2 className="font-display text-xl font-bold mb-2">
              Assinatura <span className="text-vip">VIP</span>
            </h2>

            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-muted-foreground line-through">R$ 39,90</span>
              <span className="font-display text-3xl font-bold text-vip">
                R$ {VIP_PRICE.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-muted-foreground">/mês</span>
            </div>

            <Button
              onClick={handleSubscribe}
              className="bg-gradient-to-r from-vip to-amber-400 text-vip-foreground gap-2"
            >
              <Zap className="w-4 h-4" />
              Assinar Agora
            </Button>
          </GlassCard>
        </motion.div>

        {/* Benefits */}
        <div>
          <h3 className="font-display font-semibold mb-3">Benefícios</h3>
          <div className="space-y-3">
            {mockVIPBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{benefit.icon}</div>
                    <div>
                      <h4 className="font-semibold text-sm">{benefit.title}</h4>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Discord Info */}
        <GlassCard className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">💬</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Discord VIP</h4>
              <p className="text-xs text-muted-foreground">
                Ao assinar, você recebe cargo especial no Discord com canais exclusivos. 
                O cargo fica ativo enquanto a assinatura for válida.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Faça login para assinar o VIP"
      />

      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="glass mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-vip" />
              Assinar VIP
            </DialogTitle>
            <DialogDescription>
              Confirme sua assinatura mensal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-vip/10 border border-vip/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">VIP Mensal</span>
                <span className="font-bold text-vip">R$ {VIP_PRICE.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="space-y-1">
                {mockVIPBenefits.slice(0, 3).map((b) => (
                  <div key={b.title} className="flex items-center gap-2 text-xs">
                    <Check className="w-3 h-3 text-vip" />
                    <span>{b.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setShowPurchaseDialog(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-vip to-amber-400 text-vip-foreground"
                onClick={handleConfirmSubscription}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default VIPPage;
