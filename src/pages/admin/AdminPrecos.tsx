import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Video, Clock, ShieldCheck, ShieldX, Eye, Headphones, Loader2, DollarSign } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { usePersistentConfig } from '@/hooks/use-persistent-config';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MIN_PRICE = 10;

const AdminPrecos = () => {
  const { toast } = useToast();
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
  });

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      saveVideoConfig(config);
    }
  }, [config, isLoading]);

  const handleSave = async () => {
    const invalidVideoDurations = config.durations.filter(d => d.price < MIN_PRICE);
    const invalidAudioDurations = config.audioDurations.filter(d => d.price < MIN_PRICE);
    if (invalidVideoDurations.length > 0 || invalidAudioDurations.length > 0) {
      toast({
        title: 'Preço mínimo não atingido',
        description: `O preço mínimo é R$ ${MIN_PRICE.toFixed(2)}. Corrija as durações com preço inferior.`,
        variant: 'destructive',
      });
      return;
    }
    await saveNow();
  };

  // Video Categories
  const addCategory = () => {
    const newCategory: VideoCategory = {
      id: `video-category-${Date.now()}`,
      name: 'Nova Categoria',
      description: 'Descrição da categoria',
      icon: '🎬',
      surcharge: 0,
    };
    setConfig(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
  };

  const updateCategory = (index: number, field: keyof VideoCategory, value: string | number) => {
    setConfig(prev => {
      const newCategories = [...prev.categories];
      newCategories[index] = { ...newCategories[index], [field]: value };
      return { ...prev, categories: newCategories };
    });
  };

  const removeCategory = (index: number) => {
    setConfig(prev => ({ ...prev, categories: prev.categories.filter((_, i) => i !== index) }));
  };

  // Video Durations
  const addDuration = () => {
    const newDuration: VideoDuration = {
      id: `duration-${Date.now()}`,
      label: 'Nova duração',
      minutes: 5,
      price: 49.90,
    };
    setConfig(prev => ({ ...prev, durations: [...prev.durations, newDuration] }));
  };

  const updateDuration = (index: number, field: keyof VideoDuration, value: string | number) => {
    setConfig(prev => {
      const newDurations = [...prev.durations];
      newDurations[index] = { ...newDurations[index], [field]: value };
      return { ...prev, durations: newDurations };
    });
  };

  const removeDuration = (index: number) => {
    setConfig(prev => ({ ...prev, durations: prev.durations.filter((_, i) => i !== index) }));
  };

  // Audio Categories
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

  // Audio Durations
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

  // Rules
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
      <AdminLayout title="Preços">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Carregando configurações...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Preços">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Configure categorias, preços e regras de vídeos e áudios
            </p>
            {isSaving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Salvando...
              </span>
            )}
          </div>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar no servidor'}
          </Button>
        </div>

        <Tabs defaultValue="video-categorias" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="video-categorias">
              <Video className="w-3 h-3 mr-1 hidden sm:inline" />
              Cat. Vídeo
            </TabsTrigger>
            <TabsTrigger value="video-precos">
              <DollarSign className="w-3 h-3 mr-1 hidden sm:inline" />
              Preços Vídeo
            </TabsTrigger>
            <TabsTrigger value="audio-categorias">
              <Headphones className="w-3 h-3 mr-1 hidden sm:inline" />
              Cat. Áudio
            </TabsTrigger>
            <TabsTrigger value="audio-precos">
              <DollarSign className="w-3 h-3 mr-1 hidden sm:inline" />
              Preços Áudio
            </TabsTrigger>
            <TabsTrigger value="regras">
              <ShieldCheck className="w-3 h-3 mr-1 hidden sm:inline" />
              Regras
            </TabsTrigger>
          </TabsList>

          {/* Video Categories */}
          <TabsContent value="video-categorias" className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Categorias de Vídeos
                </h3>
                <Button size="sm" variant="outline" onClick={addCategory}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              
              <div className="space-y-4">
                {config.categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-muted/30 rounded-lg space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Input
                        className="w-16 text-center text-xl"
                        placeholder="🎬"
                        value={category.icon}
                        onChange={e => updateCategory(index, 'icon', e.target.value)}
                      />
                      <Input
                        className="flex-1"
                        placeholder="Nome da categoria"
                        value={category.name}
                        onChange={e => updateCategory(index, 'name', e.target.value)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeCategory(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Descrição"
                      value={category.description}
                      onChange={e => updateCategory(index, 'description', e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Taxa fixa: +R$</span>
                      <Input
                        type="number"
                        className="w-24"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        value={category.surcharge || 0}
                        onChange={e => updateCategory(index, 'surcharge', parseFloat(e.target.value) || 0)}
                      />
                      {(category.surcharge || 0) > 0 && (
                        <span className="text-xs text-primary">
                          +R$ {(category.surcharge || 0).toFixed(2)} por pedido
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}

                {config.categories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma categoria cadastrada</p>
                    <p className="text-sm">Clique em "Adicionar" para criar uma nova categoria</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Video Prices */}
          <TabsContent value="video-precos" className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Preços por Tempo (Vídeo)
                </h3>
                <Button size="sm" variant="outline" onClick={addDuration}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              
              <div className="space-y-3">
                {config.durations.map((duration, index) => (
                  <motion.div
                    key={duration.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <Input
                      className="w-full sm:w-32"
                      placeholder="Label"
                      value={duration.label}
                      onChange={e => updateDuration(index, 'label', e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-20"
                        min={1}
                        value={duration.minutes}
                        onChange={e => updateDuration(index, 'minutes', parseInt(e.target.value) || 1)}
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        className={`w-24 ${duration.price < MIN_PRICE ? 'border-destructive' : ''}`}
                        step="0.01"
                        min={MIN_PRICE}
                        value={duration.price}
                        onChange={e => updateDuration(index, 'price', parseFloat(e.target.value) || MIN_PRICE)}
                      />
                      {duration.price < MIN_PRICE && (
                        <span className="text-xs text-destructive whitespace-nowrap">Mín. R${MIN_PRICE}</span>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive ml-auto"
                      onClick={() => removeDuration(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}

                {config.durations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma duração cadastrada</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * Preço mínimo de R$ {MIN_PRICE.toFixed(2)} por duração
              </p>
            </GlassCard>
          </TabsContent>

          {/* Audio Categories */}
          <TabsContent value="audio-categorias" className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-primary" />
                  Categorias de Áudios
                </h3>
                <Button size="sm" variant="outline" onClick={addAudioCategory}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              
              <div className="space-y-4">
                {config.audioCategories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-muted/30 rounded-lg space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Input
                        className="w-16 text-center text-xl"
                        placeholder="🎧"
                        value={category.icon}
                        onChange={e => updateAudioCategory(index, 'icon', e.target.value)}
                      />
                      <Input
                        className="flex-1"
                        placeholder="Nome da categoria"
                        value={category.name}
                        onChange={e => updateAudioCategory(index, 'name', e.target.value)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeAudioCategory(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Descrição"
                      value={category.description}
                      onChange={e => updateAudioCategory(index, 'description', e.target.value)}
                    />
                  </motion.div>
                ))}

                {config.audioCategories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Headphones className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma categoria de áudio cadastrada</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Audio Prices */}
          <TabsContent value="audio-precos" className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Preços por Tempo (Áudio)
                </h3>
                <Button size="sm" variant="outline" onClick={addAudioDuration}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              
              <div className="space-y-3">
                {config.audioDurations.map((duration, index) => (
                  <motion.div
                    key={duration.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <Input
                      className="w-32"
                      placeholder="Label"
                      value={duration.label}
                      onChange={e => updateAudioDuration(index, 'label', e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-20"
                        placeholder="Min"
                        type="number"
                        min={1}
                        value={duration.minutes}
                        onChange={e => updateAudioDuration(index, 'minutes', parseInt(e.target.value) || 1)}
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <Input
                        className={`w-24 ${duration.price < MIN_PRICE ? 'border-destructive' : ''}`}
                        placeholder="Preço"
                        type="number"
                        step="0.01"
                        min={MIN_PRICE}
                        value={duration.price}
                        onChange={e => updateAudioDuration(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeAudioDuration(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}

                {config.audioDurations.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma duração cadastrada</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * Preço mínimo de R$ {MIN_PRICE.toFixed(2)} por duração
              </p>
            </GlassCard>
          </TabsContent>

          {/* Rules */}
          <TabsContent value="regras" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
            </div>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  O que PODE
                </h3>
                <Button size="sm" variant="outline" onClick={() => addRule('allowed')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {config.rules.allowed.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={rule}
                      onChange={e => updateRule('allowed', index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeRule('allowed', index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {config.rules.allowed.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    Nenhuma regra "permitido" cadastrada
                  </p>
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShieldX className="w-5 h-5 text-destructive" />
                  O que NÃO PODE
                </h3>
                <Button size="sm" variant="outline" onClick={() => addRule('notAllowed')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {config.rules.notAllowed.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={rule}
                      onChange={e => updateRule('notAllowed', index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeRule('notAllowed', index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {config.rules.notAllowed.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    Nenhuma regra "proibido" cadastrada
                  </p>
                )}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Rules Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pré-visualização das Regras</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-semibold text-sm text-emerald-500">O que pode</h4>
                </div>
                <ul className="space-y-2">
                  {config.rules.allowed.map((rule, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </GlassCard>
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldX className="w-5 h-5 text-destructive" />
                  <h4 className="font-semibold text-sm text-destructive">O que NÃO pode</h4>
                </div>
                <ul className="space-y-2">
                  {config.rules.notAllowed.map((rule, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-destructive mt-0.5">✕</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPrecos;
