import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Plus, 
  Trash2, 
  Clock, 
  Tag, 
  ShieldCheck, 
  ShieldX,
  Video,
  Eye
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  getVideoConfig,
  saveVideoConfig,
  type VideoConfig,
  type VideoDuration,
  type VideoCategory,
} from '@/lib/video-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const AdminVideosConfig = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setConfig(getVideoConfig());
  }, []);

  const handleSave = () => {
    if (!config) return;
    setIsSaving(true);
    
    setTimeout(() => {
      saveVideoConfig(config);
      toast({
        title: 'Configurações salvas!',
        description: 'As alterações foram aplicadas com sucesso.',
      });
      setIsSaving(false);
    }, 500);
  };

  // Duration handlers
  const addDuration = () => {
    if (!config) return;
    const newDuration: VideoDuration = {
      id: `duration-${Date.now()}`,
      label: 'Nova duração',
      minutes: 5,
      price: 49.90,
    };
    setConfig({ ...config, durations: [...config.durations, newDuration] });
  };

  const updateDuration = (index: number, field: keyof VideoDuration, value: string | number) => {
    if (!config) return;
    const newDurations = [...config.durations];
    newDurations[index] = { ...newDurations[index], [field]: value };
    setConfig({ ...config, durations: newDurations });
  };

  const removeDuration = (index: number) => {
    if (!config) return;
    const newDurations = config.durations.filter((_, i) => i !== index);
    setConfig({ ...config, durations: newDurations });
  };

  // Category handlers
  const addCategory = () => {
    if (!config) return;
    const newCategory: VideoCategory = {
      id: `category-${Date.now()}`,
      name: 'Nova Categoria',
      description: 'Descrição da categoria',
      icon: '🎬',
      priceModifier: 1.0,
    };
    setConfig({ ...config, categories: [...config.categories, newCategory] });
  };

  const updateCategory = (index: number, field: keyof VideoCategory, value: string | number) => {
    if (!config) return;
    const newCategories = [...config.categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setConfig({ ...config, categories: newCategories });
  };

  const removeCategory = (index: number) => {
    if (!config) return;
    const newCategories = config.categories.filter((_, i) => i !== index);
    setConfig({ ...config, categories: newCategories });
  };

  // Rules handlers
  const addRule = (type: 'allowed' | 'notAllowed') => {
    if (!config) return;
    const newRules = { ...config.rules };
    newRules[type] = [...newRules[type], 'Nova regra'];
    setConfig({ ...config, rules: newRules });
  };

  const updateRule = (type: 'allowed' | 'notAllowed', index: number, value: string) => {
    if (!config) return;
    const newRules = { ...config.rules };
    newRules[type][index] = value;
    setConfig({ ...config, rules: newRules });
  };

  const removeRule = (type: 'allowed' | 'notAllowed', index: number) => {
    if (!config) return;
    const newRules = { ...config.rules };
    newRules[type] = newRules[type].filter((_, i) => i !== index);
    setConfig({ ...config, rules: newRules });
  };

  if (!config) {
    return (
      <AdminLayout title="Config. Vídeos">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Config. Vídeos">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Configure preços, categorias e regras dos vídeos personalizados
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview">Vídeo</TabsTrigger>
            <TabsTrigger value="durations">Duração</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="rules">Regras</TabsTrigger>
          </TabsList>

          {/* Preview Video Tab */}
          <TabsContent value="preview" className="space-y-4">
            <GlassCard className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Vídeo Explicativo
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">URL do Vídeo (YouTube Embed)</label>
                  <Input
                    placeholder="https://www.youtube.com/embed/..."
                    value={config.previewVideoUrl}
                    onChange={e => setConfig({ ...config, previewVideoUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Título</label>
                  <Input
                    placeholder="Título do vídeo"
                    value={config.previewTitle}
                    onChange={e => setConfig({ ...config, previewTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Descrição</label>
                  <Textarea
                    placeholder="Descrição breve"
                    value={config.previewDescription}
                    onChange={e => setConfig({ ...config, previewDescription: e.target.value })}
                    className="min-h-[80px]"
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
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Durations Tab */}
          <TabsContent value="durations" className="space-y-4">
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
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <Input
                      className="w-32"
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
                        className="w-24"
                        step="0.01"
                        min={0}
                        value={duration.price}
                        onChange={e => updateDuration(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeDuration(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Categorias
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Mod:</span>
                        <Input
                          type="number"
                          className="w-20"
                          step="0.05"
                          min={0.5}
                          max={3}
                          value={category.priceModifier}
                          onChange={e => updateCategory(index, 'priceModifier', parseFloat(e.target.value) || 1)}
                        />
                        <span className="text-xs text-muted-foreground">x</span>
                      </div>
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
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-4">
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

export default AdminVideosConfig;
