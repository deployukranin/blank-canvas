import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Headphones, Clock } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  getVideoConfig,
  saveVideoConfig,
  type VideoConfig,
  type AudioCategory,
  type AudioDuration,
} from '@/lib/video-config';

const MIN_PRICE = 10;

const AdminAudios = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setConfig(getVideoConfig());
  }, []);

  const handleSave = () => {
    if (!config) return;
    
    // Validate minimum prices
    const invalidDurations = config.audioDurations.filter(d => d.price < MIN_PRICE);
    if (invalidDurations.length > 0) {
      toast({
        title: 'Preço mínimo não atingido',
        description: `O preço mínimo é R$ ${MIN_PRICE.toFixed(2)}. Corrija as durações com preço inferior.`,
        variant: 'destructive',
      });
      return;
    }
    
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

  // Category handlers
  const addCategory = () => {
    if (!config) return;
    const newCategory: AudioCategory = {
      id: `audio-category-${Date.now()}`,
      name: 'Nova Categoria',
      description: 'Descrição da categoria',
      icon: '🎧',
    };
    setConfig({ ...config, audioCategories: [...config.audioCategories, newCategory] });
  };

  const updateCategory = (index: number, field: keyof AudioCategory, value: string) => {
    if (!config) return;
    const newCategories = [...config.audioCategories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setConfig({ ...config, audioCategories: newCategories });
  };

  const removeCategory = (index: number) => {
    if (!config) return;
    const newCategories = config.audioCategories.filter((_, i) => i !== index);
    setConfig({ ...config, audioCategories: newCategories });
  };

  // Duration handlers
  const addDuration = () => {
    if (!config) return;
    const newDuration: AudioDuration = {
      id: `audio-duration-${Date.now()}`,
      label: '5 minutos',
      minutes: 5,
      price: 19.90,
    };
    setConfig({ ...config, audioDurations: [...config.audioDurations, newDuration] });
  };

  const updateDuration = (index: number, field: keyof AudioDuration, value: string | number) => {
    if (!config) return;
    const newDurations = [...config.audioDurations];
    newDurations[index] = { ...newDurations[index], [field]: value };
    setConfig({ ...config, audioDurations: newDurations });
  };

  const removeDuration = (index: number) => {
    if (!config) return;
    const newDurations = config.audioDurations.filter((_, i) => i !== index);
    setConfig({ ...config, audioDurations: newDurations });
  };

  if (!config) {
    return (
      <AdminLayout title="Áudios">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Áudios">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Configure as categorias e durações de áudios personalizados
          </p>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Durations Section */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Durações e Preços
            </h3>
            <Button size="sm" variant="outline" onClick={addDuration}>
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
                  onChange={e => updateDuration(index, 'label', e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Input
                    className="w-20"
                    placeholder="Min"
                    type="number"
                    min={1}
                    value={duration.minutes}
                    onChange={e => updateDuration(index, 'minutes', parseInt(e.target.value) || 1)}
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

        {/* Categories Section */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Headphones className="w-5 h-5 text-primary" />
              Categorias de Áudios
            </h3>
            <Button size="sm" variant="outline" onClick={addCategory}>
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
              </motion.div>
            ))}

            {config.audioCategories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Headphones className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma categoria de áudio cadastrada</p>
                <p className="text-sm">Clique em "Adicionar" para criar uma nova categoria</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </AdminLayout>
  );
};

export default AdminAudios;
