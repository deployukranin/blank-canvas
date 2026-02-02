import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Crown, Lock, Star, Gift, Zap, Heart, Video, Music, Image, FileText, Check, Loader2, Copy, Clock, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVIPSubscription, VIPContent, VIPChargeResult } from '@/hooks/use-vip-subscription';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getContentIcon = (type: VIPContent['content_type']) => {
  switch (type) {
    case 'video':
      return <Video className="w-5 h-5 text-vip" />;
    case 'audio':
      return <Music className="w-5 h-5 text-vip" />;
    case 'image':
      return <Image className="w-5 h-5 text-vip" />;
    default:
      return <FileText className="w-5 h-5 text-vip" />;
  }
};

const getBenefitIcon = (icon: string) => {
  switch (icon) {
    case 'star':
      return <Star className="w-5 h-5 text-vip" />;
    case 'gift':
      return <Gift className="w-5 h-5 text-vip" />;
    case 'zap':
      return <Zap className="w-5 h-5 text-vip" />;
    case 'heart':
      return <Heart className="w-5 h-5 text-vip" />;
    default:
      return <Crown className="w-5 h-5 text-vip" />;
  }
};

export const VIPAreaContent = () => {
  const { config } = useWhiteLabel();
  const { session } = useAuth();
  const isAuthenticated = !!session?.user;
  const { 
    isVIP, 
    isLoading, 
    vipContent, 
    subscription, 
    createCharge,
    checkPaymentStatus,
    copyBrCode,
    getDaysRemaining,
    refreshSubscription,
  } = useVIPSubscription();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [chargeData, setChargeData] = useState<VIPChargeResult | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const VIP_MONTHLY_PRICE = 19.90;
  const VIP_YEARLY_PRICE = 199.00;

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

  const handleSubscribeClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setShowSubscribeDialog(true);
  };

  const handleConfirmSubscription = async () => {
    setIsProcessing(true);
    const result = await createCharge(selectedPlan);
    setIsProcessing(false);
    
    if (result.success) {
      setChargeData(result);
      setPaymentStatus('pending');
      setShowSubscribeDialog(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-vip" />
      </div>
    );
  }

  // User is VIP - Show exclusive content
  if (isVIP && subscription) {
    return (
      <div className="space-y-4">
        {/* VIP Status Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-4 bg-gradient-to-br from-vip/20 to-primary/10 border-vip/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-vip to-amber-400 flex items-center justify-center">
                <Crown className="w-6 h-6 text-vip-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Você é VIP!</h3>
                  <Badge variant="secondary" className="bg-vip/20 text-vip text-xs">
                    {subscription.plan_type === 'monthly' ? 'Mensal' : 'Anual'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getDaysRemaining()} dias restantes
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* VIP Content */}
        {vipContent.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-vip" />
              Conteúdo Exclusivo
            </h3>
            {vipContent.map((content, index) => (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-vip/20 flex items-center justify-center flex-shrink-0">
                      {getContentIcon(content.content_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{content.title}</h4>
                        <Badge variant="secondary" className="text-xs bg-vip/10 text-vip">
                          {content.content_type === 'video' ? 'Vídeo' :
                           content.content_type === 'audio' ? 'Áudio' :
                           content.content_type === 'image' ? 'Imagem' : 'Post'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{content.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(content.created_at)}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <GlassCard className="p-6 text-center">
            <Crown className="w-10 h-10 mx-auto mb-3 text-vip/50" />
            <p className="text-sm text-muted-foreground">
              Novos conteúdos exclusivos em breve!
            </p>
          </GlassCard>
        )}
      </div>
    );
  }

  // User is not VIP - Show subscription CTA
  return (
    <>
      <div className="space-y-4">
        {/* Main CTA Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard className="p-6 text-center bg-gradient-to-br from-vip/10 to-primary/5 border-vip/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-vip/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-vip to-amber-400 flex items-center justify-center"
            >
              <Crown className="w-8 h-8 text-vip-foreground" />
            </motion.div>

            <h3 className="font-display font-semibold text-lg mb-2">
              {config.community.vipTitle || 'Área VIP'}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {config.community.vipDescription || 'Acesse conteúdo exclusivo e benefícios especiais.'}
            </p>

            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-muted-foreground line-through text-sm">R$ 39,90</span>
              <span className="font-display text-2xl font-bold text-vip">
                R$ {VIP_MONTHLY_PRICE.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-muted-foreground text-sm">/mês</span>
            </div>

            <Button
              onClick={handleSubscribeClick}
              className="gap-2 bg-gradient-to-r from-vip to-amber-400 text-vip-foreground hover:opacity-90"
            >
              <Zap className="w-4 h-4" />
              {config.community.vipButtonLabel || 'Tornar-se VIP'}
            </Button>
          </GlassCard>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid gap-3">
          {(config.community.vipBenefits || []).map((benefit, index) => (
            <motion.div
              key={benefit.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-vip/20 flex items-center justify-center">
                    {getBenefitIcon(benefit.icon)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{benefit.title}</h4>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Faça login para assinar o VIP"
      />

      {/* Subscribe Dialog - Plan Selection */}
      <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
        <DialogContent className="glass mx-4">
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

            {/* Benefits Summary */}
            <div className="p-3 rounded-xl bg-vip/10 border border-vip/20">
              <div className="text-xs font-medium mb-2">Incluso no VIP:</div>
              <div className="space-y-1">
                {(config.community.vipBenefits || []).slice(0, 4).map((benefit) => (
                  <div key={benefit.id} className="flex items-center gap-2 text-xs">
                    <Check className="w-3 h-3 text-vip" />
                    <span>{benefit.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowSubscribeDialog(false)}
              >
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
                Acessar Conteúdo VIP
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
                  R$ {((chargeData?.amountCents || 0) / 100).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({chargeData?.planType === 'monthly' ? 'Mensal' : 'Anual'})
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
    </>
  );
};
