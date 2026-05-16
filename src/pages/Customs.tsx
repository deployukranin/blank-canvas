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
  Pause
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { onCustomOrder, trackEvent } from '@/lib/integrations';
import { useTenant } from '@/contexts/TenantContext';
import { addOrder, VideoOrder } from '@/lib/order-store';
import { VideoPlayer, VideoPlaceholder } from '@/components/video/VideoPlayer';
import { 
  defaultVideoConfig,
  calculatePrice,
  calculateAudioPrice,
  type VideoConfig, 
  type VideoDuration, 
  type VideoCategory,
  type AudioCategory,
  type AudioDuration,
} from '@/lib/video-config';
import { usePersistentConfig } from '@/hooks/use-persistent-config';
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
import { usePixPayment } from '@/hooks/use-pix-payment';
import { PixPaymentModal } from '@/components/payment/PixPaymentModal';

const CustomsPage = () => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { store } = useTenant();

  // Translate only if the saved value still equals the default translation in another supported language.
  // This preserves custom admin-entered names while still translating untouched defaults.
  const supportedLanguages = ['pt-BR', 'en', 'es'] as const;
  const localize = (key: string, raw: string) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return t(key, { defaultValue: raw });
    const known = new Set(
      supportedLanguages
        .map((lng) => i18n.getFixedT(lng)(key))
        .filter((v) => v && v !== key)
    );
    return known.has(trimmed) ? t(key, { defaultValue: raw }) : raw;
  };
  const tCategoryName = (id: string, fallback: string) => localize(`customs.categories.${id}`, fallback);
  const tCategoryDesc = (id: string, fallback: string) => localize(`customs.categories.${id}Desc`, fallback);
  const tAudioCategoryName = (id: string, fallback: string) => localize(`customs.audioCategories.${id}`, fallback);
  const tAudioCategoryDesc = (id: string, fallback: string) => localize(`customs.audioCategories.${id}Desc`, fallback);
  const tDurationLabel = (id: string, fallback: string) => localize(`customs.durations.${id}`, fallback);

  const { createCharge, isLoading: isPixLoading, chargeData, resetCharge } = usePixPayment();

  // Load store's video_config from DB (so customers see the creator's actual prices/durations)
  const { config: loadedConfig, isLoading: isConfigLoading } = usePersistentConfig<VideoConfig>({
    configKey: 'video_config',
    defaultValue: defaultVideoConfig,
    storeId: store?.id ?? null,
  });
  const config: VideoConfig | null = isConfigLoading ? null : loadedConfig;

  // Currency follows the selected language: pt → BRL, en/es → USD
  const currencyByLanguage = (lng: string): 'BRL' | 'USD' => {
    const l = (lng || '').toLowerCase();
    if (l.startsWith('pt')) return 'BRL';
    return 'USD';
  };
  const storeCurrency = currencyByLanguage(i18n.language);

  const formatCurrency = (value: number) => {
    const localeByCurrency: Record<string, string> = { BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE' };
    return new Intl.NumberFormat(localeByCurrency[storeCurrency] || 'en-US', {
      style: 'currency',
      currency: storeCurrency,
    }).format(value);
  };


  // Video state
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<VideoDuration | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
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
  const [showAudioPixModal, setShowAudioPixModal] = useState(false);
  const [audioChargeData, setAudioChargeData] = useState<typeof chargeData>(null);

  // Current tab
  const [activeTab, setActiveTab] = useState('videos');

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
        title: t('customs.selectCategoryDurationToast'), 
        description: t('customs.selectCategoryDurationDesc'),
        variant: 'destructive' 
      });
      return;
    }
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedCategory || !selectedDuration || !config) return;

    if (!personalizationData.name.trim()) {
      toast({
        title: t('customs.nameRequired'),
        description: t('customs.nameRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    const finalPriceVal = calculatePrice(selectedDuration, selectedCategory);

    const result = await createCharge({
      amount: finalPriceVal,
      productType: 'video',
      category: selectedCategory.id,
      categoryName: selectedCategory.name,
      durationMinutes: selectedDuration.minutes,
      durationLabel: selectedDuration.label,
      customerName: personalizationData.name,
      triggers: personalizationData.triggers,
      script: personalizationData.script,
      observations: personalizationData.observations,
      storeId: store?.id,
      currency: storeCurrency,
      successUrl: `${window.location.origin}${window.location.pathname}?payment=success`,
      cancelUrl: `${window.location.origin}${window.location.pathname}?payment=cancelled`,
    } as any);

    setIsProcessing(false);

    if (result.success) {
      // Stripe checkout: redirect to hosted page
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      setShowPaymentDialog(false);
      setShowPixModal(true);
      trackEvent('video_pix_charge_created', { 
        category: selectedCategory.id,
        duration: selectedDuration.id,
        price: finalPriceVal
      });
    } else {
      toast({
        title: t('customs.chargeError'),
        description: result.error || t('customs.tryAgain'),
        variant: 'destructive',
      });
    }
  };

  const handlePixPaymentConfirmed = () => {
    setShowPixModal(false);
    setShowSuccessDialog(true);
    trackEvent('video_payment_completed', { 
      category: selectedCategory?.id,
      duration: selectedDuration?.id,
    });
  };

  const resetVideoOrder = () => {
    setSelectedCategory(null);
    setSelectedDuration(null);
    setShowSuccessDialog(false);
    setShowPixModal(false);
    setPersonalizationData({ name: '', triggers: '', script: '', observations: '' });
    resetCharge();
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
        title: t('customs.selectCategoryDurationToast'), 
        description: t('customs.selectCategoryDurationDesc'),
        variant: 'destructive' 
      });
      return;
    }
    setShowAudioOrderDialog(true);
  };

  const handleAudioOrder = async () => {
    if (!selectedAudioCategory || !selectedAudioDuration || !audioFormData.name.trim() || !audioFormData.preferences.trim()) {
      toast({ title: t('customs.fillRequiredFields'), variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    const audioPrice = calculateAudioPrice(selectedAudioDuration);

    const result = await createCharge({
      amount: audioPrice,
      productType: 'audio',
      category: selectedAudioCategory.id,
      categoryName: selectedAudioCategory.name,
      durationMinutes: selectedAudioDuration.minutes,
      durationLabel: selectedAudioDuration.label,
      customerName: audioFormData.name,
      preferences: audioFormData.preferences,
      observations: audioFormData.observations,
      storeId: store?.id,
      currency: storeCurrency,
      successUrl: `${window.location.origin}${window.location.pathname}?payment=success`,
      cancelUrl: `${window.location.origin}${window.location.pathname}?payment=cancelled`,
    } as any);

    setIsProcessing(false);

    if (result.success) {
      // Stripe checkout: redirect to hosted page
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      setAudioChargeData(result);
      setShowAudioOrderDialog(false);
      setShowAudioPixModal(true);
      trackEvent('audio_pix_charge_created', { 
        category: selectedAudioCategory.id,
        duration: selectedAudioDuration.id,
        price: audioPrice,
      });
    } else {
      toast({
        title: t('customs.chargeError'),
        description: result.error || t('customs.tryAgain'),
        variant: 'destructive',
      });
    }
  };

  const handleAudioPixPaymentConfirmed = async () => {
    if (!selectedAudioCategory || !selectedAudioDuration) return;

    setShowAudioPixModal(false);
    
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
    setAudioOrderComplete(true);
  };

  const resetAudioOrder = () => {
    setSelectedAudioCategory(null);
    setSelectedAudioDuration(null);
    setAudioFormData({ name: '', preferences: '', observations: '' });
    setAudioOrderComplete(false);
    setShowAudioOrderDialog(false);
    setShowAudioPixModal(false);
    setAudioChargeData(null);
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
          <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
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
              {t('customs.videos')}
            </TabsTrigger>
            <TabsTrigger value="audios" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <Headphones className="w-4 h-4" />
              {t('customs.audios')}
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab Content */}
          <TabsContent value="videos" className="mt-6 space-y-6">
            {/* Preview Section */}
            {config.previewEnabled && (() => {
              const previewTitle = config.previewTitle || t('customs.previewTitleDefault');
              const previewDesc = config.previewDescription || t('customs.previewDescDefault');
              return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="overflow-hidden p-0">
                  {config.previewType === 'video' && config.previewVideoUrl ? (
                    <VideoPlayer videoUrl={config.previewVideoUrl} title={previewTitle} description={previewDesc} />
                  ) : config.previewType === 'image' && config.previewImageUrl ? (
                    <div className="aspect-video bg-black">
                      <img src={config.previewImageUrl} alt={previewTitle} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <VideoPlaceholder title={previewTitle} description={previewDesc} />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1">{previewTitle}</h3>
                    <p className="text-xs text-muted-foreground">{previewDesc}</p>
                  </div>
                </GlassCard>
              </motion.div>
              );
            })()}

            {/* Rules Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="rules" className="border-none">
                  <AccordionTrigger className="glass rounded-xl px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-primary" />
                      <span className="font-medium text-sm">{t('customs.contentRules')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="space-y-3">
                      <GlassCard className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldCheck className="w-5 h-5 text-green-500" />
                          <h4 className="font-semibold text-sm text-green-500">{t('customs.whatIsAllowed')}</h4>
                        </div>
                        <ul className="space-y-2">
                          {config.rules.allowed.map((rule, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                              <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {t(`customs.rules.allowed_${idx}`, { defaultValue: rule })}
                            </li>
                          ))}
                        </ul>
                      </GlassCard>

                      <GlassCard className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldX className="w-5 h-5 text-red-500" />
                          <h4 className="font-semibold text-sm text-red-500">{t('customs.whatIsNotAllowed')}</h4>
                        </div>
                        <ul className="space-y-2">
                          {config.rules.notAllowed.map((rule, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0">✕</span>
                              {t(`customs.rules.notAllowed_${idx}`, { defaultValue: rule })}
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">{t('customs.chooseCategory')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {config.categories.map((category, index) => (
                  <motion.div key={category.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + index * 0.05 }}>
                    <GlassCard
                      className={`p-4 text-center cursor-pointer transition-all ${
                        selectedCategory?.id === category.id ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-white/5'
                      }`}
                      onClick={() => handleSelectCategory(category)}
                    >
                      <div className="text-3xl mb-2">{category.icon}</div>
                      <h4 className="font-semibold text-sm mb-1">{tCategoryName(category.id, category.name)}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tCategoryDesc(category.id, category.description)}</p>
                      {(category.surcharge || 0) > 0 && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                          +{formatCurrency(category.surcharge || 0)}
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Duration Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">{t('customs.chooseDuration')}</h3>
              </div>
              <div className="space-y-2">
                {config.durations.map((duration, index) => {
                  const price = calculatePrice(duration);
                  return (
                    <motion.div key={duration.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + index * 0.05 }}>
                      <GlassCard
                        className={`p-4 cursor-pointer transition-all ${
                          selectedDuration?.id === duration.id ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-white/5'
                        }`}
                        onClick={() => handleSelectDuration(duration)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              selectedDuration?.id === duration.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                            }`}>
                              {selectedDuration?.id === duration.id && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="font-medium text-sm">{tDurationLabel(duration.id, duration.label)}</span>
                          </div>
                          <span className="font-bold text-primary">
                            {formatCurrency(price)}
                          </span>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {(selectedCategory || selectedDuration) && <div className="h-40" />}
          </TabsContent>

          {/* Audios Tab Content */}
          <TabsContent value="audios" className="mt-6 space-y-4">
            {config.audioPreviewEnabled && (
              <GlassCard className="p-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">Preview</h3>
                    <p className="text-xs text-muted-foreground">{t('customs.listenExample')}</p>
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

            {/* Audio Categories */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">{t('customs.chooseCategory')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {config.audioCategories.map((category, index) => (
                  <motion.div key={category.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                    <GlassCard
                      className={`p-4 text-center cursor-pointer transition-all ${
                        selectedAudioCategory?.id === category.id ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-white/5'
                      }`}
                      onClick={() => handleSelectAudioCategory(category)}
                    >
                      <div className="text-3xl mb-2">{category.icon}</div>
                      <h4 className="font-semibold text-sm mb-1">{tAudioCategoryName(category.id, category.name)}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tAudioCategoryDesc(category.id, category.description)}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Audio Durations */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">{t('customs.chooseDuration')}</h3>
              </div>
              <div className="space-y-2">
                {config.audioDurations.map((duration, index) => {
                  const price = calculateAudioPrice(duration);
                  return (
                    <motion.div key={duration.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + index * 0.05 }}>
                      <GlassCard
                        className={`p-4 cursor-pointer transition-all ${
                          selectedAudioDuration?.id === duration.id ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-white/5'
                        }`}
                        onClick={() => handleSelectAudioDuration(duration)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              selectedAudioDuration?.id === duration.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                            }`}>
                              {selectedAudioDuration?.id === duration.id && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="font-medium text-sm">{tDurationLabel(duration.id, duration.label)}</span>
                          </div>
                          <span className="font-bold text-primary">
                            {formatCurrency(price)}
                          </span>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {(selectedAudioCategory || selectedAudioDuration) && <div className="h-40" />}
          </TabsContent>
        </Tabs>

        {/* Video Summary & Buy Button */}
        <AnimatePresence>
          {activeTab === 'videos' && (selectedCategory || selectedDuration) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-20 left-4 right-4 z-40">
              <GlassCard className="p-4 bg-card/95 backdrop-blur-xl border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t('customs.total')}</span>
                    {selectedCategory && selectedDuration ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        {tCategoryName(selectedCategory.id, selectedCategory.name)} • {tDurationLabel(selectedDuration.id, selectedDuration.label)}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('customs.selectCategoryAndDuration')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(finalPrice)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('customs.delivery')}: {t('customs.deliveryDays', { days: config.deliveryDays })}
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-accent gap-2 h-12" onClick={handleBuyClick} disabled={!selectedCategory || !selectedDuration}>
                  <Sparkles className="w-5 h-5" />
                  {t('customs.buyNow')}
                </Button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio Summary & Buy Button */}
        <AnimatePresence>
          {activeTab === 'audios' && (selectedAudioCategory || selectedAudioDuration) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-20 left-4 right-4 z-40">
              <GlassCard className="p-4 bg-card/95 backdrop-blur-xl border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t('customs.total')}</span>
                    {selectedAudioCategory && selectedAudioDuration ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        {tAudioCategoryName(selectedAudioCategory.id, selectedAudioCategory.name)} • {tDurationLabel(selectedAudioDuration.id, selectedAudioDuration.label)}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('customs.selectCategoryAndDuration')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(audioFinalPrice)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('customs.delivery3days')}
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-accent gap-2 h-12" onClick={handleAudioBuyClick} disabled={!selectedAudioCategory || !selectedAudioDuration}>
                  <Sparkles className="w-5 h-5" />
                  {t('customs.buyNow')}
                </Button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} message={t('customs.loginToOrder')} />

      {/* Video Payment Dialog - includes personalization */}
      <Dialog open={showPaymentDialog} onOpenChange={() => !isProcessing && !isPixLoading && setShowPaymentDialog(false)}>
        <DialogContent className="glass mx-4 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('customs.confirmPurchase')}</DialogTitle>
            <DialogDescription>{t('customs.reviewOrder')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="glass rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('customs.category')}</span>
                <span className="font-medium">{selectedCategory?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('customs.duration')}</span>
                <span className="font-medium">{selectedDuration?.label}</span>
              </div>
              <div className="border-t border-white/10 my-2" />
              <div className="flex justify-between">
                <span className="font-semibold">{t('customs.total')}</span>
                <span className="font-bold text-lg text-primary">{formatCurrency(finalPrice)}</span>
              </div>
            </div>

            {/* Personalization fields inline */}
            <div>
              <label className="text-sm font-medium mb-1 block">{t('customs.yourName')} *</label>
              <Input placeholder={t('customs.nameInVideo')} value={personalizationData.name} onChange={(e) => setPersonalizationData(prev => ({ ...prev, name: e.target.value }))} className="glass border-white/10" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('customs.preferredTriggers')}</label>
              <Input placeholder={t('customs.triggersPlaceholder')} value={personalizationData.triggers} onChange={(e) => setPersonalizationData(prev => ({ ...prev, triggers: e.target.value }))} className="glass border-white/10" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('customs.scriptIdeas')}</label>
              <Textarea placeholder={t('customs.scriptPlaceholder')} value={personalizationData.script} onChange={(e) => setPersonalizationData(prev => ({ ...prev, script: e.target.value }))} className="glass border-white/10 min-h-[80px]" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('customs.observations')}</label>
              <Textarea placeholder={t('customs.observationsPlaceholder')} value={personalizationData.observations} onChange={(e) => setPersonalizationData(prev => ({ ...prev, observations: e.target.value }))} className="glass border-white/10" />
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setShowPaymentDialog(false)} disabled={isProcessing || isPixLoading}>
                {t('common.cancel')}
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-primary to-accent gap-2" onClick={handlePayment} disabled={isProcessing || isPixLoading || !personalizationData.name.trim()}>
                {isProcessing || isPixLoading ? t('customs.generatingPix') : t('customs.confirmPayment')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIX Payment Modal for Videos */}
      {chargeData?.success && (
        <PixPaymentModal
          isOpen={showPixModal}
          onClose={() => { setShowPixModal(false); resetCharge(); }}
          onPaymentConfirmed={handlePixPaymentConfirmed}
          qrCodeImage={chargeData.qrCodeImage!}
          brCode={chargeData.brCode!}
          correlationId={chargeData.correlationId!}
          expiresAt={chargeData.expiresAt!}
          amount={finalPrice}
          isManualPix
        />
      )}

      <Dialog open={showSuccessDialog} onOpenChange={resetVideoOrder}>
        <DialogContent className="glass mx-4 text-center">
          <div className="py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">{t('customs.orderConfirmed')}</h3>
            <p className="text-muted-foreground text-sm mb-2">{t('customs.videoBeingPrepared')}</p>
            <p className="text-xs text-muted-foreground mb-4">{t('customs.deliveryTime', { days: config?.deliveryDays })}</p>
            <Button onClick={resetVideoOrder} className="bg-gradient-to-r from-primary to-accent">
              {t('customs.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audio Order Dialog */}
      <Dialog open={showAudioOrderDialog} onOpenChange={() => !isProcessing && !isPixLoading && setShowAudioOrderDialog(false)}>
        <DialogContent className="glass mx-4">
          <DialogHeader>
            <DialogTitle>{t('customs.orderCustomAudio')}</DialogTitle>
            <DialogDescription>
              {selectedAudioCategory?.name} • {selectedAudioDuration?.label} - {formatCurrency(audioFinalPrice)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder={t('customs.yourNameRequired')} value={audioFormData.name} onChange={e => setAudioFormData(prev => ({ ...prev, name: e.target.value }))} className="glass border-white/10" />
            <Textarea placeholder={t('customs.preferencesRequired')} value={audioFormData.preferences} onChange={e => setAudioFormData(prev => ({ ...prev, preferences: e.target.value }))} className="glass border-white/10 min-h-[80px]" />
            <Textarea placeholder={t('customs.observationsOptional')} value={audioFormData.observations} onChange={e => setAudioFormData(prev => ({ ...prev, observations: e.target.value }))} className="glass border-white/10" />
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setShowAudioOrderDialog(false)} disabled={isProcessing || isPixLoading}>
                {t('common.cancel')}
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-primary to-accent gap-2" onClick={handleAudioOrder} disabled={isProcessing || isPixLoading || !audioFormData.name.trim() || !audioFormData.preferences.trim()}>
                <Send className="w-4 h-4" />
                {isProcessing || isPixLoading ? t('customs.generatingPix') : t('customs.payWithPix')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIX Payment Modal for Audio */}
      {audioChargeData?.success && selectedAudioDuration && (
        <PixPaymentModal
          isOpen={showAudioPixModal}
          onClose={() => { setShowAudioPixModal(false); setAudioChargeData(null); }}
          onPaymentConfirmed={handleAudioPixPaymentConfirmed}
          qrCodeImage={audioChargeData.qrCodeImage!}
          brCode={audioChargeData.brCode!}
          correlationId={audioChargeData.correlationId!}
          expiresAt={audioChargeData.expiresAt!}
          amount={audioFinalPrice}
          isManualPix
        />
      )}

      {/* Audio Success Dialog */}
      <Dialog open={audioOrderComplete} onOpenChange={resetAudioOrder}>
        <DialogContent className="glass mx-4 text-center">
          <div className="py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">{t('customs.audioOrderConfirmed')}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t('customs.audioDeliveryTime')}</p>
            <Button onClick={resetAudioOrder} className="bg-gradient-to-r from-primary to-accent">
              {t('customs.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default CustomsPage;
