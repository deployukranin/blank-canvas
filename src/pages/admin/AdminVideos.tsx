import { useState, useEffect } from 'react';
import { Save, Video, Headphones, Eye, EyeOff, ImageIcon, Loader2, Clock } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { usePersistentConfig } from '@/hooks/use-persistent-config';
import { MediaUpload } from '@/components/admin/MediaUpload';
import {
  defaultVideoConfig,
  saveVideoConfig,
  type VideoConfig,
} from '@/lib/video-config';

const AdminVideos = () => {
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

  useEffect(() => {
    if (!isLoading) {
      saveVideoConfig(config);
    }
  }, [config, isLoading]);

  const handleSave = async () => {
    await saveNow();
  };

  if (isLoading) {
    return (
      <AdminLayout title="Previews">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Carregando configurações...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Previews">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Configure os previews de vídeo e áudio exibidos na página de pedidos
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

        {/* Video Preview Section */}
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Preview de Vídeo
          </h3>
          
          {/* Toggle: Show/Hide */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              {config.previewEnabled ? (
                <Eye className="w-5 h-5 text-primary" />
              ) : (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <span className="font-medium text-sm">Exibir Seção "Como Funciona"</span>
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
                  {config.previewType === 'video' ? 'Vídeo' : 'Imagem'}
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
              <MediaUpload
                currentUrl={config.previewVideoUrl}
                onUrlChange={(url) => setConfig({ ...config, previewVideoUrl: url })}
                accept="video/mp4,video/webm,video/quicktime"
                label="Vídeo de Preview"
                placeholder="https://www.youtube.com/embed/..."
                hint="Envie um vídeo ou use uma URL do YouTube (formato embed)"
                disabled={!config.previewEnabled}
                folder="video-previews"
              />
            ) : (
              <MediaUpload
                currentUrl={config.previewImageUrl}
                onUrlChange={(url) => setConfig({ ...config, previewImageUrl: url })}
                accept="image/jpeg,image/png,image/webp"
                label="Imagem de Preview"
                placeholder="https://exemplo.com/imagem.jpg"
                hint="Envie uma imagem (JPG, PNG, WebP) ou insira uma URL"
                disabled={!config.previewEnabled}
                folder="image-previews"
              />
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Título</label>
              <Input
                placeholder="Título do preview"
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
          </div>

          {/* Video Preview */}
          {config.previewEnabled && (config.previewType === 'video' ? config.previewVideoUrl : config.previewImageUrl) && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium mb-3">Pré-visualização:</p>
              <div className="aspect-video w-full max-w-xl rounded-lg overflow-hidden bg-muted/30">
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
            </div>
          )}
        </GlassCard>

        {/* Audio Preview Section */}
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            Preview de Áudio
          </h3>
          
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              {config.audioPreviewEnabled ? (
                <Eye className="w-5 h-5 text-primary" />
              ) : (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <span className="font-medium text-sm">Exibir Preview</span>
                <p className="text-xs text-muted-foreground">
                  {config.audioPreviewEnabled ? 'Visível na página de pedidos' : 'Oculto da página de pedidos'}
                </p>
              </div>
            </div>
            <Switch
              checked={config.audioPreviewEnabled}
              onCheckedChange={(checked) => 
                setConfig({ ...config, audioPreviewEnabled: checked })
              }
            />
          </div>

          <MediaUpload
            currentUrl={config.audioPreviewUrl}
            onUrlChange={(url) => setConfig({ ...config, audioPreviewUrl: url })}
            accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm"
            label="Arquivo de Áudio (MP3)"
            placeholder="https://exemplo.com/audio-preview.mp3"
            hint="Envie um arquivo MP3 ou insira uma URL"
            disabled={!config.audioPreviewEnabled}
            folder="audio-previews"
          />

          {config.audioPreviewEnabled && config.audioPreviewUrl && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium mb-2">Pré-visualização:</p>
              <audio controls className="w-full" src={config.audioPreviewUrl}>
                Seu navegador não suporta áudio.
              </audio>
            </div>
          )}
        </GlassCard>

        {/* Delivery Days */}
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Prazo de Entrega
          </h3>
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
        </GlassCard>
      </div>
    </AdminLayout>
  );
};

export default AdminVideos;
