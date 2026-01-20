import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Save, RotateCcw, Bell, Lightbulb, Eye, Video } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CEOComunidade = () => {
  const { config, updateCommunity, resetCommunityToDefaults } = useWhiteLabel();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: config.community.title,
    description: config.community.description,
    videosTabEnabled: config.community.videosTabEnabled,
    videosTabLabel: config.community.videosTabLabel,
    avisosTabLabel: config.community.avisosTabLabel,
    ideiasTabLabel: config.community.ideiasTabLabel,
  });

  const handleSave = () => {
    updateCommunity(formData);
    toast({
      title: 'Configurações salvas!',
      description: 'As configurações da comunidade foram atualizadas.',
    });
  };

  const handleReset = () => {
    resetCommunityToDefaults();
    setFormData({
      title: 'Fórum da comunidade',
      description: 'Participe das discussões e compartilhe suas ideias',
      videosTabEnabled: true,
      videosTabLabel: 'Vídeos',
      avisosTabLabel: 'Avisos',
      ideiasTabLabel: 'Ideias',
    });
    toast({
      title: 'Configurações resetadas',
      description: 'As configurações voltaram ao padrão.',
    });
  };

  return (
    <CEOLayout title="Configurar Comunidade">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-950" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-100">Configurações do Fórum</h3>
                <p className="text-xs text-amber-400/70">Personalize título, descrição e labels</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-amber-100">Título do Fórum</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Fórum da comunidade"
                  className="mt-1.5 bg-amber-950/30 border-amber-600/30"
                />
              </div>

              <div>
                <Label className="text-amber-100">Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Participe das discussões..."
                  className="mt-1.5 bg-amber-950/30 border-amber-600/30"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-amber-100">Aba de Vídeos</Label>
                    <p className="text-xs text-amber-400/70">Mostra/oculta a galeria de vídeos dentro da comunidade</p>
                  </div>
                  <Switch
                    checked={formData.videosTabEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, videosTabEnabled: checked })}
                  />
                </div>

                {formData.videosTabEnabled && (
                  <div>
                    <Label className="text-amber-100">Label da Aba Vídeos</Label>
                    <Input
                      value={formData.videosTabLabel}
                      onChange={(e) => setFormData({ ...formData, videosTabLabel: e.target.value })}
                      placeholder="Ex: Vídeos"
                      className="mt-1.5 bg-amber-950/30 border-amber-600/30"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-amber-100">Label da Aba Avisos</Label>
                    <Input
                      value={formData.avisosTabLabel}
                      onChange={(e) => setFormData({ ...formData, avisosTabLabel: e.target.value })}
                      placeholder="Ex: Avisos"
                      className="mt-1.5 bg-amber-950/30 border-amber-600/30"
                    />
                  </div>
                  <div>
                    <Label className="text-amber-100">Label da Aba Ideias</Label>
                    <Input
                      value={formData.ideiasTabLabel}
                      onChange={(e) => setFormData({ ...formData, ideiasTabLabel: e.target.value })}
                      placeholder="Ex: Ideias"
                      className="mt-1.5 bg-amber-950/30 border-amber-600/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700">
                <Save className="w-4 h-4" />
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2 border-amber-600/30 text-amber-400">
                <RotateCcw className="w-4 h-4" />
                Resetar
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Pré-visualização</span>
          </div>

          <GlassCard className="p-4 bg-background/50">
            <div className="rounded-xl overflow-hidden border border-border/50">
              {/* Preview Header */}
              <div className="bg-card/50 px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {formData.title || 'Fórum da comunidade'}
                  </span>
                </div>
                {formData.description && (
                  <p className="text-xs text-muted-foreground mt-1">{formData.description}</p>
                )}
              </div>

              {/* Preview Tabs */}
              <div className="p-4">
                <Tabs defaultValue={formData.videosTabEnabled ? 'videos' : 'avisos'} className="w-full">
                  <TabsList className="w-full bg-card/50">
                    {formData.videosTabEnabled && (
                      <TabsTrigger value="videos" className="flex-1 gap-2">
                        <Video className="w-4 h-4" />
                        {formData.videosTabLabel || 'Vídeos'}
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="avisos" className="flex-1 gap-2">
                      <Bell className="w-4 h-4" />
                      {formData.avisosTabLabel || 'Avisos'}
                    </TabsTrigger>
                    <TabsTrigger value="ideias" className="flex-1 gap-2">
                      <Lightbulb className="w-4 h-4" />
                      {formData.ideiasTabLabel || 'Ideias'}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="avisos" className="mt-4">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-xs">🌙</span>
                          </div>
                          <span className="text-sm font-medium">@luna_asmr</span>
                          <span className="text-xs text-muted-foreground">2h</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Exemplo de aviso...</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ideias" className="mt-4">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                            <span className="text-xs">💡</span>
                          </div>
                          <span className="text-sm font-medium">@user</span>
                          <span className="text-xs text-muted-foreground">1d</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Exemplo de ideia...</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </CEOLayout>
  );
};

export default CEOComunidade;
