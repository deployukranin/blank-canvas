import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, Plus, Trash2, Video, Headphones, Clock, Music, 
  ShieldCheck, ShieldX, Eye, EyeOff, ImageIcon, Loader2 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { usePersistentConfig } from '@/hooks/use-persistent-config';
import { useTenant } from '@/contexts/TenantContext';
import {
  defaultVideoConfig,
  saveVideoConfig,
  type VideoConfig,
  type VideoCategory,
  type VideoDuration,
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

const MIN_PRICE = 10;

const AdminCustoms = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { store } = useTenant();
  const { 
    config, 
    setConfig, 
    isLoading, 
    isSaving, 
    saveNow 
  } = usePersistentConfig<VideoConfig>({
    configKey: 'video_config',
    defaultValue: defaultVideoConfig,
    localStorageKey: 'videoConfig',
    debounceMs: 2000,
    storeId: store?.id,
  });

  const [showPreview, setShowPreview] = useState(false);
  const currencySymbol = i18n.language?.startsWith('pt') ? 'R$' : '$';

  useEffect(() => {
    if (!isLoading) {
      saveVideoConfig(config);
    }
  }, [config, isLoading]);

  const handleSave = async () => {
    const invalidVideoPrices = config.durations.filter(d => d.price < MIN_PRICE);
    const invalidAudioPrices = config.audioDurations.filter(d => d.price < MIN_PRICE);
    if (invalidVideoPrices.length > 0 || invalidAudioPrices.length > 0) {
      toast({
        title: t('audiosAdmin.minPriceError', 'Preço mínimo não atingido'),
        description: t('audiosAdmin.minPriceErrorDesc', `O preço mínimo é ${currencySymbol} ${MIN_PRICE.toFixed(2)}.`),
        variant: 'destructive',
      });
      return;
    }
    await saveNow();
  };

  // === Video Category handlers ===
  const addVideoCategory = () => {
    const newCategory: VideoCategory = {
      id: `video-category-${Date.now()}`,
      name: 'Nova Categoria',
      description: 'Descrição da categoria',
      icon: '🎬',
      surcharge: 0,
    };
    setConfig(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
  };

  const updateVideoCategory = (index: number, field: keyof VideoCategory, value: string | number) => {
    setConfig(prev => {
      const newCategories = [...prev.categories];
      newCategories[index] = { ...newCategories[index], [field]: value };
      return { ...prev, categories: newCategories };
    });
  };

  const removeVideoCategory = (index: number) => {
    setConfig(prev => ({ ...prev, categories: prev.categories.filter((_, i) => i !== index) }));
  };

  // === Video Duration handlers ===
  const addVideoDuration = () => {
    const newDuration: VideoDuration = {
      id: `duration-${Date.now()}`,
      label: 'Nova duração',
      minutes: 5,
      price: 49.90,
    };
    setConfig(prev => ({ ...prev, durations: [...prev.durations, newDuration] }));
  };

  const updateVideoDuration = (index: number, field: keyof VideoDuration, value: string | number) => {
    setConfig(prev => {
      const newDurations = [...prev.durations];
      newDurations[index] = { ...newDurations[index], [field]: value };
      return { ...prev, durations: newDurations };
    });
  };

  const removeVideoDuration = (index: number) => {
    setConfig(prev => ({ ...prev, durations: prev.durations.filter((_, i) => i !== index) }));
  };

  // === Audio Category handlers ===
  const addAudioCategory = () => {
    const newCategory: AudioCategory = {
      id: `audio-category-${Date.now()}`,
      name: 'Nova Categoria',
      description: 'Descrição da categoria',
      icon: '🎧',
    };
    setConfig(prev => ({ ...prev, audioCategories: [...prev.audioCategories, newCategory] }));
  };

  const updateAudioCategory = (index: number, field: keyof AudioCategory, value: string) => {
    setConfig(prev => {
      const newCategories = [...prev.audioCategories];
      newCategories[index] = { ...newCategories[index], [field]: value };
      return { ...prev, audioCategories: newCategories };
    });
  };

  const removeAudioCategory = (index: number) => {
    setConfig(prev => ({ ...prev, audioCategories: prev.audioCategories.filter((_, i) => i !== index) }));
  };

  // === Audio Duration handlers ===
  const addAudioDuration = () => {
    const newDuration: AudioDuration = {
      id: `audio-duration-${Date.now()}`,
      label: '5 minutos',
      minutes: 5,
      price: 19.90,
    };
    setConfig(prev => ({ ...prev, audioDurations: [...prev.audioDurations, newDuration] }));
  };

  const updateAudioDuration = (index: number, field: keyof AudioDuration, value: string | number) => {
    setConfig(prev => {
      const newDurations = [...prev.audioDurations];
      newDurations[index] = { ...newDurations[index], [field]: value };
      return { ...prev, audioDurations: newDurations };
    });
  };

  const removeAudioDuration = (index: number) => {
    setConfig(prev => ({ ...prev, audioDurations: prev.audioDurations.filter((_, i) => i !== index) }));
  };

  // === Rules handlers ===
  const addRule = (type: 'allowed' | 'notAllowed') => {
    setConfig(prev => {
      const newRules = { ...prev.rules };
      newRules[type] = [...newRules[type], 'Nova regra'];
      return { ...prev, rules: newRules };
    });
  };

  const updateRule = (type: 'allowed' | 'notAllowed', index: number, value: string) => {
    setConfig(prev => {
      const newRules = { ...prev.rules };
      newRules[type] = [...newRules[type]];
      newRules[type][index] = value;
      return { ...prev, rules: newRules };
    });
  };

  const removeRule = (type: 'allowed' | 'notAllowed', index: number) => {
    setConfig(prev => {
      const newRules = { ...prev.rules };
      newRules[type] = newRules[type].filter((_, i) => i !== index);
      return { ...prev, rules: newRules };
    });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Custom's">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">{t('common.loading')}</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Custom's">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {t('customsAdmin.subtitle', 'Configure categorias, preços, regras e previews dos pedidos personalizados')}
            </p>
            {isSaving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t('common.loading')}
              </span>
            )}
          </div>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? t('common.loading') : t('vipPricing.saveToServer', 'Salvar')}
          </Button>
        </div>

        {/* Main Tabs: Videos / Audios */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              {t('customs.videos', 'Vídeos')}
            </TabsTrigger>
            <TabsTrigger value="audios" className="flex items-center gap-2">
              <Headphones className="w-4 h-4" />
              {t('customs.audios', 'Áudios')}
            </TabsTrigger>
          </TabsList>

          {/* ========== VIDEOS TAB ========== */}
          <TabsContent value="videos" className="space-y-6 mt-6">
            {/* Preview Section Config */}
            <GlassCard className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                {t('customsAdmin.howItWorks', 'Seção "Como Funciona"')}
              </h3>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  {config.previewEnabled ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
                  <div>
                    <span className="font-medium text-sm">{t('customsAdmin.showSection', 'Exibir Seção')}</span>
                    <p className="text-xs text-muted-foreground">
                      {config.previewEnabled ? t('customsAdmin.visibleOnPage', 'Visível na página de pedidos') : t('customsAdmin.hiddenFromPage', 'Oculto da página de pedidos')}
                    </p>
                  </div>
                </div>
                <Switch checked={config.previewEnabled} onCheckedChange={(checked) => setConfig({ ...config, previewEnabled: checked })} />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  {config.previewType === 'video' ? <Video className="w-5 h-5 text-primary" /> : <ImageIcon className="w-5 h-5 text-primary" />}
                  <div>
                    <span className="font-medium text-sm">{t('customsAdmin.mediaType', 'Tipo de Mídia')}</span>
                    <p className="text-xs text-muted-foreground">
                      {config.previewType === 'video' ? 'YouTube' : t('customsAdmin.image', 'Imagem')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t('customsAdmin.image', 'Imagem')}</span>
                  <Switch checked={config.previewType === 'video'} onCheckedChange={(checked) => setConfig({ ...config, previewType: checked ? 'video' : 'image' })} disabled={!config.previewEnabled} />
                  <span className="text-xs text-muted-foreground">{t('customsAdmin.videoLabel', 'Vídeo')}</span>
                </div>
              </div>

              <div className={`space-y-4 ${!config.previewEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {config.previewType === 'video' ? (
                  <div>
                    <label className="text-sm font-medium mb-2 block">URL (YouTube Embed)</label>
                    <Input placeholder="https://www.youtube.com/embed/..." value={config.previewVideoUrl} onChange={e => setConfig({ ...config, previewVideoUrl: e.target.value })} />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('customsAdmin.imageUrl', 'URL da Imagem')}</label>
                    <Input placeholder="https://exemplo.com/imagem.jpg" value={config.previewImageUrl} onChange={e => setConfig({ ...config, previewImageUrl: e.target.value })} />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('customsAdmin.titleLabel', 'Título')}</label>
                  <Input value={config.previewTitle} onChange={e => setConfig({ ...config, previewTitle: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('customsAdmin.descLabel', 'Descrição')}</label>
                  <Textarea value={config.previewDescription} onChange={e => setConfig({ ...config, previewDescription: e.target.value })} className="min-h-[80px]" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('customsAdmin.deliveryDays', 'Prazo de Entrega (dias)')}</label>
                  <Input type="number" min={1} value={config.deliveryDays} onChange={e => setConfig({ ...config, deliveryDays: parseInt(e.target.value) || 7 })} />
                </div>
              </div>
            </GlassCard>

            {/* Video Categories */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  {t('customsAdmin.videoCategories', 'Categorias de Vídeos')}
                </h3>
                <Button size="sm" variant="outline" onClick={addVideoCategory}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('vipPricing.add', 'Adicionar')}
                </Button>
              </div>
              <div className="space-y-4">
                {config.categories.map((category, index) => (
                  <motion.div key={category.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <Input className="w-16 text-center text-xl" value={category.icon} onChange={e => updateVideoCategory(index, 'icon', e.target.value)} />
                      <Input className="flex-1" placeholder={t('customsAdmin.categoryName', 'Nome')} value={category.name} onChange={e => updateVideoCategory(index, 'name', e.target.value)} />
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeVideoCategory(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input placeholder={t('admin.description', 'Descrição')} value={category.description} onChange={e => updateVideoCategory(index, 'description', e.target.value)} />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{t('customsAdmin.surcharge', 'Taxa fixa')}: +{currencySymbol}</span>
                      <Input type="number" className="w-24" step="0.01" min={0} value={category.surcharge || 0} onChange={e => updateVideoCategory(index, 'surcharge', parseFloat(e.target.value) || 0)} />
                      {(category.surcharge || 0) > 0 && (
                        <span className="text-xs text-primary">+{currencySymbol} {(category.surcharge || 0).toFixed(2)}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
                {config.categories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{t('customsAdmin.noCategories', 'Nenhuma categoria cadastrada')}</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Video Durations & Prices */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {t('customsAdmin.videoPrices', 'Preços por Tempo')}
                </h3>
                <Button size="sm" variant="outline" onClick={addVideoDuration}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('vipPricing.add', 'Adicionar')}
                </Button>
              </div>
              <div className="space-y-3">
                {config.durations.map((duration, index) => (
                  <motion.div key={duration.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Input className="w-full sm:w-32" placeholder="Label" value={duration.label} onChange={e => updateVideoDuration(index, 'label', e.target.value)} />
                    <div className="flex items-center gap-2">
                      <Input type="number" className="w-20" min={1} value={duration.minutes} onChange={e => updateVideoDuration(index, 'minutes', parseInt(e.target.value) || 1)} />
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{currencySymbol}</span>
                      <Input type="number" className={`w-24 ${duration.price < MIN_PRICE ? 'border-destructive' : ''}`} step="0.01" min={MIN_PRICE} value={duration.price} onChange={e => updateVideoDuration(index, 'price', parseFloat(e.target.value) || MIN_PRICE)} />
                      {duration.price < MIN_PRICE && <span className="text-xs text-destructive whitespace-nowrap">Mín. {currencySymbol}{MIN_PRICE}</span>}
                    </div>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive ml-auto" onClick={() => removeVideoDuration(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
                {config.durations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{t('customsAdmin.noDurations', 'Nenhuma duração cadastrada')}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3">* {t('audiosAdmin.minPrice', 'Preço mínimo: {{symbol}}{{price}}', { symbol: currencySymbol, price: MIN_PRICE.toFixed(2) })}</p>
            </GlassCard>

            {/* Rules */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  {t('customsAdmin.rulesTitle', 'Regras de Conteúdo')}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  {t('customsAdmin.preview', 'Visualizar')}
                </Button>
              </div>

              <div className="space-y-6">
                {/* Allowed */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm flex items-center gap-2 text-green-500">
                      <ShieldCheck className="w-4 h-4" />
                      {t('customs.whatIsAllowed', 'O que PODE')}
                    </h4>
                    <Button size="sm" variant="ghost" onClick={() => addRule('allowed')}>
                      <Plus className="w-4 h-4 mr-1" />
                      {t('vipPricing.add', 'Adicionar')}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {config.rules.allowed.map((rule, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={rule} onChange={e => updateRule('allowed', index, e.target.value)} className="flex-1" />
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeRule('allowed', index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Not Allowed */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm flex items-center gap-2 text-red-500">
                      <ShieldX className="w-4 h-4" />
                      {t('customs.whatIsNotAllowed', 'O que NÃO PODE')}
                    </h4>
                    <Button size="sm" variant="ghost" onClick={() => addRule('notAllowed')}>
                      <Plus className="w-4 h-4 mr-1" />
                      {t('vipPricing.add', 'Adicionar')}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {config.rules.notAllowed.map((rule, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={rule} onChange={e => updateRule('notAllowed', index, e.target.value)} className="flex-1" />
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeRule('notAllowed', index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* ========== AUDIOS TAB ========== */}
          <TabsContent value="audios" className="space-y-6 mt-6">
            {/* Audio Preview */}
            <GlassCard className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                {t('audiosAdmin.audioPreview', 'Preview de Áudio')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {config.audioPreviewEnabled ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
                    <div>
                      <span className="font-medium text-sm">{t('audiosAdmin.showPreview', 'Exibir Preview')}</span>
                      <p className="text-xs text-muted-foreground">
                        {config.audioPreviewEnabled ? t('customsAdmin.visibleOnPage', 'Visível na página') : t('customsAdmin.hiddenFromPage', 'Oculto da página')}
                      </p>
                    </div>
                  </div>
                  <Switch checked={config.audioPreviewEnabled} onCheckedChange={(checked) => setConfig({ ...config, audioPreviewEnabled: checked })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('audiosAdmin.audioUrl', 'URL do Áudio (MP3)')}</label>
                  <Input placeholder="https://example.com/audio.mp3" value={config.audioPreviewUrl} onChange={e => setConfig({ ...config, audioPreviewUrl: e.target.value })} disabled={!config.audioPreviewEnabled} />
                </div>
                {config.audioPreviewEnabled && config.audioPreviewUrl && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium mb-2">{t('audiosAdmin.previewLabel', 'Preview:')}</p>
                    <audio controls className="w-full" src={config.audioPreviewUrl}>Your browser does not support audio.</audio>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Audio Categories */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-primary" />
                  {t('audiosAdmin.categories', 'Categorias de Áudio')}
                </h3>
                <Button size="sm" variant="outline" onClick={addAudioCategory}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('vipPricing.add', 'Adicionar')}
                </Button>
              </div>
              <div className="space-y-4">
                {config.audioCategories.map((category, index) => (
                  <motion.div key={category.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <Input className="w-16 text-center text-xl" value={category.icon} onChange={e => updateAudioCategory(index, 'icon', e.target.value)} />
                      <Input className="flex-1" placeholder={t('customsAdmin.categoryName', 'Nome')} value={category.name} onChange={e => updateAudioCategory(index, 'name', e.target.value)} />
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeAudioCategory(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input placeholder={t('admin.description', 'Descrição')} value={category.description} onChange={e => updateAudioCategory(index, 'description', e.target.value)} />
                  </motion.div>
                ))}
                {config.audioCategories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Headphones className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{t('audiosAdmin.noCategories', 'Nenhuma categoria cadastrada')}</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Audio Durations & Prices */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {t('audiosAdmin.durationsAndPrices', 'Durações e Preços')}
                </h3>
                <Button size="sm" variant="outline" onClick={addAudioDuration}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('vipPricing.add', 'Adicionar')}
                </Button>
              </div>
              <div className="space-y-3">
                {config.audioDurations.map((duration, index) => (
                  <motion.div key={duration.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Input className="w-full sm:w-32" placeholder="Label" value={duration.label} onChange={e => updateAudioDuration(index, 'label', e.target.value)} />
                    <div className="flex items-center gap-2">
                      <Input type="number" className="w-20" min={1} value={duration.minutes} onChange={e => updateAudioDuration(index, 'minutes', parseInt(e.target.value) || 1)} />
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{currencySymbol}</span>
                      <Input type="number" className={`w-24 ${duration.price < MIN_PRICE ? 'border-destructive' : ''}`} step="0.01" min={MIN_PRICE} value={duration.price} onChange={e => updateAudioDuration(index, 'price', parseFloat(e.target.value) || 0)} />
                      {duration.price < MIN_PRICE && <span className="text-xs text-destructive whitespace-nowrap">Mín. {currencySymbol}{MIN_PRICE}</span>}
                    </div>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive ml-auto" onClick={() => removeAudioDuration(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
                {config.audioDurations.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('audiosAdmin.noDurations', 'Nenhuma duração cadastrada')}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3">* {t('audiosAdmin.minPrice', 'Preço mínimo: {{symbol}}{{price}}', { symbol: currencySymbol, price: MIN_PRICE.toFixed(2) })}</p>
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Rules Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('customsAdmin.rulesPreview', 'Visualização das Regras')}</DialogTitle>
              <DialogDescription>{t('customsAdmin.rulesPreviewDesc', 'Como os usuários verão as regras')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="font-semibold text-green-500 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  {t('customs.whatIsAllowed', 'O que pode')}
                </h4>
                <ul className="space-y-1">
                  {config.rules.allowed.map((rule, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2"><span className="text-green-500">✓</span>{rule}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h4 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
                  <ShieldX className="w-5 h-5" />
                  {t('customs.whatIsNotAllowed', 'O que NÃO pode')}
                </h4>
                <ul className="space-y-1">
                  {config.rules.notAllowed.map((rule, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2"><span className="text-red-500">✕</span>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCustoms;
