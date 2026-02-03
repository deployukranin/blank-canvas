import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Clock } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  getVideoConfig,
  saveVideoConfig,
  type VideoConfig,
  type VideoDuration,
} from '@/lib/video-config';

const AdminVideosDuracao = () => {
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
        title: 'Durações salvas!',
        description: 'As alterações foram aplicadas com sucesso.',
      });
      setIsSaving(false);
    }, 500);
  };

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

  if (!config) {
    return (
      <AdminLayout title="Duração & Preços">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Duração & Preços">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Configure as durações disponíveis e seus preços
          </p>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

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
      </div>
    </AdminLayout>
  );
};

export default AdminVideosDuracao;
