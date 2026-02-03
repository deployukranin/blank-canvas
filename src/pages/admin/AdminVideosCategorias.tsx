import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Video, Headphones } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  getVideoConfig,
  saveVideoConfig,
  type VideoConfig,
  type VideoCategory,
  type AudioCategory,
} from '@/lib/video-config';

const AdminVideosCategorias = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setConfig(getVideoConfig());
  }, []);

  const handleSave = () => {
    if (!config) return;
    setIsSaving(true);
    
    setTimeout(() => {
      saveVideoConfig(config);
      toast({
        title: 'Categorias salvas!',
        description: 'As alterações foram aplicadas com sucesso.',
      });
      setIsSaving(false);
    }, 500);
  };

  // Video Categories
  const addVideoCategory = () => {
    if (!config) return;
    const newCategory: VideoCategory = {
      id: `video-category-${Date.now()}`,
      name: 'Nova Categoria',
      description: 'Descrição da categoria',
      icon: '🎬',
    };
    setConfig({ ...config, categories: [...config.categories, newCategory] });
  };

  const updateVideoCategory = (index: number, field: keyof VideoCategory, value: string) => {
    if (!config) return;
    const newCategories = [...config.categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setConfig({ ...config, categories: newCategories });
  };

  const removeVideoCategory = (index: number) => {
    if (!config) return;
    const newCategories = config.categories.filter((_, i) => i !== index);
    setConfig({ ...config, categories: newCategories });
  };

  // Audio Categories
  const addAudioCategory = () => {
    if (!config) return;
    const newCategory: AudioCategory = {
      id: `audio-category-${Date.now()}`,
      name: 'Nova Categoria',
      description: 'Descrição da categoria',
      icon: '🎧',
      basePrice: 29.90,
    };
    setConfig({ ...config, audioCategories: [...config.audioCategories, newCategory] });
  };

  const updateAudioCategory = (index: number, field: keyof AudioCategory, value: string | number) => {
    if (!config) return;
    const newCategories = [...config.audioCategories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setConfig({ ...config, audioCategories: newCategories });
  };

  const removeAudioCategory = (index: number) => {
    if (!config) return;
    const newCategories = config.audioCategories.filter((_, i) => i !== index);
    setConfig({ ...config, audioCategories: newCategories });
  };

  if (!config) {
    return (
      <AdminLayout title="Categorias">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Categorias">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Configure as categorias de vídeos e áudios disponíveis
          </p>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Video Categories */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Categorias de Vídeos
            </h3>
            <Button size="sm" variant="outline" onClick={addVideoCategory}>
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
                    onChange={e => updateVideoCategory(index, 'icon', e.target.value)}
                  />
                  <Input
                    className="flex-1"
                    placeholder="Nome da categoria"
                    value={category.name}
                    onChange={e => updateVideoCategory(index, 'name', e.target.value)}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeVideoCategory(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Descrição"
                  value={category.description}
                  onChange={e => updateVideoCategory(index, 'description', e.target.value)}
                />
              </motion.div>
            ))}

            {config.categories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma categoria de vídeo cadastrada</p>
                <p className="text-sm">Clique em "Adicionar" para criar uma nova categoria</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Audio Categories */}
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
                  <Input
                    className="w-28"
                    placeholder="Preço"
                    type="number"
                    step="0.01"
                    value={category.basePrice}
                    onChange={e => updateAudioCategory(index, 'basePrice', parseFloat(e.target.value) || 0)}
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
                <p className="text-sm">Clique em "Adicionar" para criar uma nova categoria</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </AdminLayout>
  );
};

export default AdminVideosCategorias;
