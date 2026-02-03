import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, Zap, Loader2, Copy, Clock, RefreshCw } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { mockVIPBenefits } from '@/lib/mock-data';
import { useVIPSubscription, VIPChargeResult } from '@/hooks/use-vip-subscription';
import { getVipConfig, type VipPlan } from '@/lib/vip-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const VIPPage = () => {
  const { session } = useAuth();
  const isAuthenticated = !!session?.user;
  const { 
    isVIP, 
    isLoading, 
    subscription, 
    createCharge, 
    checkPaymentStatus,
    copyBrCode,
    getDaysRemaining, 
    cancelSubscription,
    refreshSubscription,
  } = useVIPSubscription();
  
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null);
  const [chargeData, setChargeData] = useState<VIPChargeResult | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [vipPlans, setVipPlans] = useState<VipPlan[]>([]);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load VIP config
  useEffect(() => {
    const config = getVipConfig();
    setVipPlans(config.plans);
    if (config.plans.length > 0) {
      setSelectedPlan(config.plans[0]);
    }
  }, []);

  // Poll for payment status
  useEffect(() => {
    if (chargeData?.correlationId && showPaymentDialog) {
      const poll = async () => {
        const status = await checkPaymentStatus(chargeData.correlationId!);
        if (status?.status === 'paid') {
          setPaymentStatus('paid');
          await refreshSubscription();
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
        }
      };

      pollingRef.current = setInterval(poll, 3000);
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [chargeData?.correlationId, showPaymentDialog, checkPaymentStatus, refreshSubscription]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPlanLabel = (type: string) => {
    switch (type) {
      case 'monthly': return '/mês';
      case 'quarterly': return '/trimestre';
      case 'yearly': return '/ano';
      default: return '';
    }
  };

  const getPlanBadgeLabel = (type: string) => {
    switch (type) {
      case 'monthly': return 'Plano Mensal';
      case 'quarterly': return 'Plano Trimestral';
      case 'yearly': return 'Plano Anual';
      default: return '';
    }
  };

  const getDiscountBadge = (plan: VipPlan) => {
    if (plan.type === 'quarterly') return '-16%';
    if (plan.type === 'yearly') return '-17%';
    return null;
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setShowPurchaseDialog(true);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    const result = await createCharge(selectedPlan.type as 'monthly' | 'yearly');
    setIsProcessing(false);
    
    if (result.success) {
      setChargeData(result);
      setPaymentStatus('pending');
      setShowPurchaseDialog(false);
      setShowPaymentDialog(true);
    }
  };

  const handleCopyCode = async () => {
    if (chargeData?.brCode) {
      await copyBrCode(chargeData.brCode);
    }
  };

  const handleClosePayment = () => {
    setShowPaymentDialog(false);
    setChargeData(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
  };

  // Get featured plan (monthly for hero display)
  const featuredPlan = vipPlans.find(p => p.type === 'monthly') || vipPlans[0];

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
                {getPlanBadgeLabel(subscription.plan_type)}
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

            {featuredPlan && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-muted-foreground line-through">
                  {formatCurrency(featuredPlan.price * 2)}
                </span>
                <span className="font-display text-3xl font-bold text-vip">
                  {formatCurrency(featuredPlan.price)}
                </span>
                <span className="text-muted-foreground">{getPlanLabel(featuredPlan.type)}</span>
              </div>
            )}

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

      {/* Purchase Dialog - Plan Selection */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="glass mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-vip" />
              Assinar VIP
            </DialogTitle>
            <DialogDescription>
              Escolha seu plano e pague via PIX
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Plan Selection */}
            <div className={`grid gap-3 ${vipPlans.length === 2 ? 'grid-cols-2' : vipPlans.length >= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
              {vipPlans.map((plan) => {
                const discount = getDiscountBadge(plan);
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                      selectedPlan?.id === plan.id
                        ? 'border-vip bg-vip/10'
                        : 'border-border hover:border-vip/50'
                    }`}
                  >
                    {discount && (
                      <Badge className="absolute -top-2 -right-2 bg-green-500 text-xs">
                        {discount}
                      </Badge>
                    )}
                    <div className="font-semibold text-sm mb-1">{plan.name}</div>
                    <div className="text-lg font-bold text-vip">
                      {formatCurrency(plan.price)}
                    </div>
                    <div className="text-xs text-muted-foreground">{getPlanLabel(plan.type)}</div>
                    {plan.description && (
                      <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {plan.description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedPlan && (
              <div className="p-3 rounded-xl bg-vip/10 border border-vip/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">
                    {selectedPlan.name}
                  </span>
                  <span className="font-bold text-vip">
                    {formatCurrency(selectedPlan.price)}
                  </span>
                </div>
                <div className="space-y-1">
                  {selectedPlan.features.slice(0, 4).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <Check className="w-3 h-3 text-vip flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setShowPurchaseDialog(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-vip to-amber-400 text-vip-foreground"
                onClick={handleConfirmSubscription}
                disabled={isProcessing || !selectedPlan}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  'Gerar PIX'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog - QR Code */}
      <Dialog open={showPaymentDialog} onOpenChange={handleClosePayment}>
        <DialogContent className="glass mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-vip" />
              Pagamento PIX
            </DialogTitle>
            <DialogDescription>
              {paymentStatus === 'paid' 
                ? 'Pagamento confirmado!' 
                : 'Escaneie o QR Code ou copie o código'}
            </DialogDescription>
          </DialogHeader>

          {paymentStatus === 'paid' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Bem-vindo ao VIP! 👑</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sua assinatura foi ativada com sucesso
              </p>
              <Button onClick={handleClosePayment} className="bg-vip text-vip-foreground">
                Ver Benefícios
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* QR Code */}
              {chargeData?.qrCodeImage && (
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl">
                    <img 
                      src={chargeData.qrCodeImage} 
                      alt="QR Code PIX" 
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {/* Amount */}
              <div className="text-center">
                <span className="text-2xl font-bold text-vip">
                  {formatCurrency((chargeData?.amountCents || 0) / 100)}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({getPlanBadgeLabel(chargeData?.planType || 'monthly')})
                </span>
              </div>

              {/* Copy Code Button */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleCopyCode}
              >
                <Copy className="w-4 h-4" />
                Copiar Código PIX
              </Button>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Aguardando pagamento...
              </div>

              {/* Expiration */}
              {chargeData?.expiresAt && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Expira em 15 minutos
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default VIPPage;
