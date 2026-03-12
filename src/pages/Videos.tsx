import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Check, 
  Clock, 
  Tag, 
  ShieldCheck, 
  ShieldX, 
  Send,
  Sparkles,
  Info
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { onCustomOrder, onPurchase, trackEvent } from '@/lib/integrations';
import { addOrder, VideoOrder } from '@/lib/order-store';
import { VideoPlayer, VideoPlaceholder } from '@/components/video/VideoPlayer';
import { 
  getVideoConfig, 
  calculatePrice, 
  type VideoConfig, 
  type VideoDuration, 
  type VideoCategory 
} from '@/lib/video-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const VideosPage = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<VideoDuration | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPersonalizationDialog, setShowPersonalizationDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [personalizationData, setPersonalizationData] = useState({
    name: '',
    triggers: '',
    script: '',
    observations: '',
  });

  useEffect(() => {
    setConfig(getVideoConfig());
  }, []);

  const handleSelectCategory = (category: VideoCategory) => {
    setSelectedCategory(category);
  };

  const handleSelectDuration = (duration: VideoDuration) => {
    setSelectedDuration(duration);
  };

  const handleBuyClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!selectedCategory || !selectedDuration) {
      toast({ 
        title: 'Selecione categoria e duração', 
        description: 'Escolha uma categoria e o tempo do vídeo para continuar.',
        variant: 'destructive' 
      });
      return;
    }
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedCategory || !selectedDuration || !config) return;

    setIsProcessing(true);
    const finalPrice = calculatePrice(selectedDuration);

    const result = await onPurchase({
      productId: `custom-video-${selectedCategory.id}-${selectedDuration.id}`,
      productType: 'custom_video',
      amount: finalPrice,
      currency: 'BRL',
    });

    if (result.success) {
      setShowPaymentDialog(false);
      setShowPersonalizationDialog(true);
      trackEvent('video_payment_completed', { 
        category: selectedCategory.id,
        duration: selectedDuration.id,
        price: finalPrice
      });
    } else {
      toast({
        title: 'Erro no pagamento',
        description: 'Tente novamente ou use outro método de pagamento.',
        variant: 'destructive',
      });
    }

    setIsProcessing(false);
  };

  const handleSubmitPersonalization = async () => {
    if (!selectedCategory || !selectedDuration || !config) return;

    if (!personalizationData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe seu nome para personalização.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    const orderResult = await onCustomOrder({
      type: 'video',
      category: selectedCategory.id,
      categoryName: selectedCategory.name,
      duration: selectedDuration.minutes,
      durationLabel: selectedDuration.label,
      price: calculatePrice(selectedDuration),
      ...personalizationData,
      status: 'pending',
    });

    // Save to local order store
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (config?.deliveryDays || 7));
    
    addOrder<VideoOrder>({
      type: 'video',
      category: selectedCategory.id,
      categoryName: selectedCategory.name,
      categoryIcon: selectedCategory.icon,
      duration: selectedDuration.minutes,
      durationLabel: selectedDuration.label,
      price: calculatePrice(selectedDuration),
      status: 'pending',
      estimatedDelivery: deliveryDate.toISOString().split('T')[0],
      personalization: {
        name: personalizationData.name,
        triggers: personalizationData.triggers,
        script: personalizationData.script,
        observations: personalizationData.observations,
      },
    });

    trackEvent('video_order_submitted', { 
      category: selectedCategory.id,
      duration: selectedDuration.id 
    });

    setShowPersonalizationDialog(false);
    setShowSuccessDialog(true);
    setIsProcessing(false);
  };

  const resetOrder = () => {
    setSelectedCategory(null);
    setSelectedDuration(null);
    setShowSuccessDialog(false);
    setPersonalizationData({ name: '', triggers: '', script: '', observations: '' });
  };

  const finalPrice = selectedDuration 
    ? calculatePrice(selectedDuration) 
    : 0;

  if (!config) {
    return (
      <MobileLayout title="Vídeos Personalizados">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Vídeos Personalizados">
      <div className="px-4 py-6 space-y-6">
        {/* Video Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="overflow-hidden p-0">
            {config.previewVideoUrl ? (
              <VideoPlayer
                videoUrl={config.previewVideoUrl}
                title={config.previewTitle}
                description={config.previewDescription}
              />
            ) : (
              <VideoPlaceholder
                title={config.previewTitle}
                description={config.previewDescription}
              />
            )}
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-1">{config.previewTitle}</h3>
              <p className="text-xs text-muted-foreground">{config.previewDescription}</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Rules Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="rules" className="border-none">
              <AccordionTrigger className="glass rounded-xl px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">Regras do Conteúdo</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-3">
                <div className="space-y-3">
                  {/* Allowed */}
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      <h4 className="font-semibold text-sm text-green-500">O que pode</h4>
                    </div>
                    <ul className="space-y-2">
                      {config.rules.allowed.map((rule, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </GlassCard>

                  {/* Not Allowed */}
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldX className="w-5 h-5 text-red-500" />
                      <h4 className="font-semibold text-sm text-red-500">O que NÃO pode</h4>
                    </div>
                    <ul className="space-y-2">
                      {config.rules.notAllowed.map((rule, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0">✕</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

        <AdPlaceholder format="horizontal" className="my-4" />

        {/* Categories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Escolha a Categoria</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {config.categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <GlassCard
                  className={`p-4 text-center cursor-pointer transition-all ${
                    selectedCategory?.id === category.id 
                      ? 'ring-2 ring-primary bg-primary/10' 
                      : 'hover:bg-white/5'
                  }`}
                  onClick={() => handleSelectCategory(category)}
                >
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <h4 className="font-semibold text-sm mb-1">{category.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Duration Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Escolha a Duração</h3>
          </div>
          <div className="space-y-2">
            {config.durations.map((duration, index) => {
              const price = calculatePrice(duration);
              return (
                <motion.div
                  key={duration.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                >
                  <GlassCard
                    className={`p-4 cursor-pointer transition-all ${
                      selectedDuration?.id === duration.id 
                        ? 'ring-2 ring-primary bg-primary/10' 
                        : 'hover:bg-white/5'
                    }`}
                    onClick={() => handleSelectDuration(duration)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedDuration?.id === duration.id 
                            ? 'border-primary bg-primary' 
                            : 'border-muted-foreground'
                        }`}>
                          {selectedDuration?.id === duration.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="font-medium text-sm">{duration.label}</span>
                      </div>
                      <span className="font-bold text-primary">
                        R$ {price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Summary & Buy Button */}
        <AnimatePresence>
          {(selectedCategory || selectedDuration) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-20 left-4 right-4 z-40"
            >
              <GlassCard className="p-4 bg-card/95 backdrop-blur-xl border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    {selectedCategory && selectedDuration ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedCategory.name} • {selectedDuration.label}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1">
                        Selecione categoria e duração
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      R$ {finalPrice.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Entrega: {config.deliveryDays} dias
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-accent gap-2 h-12"
                  onClick={handleBuyClick}
                  disabled={!selectedCategory || !selectedDuration}
                >
                  <Sparkles className="w-5 h-5" />
                  Comprar Agora
                </Button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer for fixed bottom bar */}
        {(selectedCategory || selectedDuration) && <div className="h-40" />}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Faça login para pedir vídeos personalizados"
      />

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={() => !isProcessing && setShowPaymentDialog(false)}>
        <DialogContent className="glass mx-4">
          <DialogHeader>
            <DialogTitle>Confirmar Compra</DialogTitle>
            <DialogDescription>
              Revise os detalhes do seu pedido
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="glass rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Categoria:</span>
                <span className="font-medium">{selectedCategory?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duração:</span>
                <span className="font-medium">{selectedDuration?.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entrega:</span>
                <span className="font-medium">{config.deliveryDays} dias úteis</span>
              </div>
              <div className="border-t border-white/10 my-2" />
              <div className="flex justify-between">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg text-primary">
                  R$ {finalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                className="flex-1" 
                onClick={() => setShowPaymentDialog(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-accent"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : 'Pagar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Personalization Dialog */}
      <Dialog open={showPersonalizationDialog} onOpenChange={() => !isProcessing && setShowPersonalizationDialog(false)}>
        <DialogContent className="glass mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Personalize seu Vídeo
            </DialogTitle>
            <DialogDescription>
              Pagamento confirmado! Agora adicione detalhes exclusivos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Seu nome *</label>
              <Input
                placeholder="Como devo te chamar no vídeo?"
                value={personalizationData.name}
                onChange={e => setPersonalizationData(prev => ({ ...prev, name: e.target.value }))}
                className="glass border-white/10"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Triggers preferidos</label>
              <Textarea
                placeholder="Ex: Tapping suave, sussurros, sons de papel..."
                value={personalizationData.triggers}
                onChange={e => setPersonalizationData(prev => ({ ...prev, triggers: e.target.value }))}
                className="glass border-white/10 min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Roteiro ou ideias</label>
              <Textarea
                placeholder="Descreva cenário, frases específicas, história..."
                value={personalizationData.script}
                onChange={e => setPersonalizationData(prev => ({ ...prev, script: e.target.value }))}
                className="glass border-white/10 min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Observações extras</label>
              <Textarea
                placeholder="Algo mais que eu deva saber?"
                value={personalizationData.observations}
                onChange={e => setPersonalizationData(prev => ({ ...prev, observations: e.target.value }))}
                className="glass border-white/10"
              />
            </div>

            <Button
              className="w-full bg-gradient-to-r from-primary to-accent gap-2"
              onClick={handleSubmitPersonalization}
              disabled={isProcessing}
            >
              <Send className="w-4 h-4" />
              {isProcessing ? 'Enviando...' : 'Enviar Pedido'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={resetOrder}>
        <DialogContent className="glass mx-4 text-center">
          <div className="py-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center"
            >
              <Check className="w-10 h-10 text-green-500" />
            </motion.div>
            <h3 className="font-display text-xl font-bold mb-2">Pedido Realizado! 🎉</h3>
            <p className="text-muted-foreground text-sm mb-2">
              Seu vídeo será entregue em até <strong>{config.deliveryDays} dias úteis</strong>.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Você receberá uma notificação quando estiver pronto!
            </p>
            <Button onClick={resetOrder} className="bg-gradient-to-r from-primary to-accent">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default VideosPage;
