import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Tag } from 'lucide-react';
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

  const addCategory = () => {
    if (!config) return;
    const newCategory: VideoCategory = {
      id: `category-${Date.now()}`,
      name: 'Nova Categoria',
      description: 'Descrição da categoria',
      icon: '🎬',
    };
    setConfig({ ...config, categories: [...config.categories, newCategory] });
  };

  const updateCategory = (index: number, field: keyof VideoCategory, value: string) => {
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
            Configure as categorias de vídeos disponíveis
          </p>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

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

            {config.categories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma categoria cadastrada</p>
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
