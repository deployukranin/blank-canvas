import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, Zap, Loader2 } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { mockVIPBenefits } from '@/lib/mock-data';
import { useVIPSubscription } from '@/hooks/use-vip-subscription';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const VIPPage = () => {
  const { isAuthenticated } = useAuth();
  const { isVIP, isLoading, subscription, subscribe, getDaysRemaining, cancelSubscription } = useVIPSubscription();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const VIP_MONTHLY_PRICE = 19.90;
  const VIP_YEARLY_PRICE = 199.00;

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setShowPurchaseDialog(true);
  };

  const handleConfirmSubscription = async () => {
    setIsProcessing(true);
    await subscribe(selectedPlan);
    setIsProcessing(false);
    setShowPurchaseDialog(false);
  };

  if (isLoading) {
    return (
      <MobileLayout title="VIP">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-vip" />
        </div>
      </MobileLayout>
    );
  }

  // User is already VIP
  if (isVIP && subscription) {
    return (
      <MobileLayout title="VIP">
        <div className="px-4 py-6 space-y-6">
          {/* VIP Status Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard glow className="text-center py-8 relative overflow-hidden bg-gradient-to-br from-vip/20 to-primary/10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-vip/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-vip to-amber-400 flex items-center justify-center"
              >
                <Crown className="w-10 h-10 text-vip-foreground" />
              </motion.div>

              <h2 className="font-display text-xl font-bold mb-2">
                Você é <span className="text-vip">VIP</span>! 👑
              </h2>

              <Badge className="bg-vip/20 text-vip mb-4">
                {subscription.plan_type === 'monthly' ? 'Plano Mensal' : 'Plano Anual'}
              </Badge>

              <p className="text-muted-foreground text-sm mb-2">
                {getDaysRemaining()} dias restantes
              </p>

              <p className="text-xs text-muted-foreground">
                Expira em {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
              </p>
            </GlassCard>
          </motion.div>

          {/* Benefits */}
          <div>
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-vip" />
              Seus Benefícios Ativos
            </h3>
            <div className="space-y-3">
              {mockVIPBenefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard className="p-4 border-vip/20">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{benefit.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{benefit.title}</h4>
                        <p className="text-xs text-muted-foreground">{benefit.description}</p>
                      </div>
                      <Check className="w-5 h-5 text-vip" />
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Cancel Option */}
          <GlassCard className="p-4">
            <p className="text-xs text-muted-foreground mb-3">
              Precisa cancelar? Você ainda terá acesso até o fim do período pago.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => cancelSubscription()}
            >
              Cancelar Assinatura
            </Button>
          </GlassCard>
        </div>
      </MobileLayout>
    );
  }

  // User is not VIP - show subscription page
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
                R$ {VIP_MONTHLY_PRICE.toFixed(2).replace('.', ',')}
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
              Escolha seu plano e aproveite benefícios exclusivos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Plan Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedPlan === 'monthly'
                    ? 'border-vip bg-vip/10'
                    : 'border-border hover:border-vip/50'
                }`}
              >
                <div className="font-semibold text-sm mb-1">Mensal</div>
                <div className="text-lg font-bold text-vip">
                  R$ {VIP_MONTHLY_PRICE.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-xs text-muted-foreground">/mês</div>
              </button>

              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                  selectedPlan === 'yearly'
                    ? 'border-vip bg-vip/10'
                    : 'border-border hover:border-vip/50'
                }`}
              >
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-xs">
                  -17%
                </Badge>
                <div className="font-semibold text-sm mb-1">Anual</div>
                <div className="text-lg font-bold text-vip">
                  R$ {VIP_YEARLY_PRICE.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-xs text-muted-foreground">/ano</div>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-vip/10 border border-vip/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">
                  {selectedPlan === 'monthly' ? 'VIP Mensal' : 'VIP Anual'}
                </span>
                <span className="font-bold text-vip">
                  R$ {(selectedPlan === 'monthly' ? VIP_MONTHLY_PRICE : VIP_YEARLY_PRICE).toFixed(2).replace('.', ',')}
                </span>
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
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default VIPPage;
