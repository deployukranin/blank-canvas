import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Video, Clock, ShieldCheck, ShieldX, Eye, EyeOff, ImageIcon, Loader2 } from 'lucide-react';
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
} from '@/lib/video-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const AdminVideos = () => {
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

  // Also update the local cache for sync access
  useEffect(() => {
    if (!isLoading) {
      saveVideoConfig(config);
    }
  }, [config, isLoading]);

  const handleSave = async () => {
    await saveNow();
  };

  // Categories
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
    setConfig(prev => {
      const newCategories = prev.categories.filter((_, i) => i !== index);
      return { ...prev, categories: newCategories };
    });
  };

  // Durations
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
    setConfig(prev => {
      const newDurations = prev.durations.filter((_, i) => i !== index);
      return { ...prev, durations: newDurations };
    });
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
      <AdminLayout title="Vídeos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Carregando configurações...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Vídeos">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Configure vídeos personalizados, categorias, preços e regras
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

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="precos">Preços</TabsTrigger>
            <TabsTrigger value="regras">Regras</TabsTrigger>
          </TabsList>

          {/* Tab: Geral */}
          <TabsContent value="geral" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Seção "Como Funciona"
              </h3>
              
              {/* Toggle: Show/Hide Preview Section */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  {config.previewEnabled ? (
                    <Eye className="w-5 h-5 text-primary" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <span className="font-medium text-sm">Exibir Seção</span>
                    <p className="text-xs text-muted-foreground">
                      {config.previewEnabled ? 'Visível na página de pedidos' : 'Oculto da página de pedidos'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.previewEnabled}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, previewEnabled: checked })
                  }
                />
              </div>

              {/* Toggle: Video or Image */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  {config.previewType === 'video' ? (
                    <Video className="w-5 h-5 text-primary" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-primary" />
                  )}
                  <div>
                    <span className="font-medium text-sm">Tipo de Mídia</span>
                    <p className="text-xs text-muted-foreground">
                      {config.previewType === 'video' ? 'Vídeo do YouTube' : 'Imagem'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Imagem</span>
                  <Switch
                    checked={config.previewType === 'video'}
                    onCheckedChange={(checked) => 
                      setConfig({ ...config, previewType: checked ? 'video' : 'image' })
                    }
                    disabled={!config.previewEnabled}
                  />
                  <span className="text-xs text-muted-foreground">Vídeo</span>
                </div>
              </div>

              <div className={`space-y-4 ${!config.previewEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {config.previewType === 'video' ? (
                  <div>
                    <label className="text-sm font-medium mb-2 block">URL do Vídeo (YouTube Embed)</label>
                    <Input
                      placeholder="https://www.youtube.com/embed/..."
                      value={config.previewVideoUrl}
                      onChange={e => setConfig({ ...config, previewVideoUrl: e.target.value })}
                      disabled={!config.previewEnabled}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use o formato embed: https://www.youtube.com/embed/VIDEO_ID
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium mb-2 block">URL da Imagem</label>
                    <Input
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={config.previewImageUrl}
                      onChange={e => setConfig({ ...config, previewImageUrl: e.target.value })}
                      disabled={!config.previewEnabled}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Insira a URL de uma imagem (JPG, PNG, WebP)
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Título</label>
                  <Input
                    placeholder="Título do vídeo"
                    value={config.previewTitle}
                    onChange={e => setConfig({ ...config, previewTitle: e.target.value })}
                    disabled={!config.previewEnabled}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Descrição</label>
                  <Textarea
                    placeholder="Descrição breve"
                    value={config.previewDescription}
                    onChange={e => setConfig({ ...config, previewDescription: e.target.value })}
                    className="min-h-[80px]"
                    disabled={!config.previewEnabled}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Prazo de Entrega (dias)</label>
                  <Input
                    type="number"
                    min={1}
                    value={config.deliveryDays}
                    onChange={e => setConfig({ ...config, deliveryDays: parseInt(e.target.value) || 7 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Quantos dias úteis para entregar o vídeo personalizado
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Preview */}
            {config.previewEnabled && (config.previewType === 'video' ? config.previewVideoUrl : config.previewImageUrl) && (
              <GlassCard className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Pré-visualização
                </h3>
                <div className="aspect-video w-full max-w-xl rounded-lg overflow-hidden bg-black/50">
                  {config.previewType === 'video' ? (
                    <iframe
                      src={config.previewVideoUrl}
                      title={config.previewTitle}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <img 
                      src={config.previewImageUrl} 
                      alt={config.previewTitle}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="mt-4">
                  <h4 className="font-medium">{config.previewTitle}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{config.previewDescription}</p>
                </div>
              </GlassCard>
            )}
          </TabsContent>

          {/* Tab: Categorias */}
          <TabsContent value="categorias" className="space-y-6">
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

          {/* Tab: Preços */}
          <TabsContent value="precos" className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Preços por Tempo
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
                        className={`w-24 ${duration.price < 10 ? 'border-destructive' : ''}`}
                        step="0.01"
                        min={10}
                        value={duration.price}
                        onChange={e => updateDuration(index, 'price', parseFloat(e.target.value) || 10)}
                      />
                      {duration.price < 10 && (
                        <span className="text-xs text-destructive whitespace-nowrap">Mín. R$10</span>
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
                    <p className="text-sm">Clique em "Adicionar" para criar uma nova opção</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Tab: Regras */}
          <TabsContent value="regras" className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
            </div>

            {/* Allowed Rules */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
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
                  <p className="text-center py-4 text-muted-foreground">
                    Nenhuma regra "permitido" cadastrada
                  </p>
                )}
              </div>
            </GlassCard>

            {/* Not Allowed Rules */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShieldX className="w-5 h-5 text-red-500" />
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
                  <p className="text-center py-4 text-muted-foreground">
                    Nenhuma regra "proibido" cadastrada
                  </p>
                )}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visualização das Regras</DialogTitle>
              <DialogDescription>
                Como os usuários verão as regras na página de vídeos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="font-semibold text-green-500 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  O que pode
                </h4>
                <ul className="space-y-1">
                  {config.rules.allowed.map((rule, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h4 className="font-semibold text-red-500 mb-3 flex items-center gap-2">
                  <ShieldX className="w-5 h-5" />
                  O que NÃO pode
                </h4>
                <ul className="space-y-1">
                  {config.rules.notAllowed.map((rule, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-red-500">✕</span>
                      {rule}
                    </li>
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

export default AdminVideos;
