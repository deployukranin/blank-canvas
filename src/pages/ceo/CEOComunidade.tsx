import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Save, RotateCcw, Bell, Lightbulb, Eye, Video, Crown, Plus, Trash2, Star, MessageCircle, Gift, Zap, Heart } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type BenefitIcon = 'star' | 'bell' | 'message' | 'gift' | 'zap' | 'heart';

const benefitIconOptions: { value: BenefitIcon; label: string; icon: React.ReactNode }[] = [
  { value: 'star', label: 'Estrela', icon: <Star className="w-4 h-4" /> },
  { value: 'bell', label: 'Sino', icon: <Bell className="w-4 h-4" /> },
  { value: 'message', label: 'Mensagem', icon: <MessageCircle className="w-4 h-4" /> },
  { value: 'gift', label: 'Presente', icon: <Gift className="w-4 h-4" /> },
  { value: 'zap', label: 'Raio', icon: <Zap className="w-4 h-4" /> },
  { value: 'heart', label: 'Coração', icon: <Heart className="w-4 h-4" /> },
];

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
    vipTabEnabled: config.community.vipTabEnabled ?? true,
    vipTabLabel: config.community.vipTabLabel ?? 'Área VIP',
    vipTitle: config.community.vipTitle ?? 'Área VIP',
    vipDescription: config.community.vipDescription ?? 'Conteúdo exclusivo para membros VIP.',
    vipButtonLabel: config.community.vipButtonLabel ?? 'Tornar-se VIP',
    vipBenefits: config.community.vipBenefits ?? [
      { id: '1', title: 'Conteúdos Exclusivos', description: 'Acesso a vídeos e áudios especiais', icon: 'star' as BenefitIcon },
      { id: '2', title: 'Acesso Antecipado', description: 'Seja o primeiro a ver novos conteúdos', icon: 'bell' as BenefitIcon },
      { id: '3', title: 'Chat Exclusivo', description: 'Converse diretamente com a comunidade VIP', icon: 'message' as BenefitIcon },
    ],
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
    const defaultData = {
      title: 'Fórum da comunidade',
      description: 'Participe das discussões e compartilhe suas ideias',
      videosTabEnabled: true,
      videosTabLabel: 'Vídeos',
      avisosTabLabel: 'Avisos',
      ideiasTabLabel: 'Ideias',
      vipTabEnabled: true,
      vipTabLabel: 'Área VIP',
      vipTitle: 'Área VIP',
      vipDescription: 'Conteúdo exclusivo para membros VIP. Acesse benefícios especiais, conteúdos antecipados e muito mais.',
      vipButtonLabel: 'Tornar-se VIP',
      vipBenefits: [
        { id: '1', title: 'Conteúdos Exclusivos', description: 'Acesso a vídeos e áudios especiais', icon: 'star' as BenefitIcon },
        { id: '2', title: 'Acesso Antecipado', description: 'Seja o primeiro a ver novos conteúdos', icon: 'bell' as BenefitIcon },
        { id: '3', title: 'Chat Exclusivo', description: 'Converse diretamente com a comunidade VIP', icon: 'message' as BenefitIcon },
      ],
    };
    setFormData(defaultData);
    toast({
      title: 'Configurações resetadas',
      description: 'As configurações voltaram ao padrão.',
    });
  };

  const addBenefit = () => {
    const newBenefit = {
      id: Date.now().toString(),
      title: 'Novo Benefício',
      description: 'Descrição do benefício',
      icon: 'star' as BenefitIcon,
    };
    setFormData({ ...formData, vipBenefits: [...formData.vipBenefits, newBenefit] });
  };

  const removeBenefit = (id: string) => {
    setFormData({ ...formData, vipBenefits: formData.vipBenefits.filter(b => b.id !== id) });
  };

  const updateBenefit = (id: string, field: string, value: string) => {
    setFormData({
      ...formData,
      vipBenefits: formData.vipBenefits.map(b => 
        b.id === id ? { ...b, [field]: value } : b
      ),
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
          </GlassCard>

          {/* VIP Tab Config */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vip to-amber-600 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-950" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-100">Configurações da Área VIP</h3>
                <p className="text-xs text-amber-400/70">Personalize a aba VIP e seus benefícios</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label className="text-amber-100">Aba VIP</Label>
                  <p className="text-xs text-amber-400/70">Mostra/oculta a aba VIP na comunidade</p>
                </div>
                <Switch
                  checked={formData.vipTabEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, vipTabEnabled: checked })}
                />
              </div>

              {formData.vipTabEnabled && (
                <>
                  <div>
                    <Label className="text-amber-100">Label da Aba</Label>
                    <Input
                      value={formData.vipTabLabel}
                      onChange={(e) => setFormData({ ...formData, vipTabLabel: e.target.value })}
                      placeholder="Ex: Área VIP"
                      className="mt-1.5 bg-amber-950/30 border-amber-600/30"
                    />
                  </div>

                  <div>
                    <Label className="text-amber-100">Título</Label>
                    <Input
                      value={formData.vipTitle}
                      onChange={(e) => setFormData({ ...formData, vipTitle: e.target.value })}
                      placeholder="Ex: Área VIP"
                      className="mt-1.5 bg-amber-950/30 border-amber-600/30"
                    />
                  </div>

                  <div>
                    <Label className="text-amber-100">Descrição</Label>
                    <Textarea
                      value={formData.vipDescription}
                      onChange={(e) => setFormData({ ...formData, vipDescription: e.target.value })}
                      placeholder="Descrição da área VIP..."
                      className="mt-1.5 bg-amber-950/30 border-amber-600/30"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-amber-100">Texto do Botão</Label>
                    <Input
                      value={formData.vipButtonLabel}
                      onChange={(e) => setFormData({ ...formData, vipButtonLabel: e.target.value })}
                      placeholder="Ex: Tornar-se VIP"
                      className="mt-1.5 bg-amber-950/30 border-amber-600/30"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-amber-100">Benefícios</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addBenefit}
                        className="gap-1 border-amber-600/30 text-amber-400 h-7 text-xs"
                      >
                        <Plus className="w-3 h-3" />
                        Adicionar
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {formData.vipBenefits.map((benefit) => (
                        <div key={benefit.id} className="p-3 rounded-lg bg-amber-950/20 border border-amber-600/20 space-y-2">
                          <div className="flex items-center gap-2">
                            <Select
                              value={benefit.icon}
                              onValueChange={(value) => updateBenefit(benefit.id, 'icon', value)}
                            >
                              <SelectTrigger className="w-24 h-8 bg-amber-950/30 border-amber-600/30">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {benefitIconOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    <div className="flex items-center gap-2">
                                      {opt.icon}
                                      <span>{opt.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={benefit.title}
                              onChange={(e) => updateBenefit(benefit.id, 'title', e.target.value)}
                              placeholder="Título"
                              className="flex-1 h-8 bg-amber-950/30 border-amber-600/30 text-sm"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeBenefit(benefit.id)}
                              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <Input
                            value={benefit.description}
                            onChange={(e) => updateBenefit(benefit.id, 'description', e.target.value)}
                            placeholder="Descrição"
                            className="h-8 bg-amber-950/30 border-amber-600/30 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700">
              <Save className="w-4 h-4" />
              Salvar Alterações
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2 border-amber-600/30 text-amber-400">
              <RotateCcw className="w-4 h-4" />
              Resetar
            </Button>
          </div>
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
                <Tabs defaultValue={formData.vipTabEnabled ? 'vip' : (formData.videosTabEnabled ? 'videos' : 'avisos')} className="w-full">
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
                    {formData.vipTabEnabled && (
                      <TabsTrigger value="vip" className="flex-1 gap-2">
                        <Crown className="w-4 h-4" />
                        {formData.vipTabLabel || 'Área VIP'}
                      </TabsTrigger>
                    )}
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

                  {formData.vipTabEnabled && (
                    <TabsContent value="vip" className="mt-4">
                      <div className="p-4 rounded-lg bg-gradient-to-br from-vip/10 to-primary/5 border border-vip/20 text-center">
                        <Crown className="w-8 h-8 mx-auto mb-2 text-vip" />
                        <h4 className="font-medium text-sm mb-1">{formData.vipTitle || 'Área VIP'}</h4>
                        <p className="text-xs text-muted-foreground mb-3">{formData.vipDescription}</p>
                        <div className="space-y-2 mb-3">
                          {formData.vipBenefits.slice(0, 2).map((benefit) => (
                            <div key={benefit.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="w-5 h-5 rounded-full bg-vip/20 flex items-center justify-center">
                                {benefit.icon === 'star' && <Star className="w-3 h-3 text-vip" />}
                                {benefit.icon === 'bell' && <Bell className="w-3 h-3 text-vip" />}
                                {benefit.icon === 'message' && <MessageCircle className="w-3 h-3 text-vip" />}
                                {benefit.icon === 'gift' && <Gift className="w-3 h-3 text-vip" />}
                                {benefit.icon === 'zap' && <Zap className="w-3 h-3 text-vip" />}
                                {benefit.icon === 'heart' && <Heart className="w-3 h-3 text-vip" />}
                              </div>
                              <span>{benefit.title}</span>
                            </div>
                          ))}
                        </div>
                        <Button size="sm" className="bg-vip hover:bg-vip/90 text-xs h-7">
                          {formData.vipButtonLabel || 'Tornar-se VIP'}
                        </Button>
                      </div>
                    </TabsContent>
                  )}
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
