import { useState, useEffect } from 'react';
import { Save, Video, Eye } from 'lucide-react';
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
} from '@/lib/video-config';

const AdminVideosConfig = () => {
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
        title: 'Configurações salvas!',
        description: 'As alterações foram aplicadas com sucesso.',
      });
      setIsSaving(false);
    }, 500);
  };

  if (!config) {
    return (
      <AdminLayout title="Vídeo Explicativo">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Vídeo Explicativo">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Configure o vídeo explicativo e prazo de entrega
          </p>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

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
              <p className="text-xs text-muted-foreground mt-1">
                Use o formato embed: https://www.youtube.com/embed/VIDEO_ID
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                Quantos dias úteis para entregar o vídeo personalizado
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Preview */}
        {config.previewVideoUrl && (
          <GlassCard className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Pré-visualização
            </h3>
            <div className="aspect-video w-full max-w-xl rounded-lg overflow-hidden bg-black/50">
              <iframe
                src={config.previewVideoUrl}
                title={config.previewTitle}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-4">
              <h4 className="font-medium">{config.previewTitle}</h4>
              <p className="text-sm text-muted-foreground mt-1">{config.previewDescription}</p>
            </div>
          </GlassCard>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminVideosConfig;
