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
  Info,
  Video,
  Headphones,
  Pause,
  QrCode
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { onCustomOrder, trackEvent } from '@/lib/integrations';
import { addOrder, VideoOrder } from '@/lib/order-store';
import { VideoPlayer, VideoPlaceholder } from '@/components/video/VideoPlayer';
import { PixQRCode } from '@/components/payment/PixQRCode';
import { usePixConfig } from '@/hooks/use-pix-config';
import { 
  getVideoConfig, 
  calculatePrice,
  calculateAudioPrice,
  type VideoConfig, 
  type VideoDuration, 
  type VideoCategory,
  type AudioCategory,
  type AudioDuration,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CustomsPage = () => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  // Video state
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

  // Audio state
  const [selectedAudioCategory, setSelectedAudioCategory] = useState<AudioCategory | null>(null);
  const [selectedAudioDuration, setSelectedAudioDuration] = useState<AudioDuration | null>(null);
  const [audioFormData, setAudioFormData] = useState({ name: '', preferences: '', observations: '' });
  const [audioOrderComplete, setAudioOrderComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAudioOrderDialog, setShowAudioOrderDialog] = useState(false);

  // Current tab
  const [activeTab, setActiveTab] = useState('videos');

  useEffect(() => {
    setConfig(getVideoConfig());
  }, []);

  // Video handlers
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

    // TODO: Integrar novo meio de pagamento
    toast({
      title: 'Pagamento em implementação',
      description: 'O novo meio de pagamento será integrado em breve.',
    });

    setIsProcessing(false);
    setShowPaymentDialog(false);
    setShowPersonalizationDialog(true);
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

    await onCustomOrder({
      type: 'video',
      category: selectedCategory.id,
      categoryName: selectedCategory.name,
      duration: selectedDuration.minutes,
      durationLabel: selectedDuration.label,
      price: calculatePrice(selectedDuration, selectedCategory),
      name: personalizationData.name,
      triggers: personalizationData.triggers,
      script: personalizationData.script,
      observations: personalizationData.observations,
      status: 'pending',
    });

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (config?.deliveryDays || 7));
    
    addOrder<VideoOrder>({
      type: 'video',
      category: selectedCategory.id,
      categoryName: selectedCategory.name,
      categoryIcon: selectedCategory.icon,
      duration: selectedDuration.minutes,
      durationLabel: selectedDuration.label,
      price: calculatePrice(selectedDuration, selectedCategory),
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

  const resetVideoOrder = () => {
    setSelectedCategory(null);
    setSelectedDuration(null);
    setShowSuccessDialog(false);
    setPersonalizationData({ name: '', triggers: '', script: '', observations: '' });
  };

  // Audio handlers
  const handleSelectAudioCategory = (category: AudioCategory) => {
    setSelectedAudioCategory(category);
  };

  const handleSelectAudioDuration = (duration: AudioDuration) => {
    setSelectedAudioDuration(duration);
  };

  const handleAudioBuyClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!selectedAudioCategory || !selectedAudioDuration) {
      toast({ 
        title: 'Selecione categoria e duração', 
        description: 'Escolha uma categoria e o tempo do áudio para continuar.',
        variant: 'destructive' 
      });
      return;
    }
    setShowAudioOrderDialog(true);
  };

  const handleAudioOrder = async () => {
    if (!selectedAudioCategory || !selectedAudioDuration || !audioFormData.name.trim() || !audioFormData.preferences.trim()) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    await onCustomOrder({
      type: 'audio',
      category: selectedAudioCategory.id,
      categoryName: selectedAudioCategory.name,
      duration: selectedAudioDuration.minutes,
      durationLabel: selectedAudioDuration.label,
      name: audioFormData.name,
      preferences: audioFormData.preferences,
      observations: audioFormData.observations,
      status: 'pending',
    });

    trackEvent('custom_audio_order', { 
      category: selectedAudioCategory.id,
      duration: selectedAudioDuration.id,
    });

    setIsProcessing(false);
    setShowAudioOrderDialog(false);
    setAudioOrderComplete(true);
  };

  const resetAudioOrder = () => {
    setSelectedAudioCategory(null);
    setSelectedAudioDuration(null);
    setAudioFormData({ name: '', preferences: '', observations: '' });
    setAudioOrderComplete(false);
    setShowAudioOrderDialog(false);
  };

  const audioFinalPrice = selectedAudioDuration 
    ? calculateAudioPrice(selectedAudioDuration) 
    : 0;

  const finalPrice = (selectedDuration && selectedCategory)
    ? calculatePrice(selectedDuration, selectedCategory) 
    : 0;
  
  const categorySurcharge = selectedCategory?.surcharge || 0;

  if (!config) {
    return (
      <MobileLayout title="Custom's" hideHeader>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Custom's" hideHeader>
      <div className="px-4 py-6 space-y-6">
        {/* Tabs for Video and Audio */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass">
            <TabsTrigger value="videos" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <Video className="w-4 h-4" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="audios" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <Headphones className="w-4 h-4" />
              Áudios
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab Content */}
          <TabsContent value="videos" className="mt-6 space-y-6">
            {/* Preview Section */}
            {config.previewEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="overflow-hidden p-0">
                  {config.previewType === 'video' && config.previewVideoUrl ? (
                    <VideoPlayer
                      videoUrl={config.previewVideoUrl}
                      title={config.previewTitle}
                      description={config.previewDescription}
                    />
                  ) : config.previewType === 'image' && config.previewImageUrl ? (
                    <div className="aspect-video bg-black">
                      <img 
                        src={config.previewImageUrl} 
                        alt={config.previewTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
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
            )}

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
                      {(category.surcharge || 0) > 0 && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                          +R$ {category.surcharge?.toFixed(2)}
                        </div>
                      )}
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

            {/* Spacer for fixed bottom bar */}
            {(selectedCategory || selectedDuration) && <div className="h-40" />}
          </TabsContent>

          {/* Audios Tab Content */}
          <TabsContent value="audios" className="mt-6 space-y-4">
            {/* Preview Player */}
            {config.audioPreviewEnabled && (
              <GlassCard className="p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">Preview</h3>
                    <p className="text-xs text-muted-foreground">Ouça um exemplo de áudio</p>
                  </div>
                  <div className="flex items-end gap-0.5 h-8">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={isPlaying ? { height: [8, Math.random() * 24 + 8, 8] } : {}}
                        transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.02 }}
                        className="w-1 bg-primary/40 rounded-full"
                        style={{ height: 8 }}
                      />
                    ))}
                  </div>
                </div>
                {config.audioPreviewUrl && (
                  <audio 
                    className="hidden" 
                    src={config.audioPreviewUrl}
                    ref={(audio) => {
                      if (audio) {
                        if (isPlaying) audio.play();
                        else audio.pause();
                      }
                    }}
                    onEnded={() => setIsPlaying(false)}
                  />
                )}
              </GlassCard>
            )}

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Escolha a Categoria</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {config.audioCategories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlassCard
                      className={`p-4 text-center cursor-pointer transition-all ${
                        selectedAudioCategory?.id === category.id 
                          ? 'ring-2 ring-primary bg-primary/10' 
                          : 'hover:bg-white/5'
                      }`}
                      onClick={() => handleSelectAudioCategory(category)}
                    >
                      <div className="text-3xl mb-2">{category.icon}</div>
                      <h4 className="font-semibold text-sm mb-1">{category.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Durations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Escolha a Duração</h3>
              </div>
              <div className="space-y-2">
                {config.audioDurations.map((duration, index) => {
                  const price = calculateAudioPrice(duration);
                  return (
                    <motion.div
                      key={duration.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + index * 0.05 }}
                    >
                      <GlassCard
                        className={`p-4 cursor-pointer transition-all ${
                          selectedAudioDuration?.id === duration.id 
                            ? 'ring-2 ring-primary bg-primary/10' 
                            : 'hover:bg-white/5'
                        }`}
                        onClick={() => handleSelectAudioDuration(duration)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              selectedAudioDuration?.id === duration.id 
                                ? 'border-primary bg-primary' 
                                : 'border-muted-foreground'
                            }`}>
                              {selectedAudioDuration?.id === duration.id && (
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

            {/* Spacer for fixed bottom bar */}
            {(selectedAudioCategory || selectedAudioDuration) && <div className="h-40" />}
          </TabsContent>
        </Tabs>

        {/* Video Summary & Buy Button */}
        <AnimatePresence>
          {activeTab === 'videos' && (selectedCategory || selectedDuration) && (
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

        {/* Audio Summary & Buy Button */}
        <AnimatePresence>
          {activeTab === 'audios' && (selectedAudioCategory || selectedAudioDuration) && (
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
                    {selectedAudioCategory && selectedAudioDuration ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedAudioCategory.name} • {selectedAudioDuration.label}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1">
                        Selecione categoria e duração
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      R$ {audioFinalPrice.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Entrega: 3 dias
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-accent gap-2 h-12"
                  onClick={handleAudioBuyClick}
                  disabled={!selectedAudioCategory || !selectedAudioDuration}
                >
                  <Sparkles className="w-5 h-5" />
                  Comprar Agora
                </Button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Faça login para fazer pedidos personalizados"
      />

      {/* Video Payment Dialog */}
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
                className="flex-1 bg-gradient-to-r from-primary to-accent gap-2"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : 'Confirmar Pedido'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Personalization Dialog */}
      <Dialog open={showPersonalizationDialog} onOpenChange={() => !isProcessing && setShowPersonalizationDialog(false)}>
        <DialogContent className="glass mx-4 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Personalize seu Vídeo</DialogTitle>
            <DialogDescription>
              Preencha os detalhes para criar seu vídeo exclusivo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Seu Nome *</label>
              <Input
                placeholder="Como devo te chamar no vídeo?"
                value={personalizationData.name}
                onChange={(e) => setPersonalizationData(prev => ({ ...prev, name: e.target.value }))}
                className="glass border-white/10"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Triggers Preferidos</label>
              <Input
                placeholder="Ex: sussurro, tapping, mouth sounds..."
                value={personalizationData.triggers}
                onChange={(e) => setPersonalizationData(prev => ({ ...prev, triggers: e.target.value }))}
                className="glass border-white/10"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Roteiro / Ideias</label>
              <Textarea
                placeholder="Descreva o que você gostaria no vídeo..."
                value={personalizationData.script}
                onChange={(e) => setPersonalizationData(prev => ({ ...prev, script: e.target.value }))}
                className="glass border-white/10 min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Observações</label>
              <Textarea
                placeholder="Algo mais que eu deva saber?"
                value={personalizationData.observations}
                onChange={(e) => setPersonalizationData(prev => ({ ...prev, observations: e.target.value }))}
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

      {/* Video Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={resetVideoOrder}>
        <DialogContent className="glass mx-4 text-center">
          <div className="py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">Pedido Confirmado! 🎬</h3>
            <p className="text-muted-foreground text-sm mb-2">
              Seu vídeo personalizado está sendo preparado
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Prazo de entrega: {config?.deliveryDays} dias úteis
            </p>
            <Button 
              onClick={resetVideoOrder}
              className="bg-gradient-to-r from-primary to-accent"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audio Order Dialog */}
      <Dialog open={showAudioOrderDialog} onOpenChange={() => !isProcessing && setShowAudioOrderDialog(false)}>
        <DialogContent className="glass mx-4">
          <DialogHeader>
            <DialogTitle>Pedir Áudio Personalizado</DialogTitle>
            <DialogDescription>
              {selectedAudioCategory?.name} • {selectedAudioDuration?.label} - R$ {audioFinalPrice.toFixed(2).replace('.', ',')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Seu nome *"
              value={audioFormData.name}
              onChange={e => setAudioFormData(prev => ({ ...prev, name: e.target.value }))}
              className="glass border-white/10"
            />
            <Textarea
              placeholder="Preferências *"
              value={audioFormData.preferences}
              onChange={e => setAudioFormData(prev => ({ ...prev, preferences: e.target.value }))}
              className="glass border-white/10 min-h-[80px]"
            />
            <Textarea
              placeholder="Observações (opcional)"
              value={audioFormData.observations}
              onChange={e => setAudioFormData(prev => ({ ...prev, observations: e.target.value }))}
              className="glass border-white/10"
            />
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setShowAudioOrderDialog(false)} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-accent gap-2"
                onClick={handleAudioOrder}
                disabled={isProcessing || !audioFormData.name.trim() || !audioFormData.preferences.trim()}
              >
                <Send className="w-4 h-4" />
                {isProcessing ? 'Processando...' : 'Confirmar Pedido'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audio Success Dialog */}
      <Dialog open={audioOrderComplete} onOpenChange={resetAudioOrder}>
        <DialogContent className="glass mx-4 text-center">
          <div className="py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">Pedido Realizado! 🎧</h3>
            <p className="text-muted-foreground text-sm mb-4">Prazo: 3 dias úteis</p>
            <Button onClick={resetAudioOrder} className="bg-gradient-to-r from-primary to-accent">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default CustomsPage;
