import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Check, Image, Trash2, Plus, Monitor, Smartphone, Info, Eye, Upload, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWhiteLabel, type BannerConfig } from '@/contexts/WhiteLabelContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

// ── Color Templates ──
interface ColorTemplate {
  id: string;
  label: string;
  primary: string;
  accent: string;
  mode: 'dark' | 'light';
  preview: string;
}

const darkTemplates: ColorTemplate[] = [
  { id: 'purple', label: 'Purple', primary: '263 70% 58%', accent: '263 50% 25%', mode: 'dark', preview: 'bg-purple-500' },
  { id: 'red', label: 'Red', primary: '0 72% 51%', accent: '0 50% 25%', mode: 'dark', preview: 'bg-red-500' },
  { id: 'green', label: 'Green', primary: '142 71% 45%', accent: '142 50% 22%', mode: 'dark', preview: 'bg-green-500' },
  { id: 'blue', label: 'Blue', primary: '217 91% 60%', accent: '217 50% 25%', mode: 'dark', preview: 'bg-blue-500' },
  { id: 'pink', label: 'Pink', primary: '330 81% 60%', accent: '330 50% 25%', mode: 'dark', preview: 'bg-pink-500' },
  { id: 'yellow', label: 'Yellow', primary: '45 93% 47%', accent: '45 50% 25%', mode: 'dark', preview: 'bg-yellow-500' },
];

const lightTemplates: ColorTemplate[] = [
  { id: 'light-purple', label: 'Purple', primary: '263 70% 55%', accent: '263 40% 92%', mode: 'light', preview: 'bg-purple-500' },
  { id: 'light-red', label: 'Red', primary: '0 72% 50%', accent: '0 40% 92%', mode: 'light', preview: 'bg-red-500' },
  { id: 'light-green', label: 'Green', primary: '142 71% 40%', accent: '142 40% 92%', mode: 'light', preview: 'bg-green-500' },
  { id: 'light-blue', label: 'Blue', primary: '217 91% 55%', accent: '217 40% 92%', mode: 'light', preview: 'bg-blue-500' },
  { id: 'light-pink', label: 'Pink', primary: '330 81% 55%', accent: '330 40% 92%', mode: 'light', preview: 'bg-pink-500' },
  { id: 'light-yellow', label: 'Yellow', primary: '45 93% 40%', accent: '45 40% 92%', mode: 'light', preview: 'bg-yellow-500' },
];

const allTemplates = [...darkTemplates, ...lightTemplates];

const generateId = () => Math.random().toString(36).substring(2, 10);
const BUCKET = 'banners';

const AdminPersonalizacao: React.FC = () => {
  const { toast } = useToast();
  const { config, setConfig, updateColors } = useWhiteLabel();
  const { t } = useTranslation();

  // ── Color state ──
  const activeTemplate = allTemplates.find(
    (tmpl) => tmpl.primary === config.colors.primary && tmpl.mode === (config.colors.mode || 'dark')
  ) || allTemplates[0];

  const handleSelectTemplate = (template: ColorTemplate) => {
    updateColors({
      primary: template.primary,
      accent: template.accent,
      background: template.mode === 'light' ? '0 0% 98%' : '0 0% 4%',
      mode: template.mode,
    });
    toast({ title: t('admin.settings.themeSaved', 'Tema atualizado!'), description: `${template.label} (${template.mode})` });
  };

  // ── Banner state ──
  const [heroGreeting, setHeroGreeting] = useState(config.heroGreeting || 'Bem-vindo! 🤍');
  const [heroSubtitle, setHeroSubtitle] = useState(config.heroSubtitle || 'Relaxe com ASMR de qualidade');
  const [banners, setBanners] = useState<BannerConfig[]>(
    config.banners?.length ? config.banners : [{ id: generateId(), desktopUrl: '', mobileUrl: '', enabled: true }]
  );
  const [previewBanner, setPreviewBanner] = useState<{ url: string; type: string } | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const canAdd = banners.length < 3;

  const addBanner = () => { if (canAdd) setBanners(prev => [...prev, { id: generateId(), desktopUrl: '', mobileUrl: '', enabled: true }]); };
  const removeBanner = (id: string) => setBanners(prev => prev.filter(b => b.id !== id));
  const updateBanner = (id: string, field: keyof BannerConfig, value: string | boolean) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const uploadFile = async (file: File, bannerId: string, variant: 'desktop' | 'mobile') => {
    const uploadKey = `${bannerId}-${variant}`;
    setUploading(prev => ({ ...prev, [uploadKey]: true }));
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${bannerId}/${variant}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      updateBanner(bannerId, variant === 'desktop' ? 'desktopUrl' : 'mobileUrl', publicUrl);
      toast({ title: t('admin.banners.uploadSuccess', 'Imagem enviada!') });
    } catch (err: any) {
      toast({ title: t('admin.banners.uploadError', 'Falha no upload'), description: err.message, variant: 'destructive' });
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleFileSelect = (bannerId: string, variant: 'desktop' | 'mobile') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: t('admin.banners.fileTooLarge', 'Arquivo muito grande'), description: t('admin.banners.maxSize', 'Máximo 5MB.'), variant: 'destructive' });
          return;
        }
        uploadFile(file, bannerId, variant);
      }
    };
    input.click();
  };

  const handleSaveBanners = () => {
    const enabledBanners = banners.filter(b => b.enabled && (b.desktopUrl || b.mobileUrl));
    const bannerImages = enabledBanners.map(b => b.desktopUrl || b.mobileUrl).filter(Boolean);
    setConfig({
      ...config,
      banners,
      heroGreeting,
      heroSubtitle,
      bannerImages: bannerImages.length > 0 ? bannerImages : config.bannerImages,
      bannerImage: bannerImages[0] || config.bannerImage,
    });
    toast({ title: t('admin.banners.saved', 'Banners salvos!') });
  };

  const renderUploadArea = (banner: BannerConfig, variant: 'desktop' | 'mobile', index: number) => {
    const field = variant === 'desktop' ? 'desktopUrl' : 'mobileUrl';
    const url = banner[field];
    const uploadKey = `${banner.id}-${variant}`;
    const isUploading = uploading[uploadKey];
    const isDesktop = variant === 'desktop';

    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          {isDesktop ? <Monitor className="w-4 h-4 text-primary/70" /> : <Smartphone className="w-4 h-4 text-primary/70" />}
          {isDesktop ? 'Desktop' : 'Mobile'}
        </Label>
        {url ? (
          <div className="relative group">
            <div className={`relative rounded-lg overflow-hidden bg-background/30 border border-border/20 ${isDesktop ? 'w-full h-28' : 'w-32 h-40'}`}>
              <img src={url} alt={`${variant} Banner ${index + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/70 hover:bg-background text-foreground" onClick={() => setPreviewBanner({ url, type: isDesktop ? 'Desktop' : 'Mobile' })}><Eye className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-destructive/70 hover:bg-destructive text-destructive-foreground" onClick={() => updateBanner(banner.id, field, '')}><X className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        ) : (
          <div onClick={() => !isUploading && handleFileSelect(banner.id, variant)} className={`rounded-lg border-2 border-dashed border-border/40 hover:border-primary/40 bg-background/20 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${isDesktop ? 'w-full h-28' : 'w-32 h-40'}`}>
            {isUploading ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : (<><Upload className="w-5 h-5 text-muted-foreground" /><span className="text-xs text-muted-foreground">{t('admin.banners.clickToUpload', 'Clique para enviar')}</span></>)}
          </div>
        )}
        <Input placeholder={`URL ${isDesktop ? 'Desktop' : 'Mobile'}`} value={url} onChange={(e) => updateBanner(banner.id, field, e.target.value)} className="bg-background/50 border-border/30 text-xs h-8" />
      </div>
    );
  };

  return (
    <AdminLayout title={t('admin.personalization', 'Personalização')}>
      <div className="max-w-3xl mx-auto">
        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="colors" className="gap-2"><Palette className="w-4 h-4" />{t('admin.settings.colorTheme', 'Cores')}</TabsTrigger>
            <TabsTrigger value="banners" className="gap-2"><Image className="w-4 h-4" />{t('admin.banners.title', 'Banners')}</TabsTrigger>
          </TabsList>

          {/* ── Colors Tab ── */}
          <TabsContent value="colors">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="p-6">
                <p className="text-sm text-muted-foreground mb-6">{t('admin.settings.colorThemeDesc', 'Escolha um template de cores para sua plataforma.')}</p>

                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dark</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
                  {darkTemplates.map((template) => {
                    const isActive = activeTemplate.id === template.id;
                    return (
                      <button key={template.id} onClick={() => handleSelectTemplate(template)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${isActive ? 'border-primary bg-primary/10 scale-105' : 'border-border/50 hover:border-border hover:bg-card/50'}`}>
                        <div className={`w-10 h-10 rounded-full ${template.preview} shadow-lg`}>{isActive && <div className="w-full h-full rounded-full flex items-center justify-center bg-black/30"><Check className="w-5 h-5 text-white" /></div>}</div>
                        <span className="text-xs font-medium text-foreground/80">{template.label}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Light</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {lightTemplates.map((template) => {
                    const isActive = activeTemplate.id === template.id;
                    return (
                      <button key={template.id} onClick={() => handleSelectTemplate(template)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${isActive ? 'border-primary bg-primary/10 scale-105' : 'border-border/50 hover:border-border hover:bg-card/50'}`}>
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center">
                          <div className={`w-6 h-6 rounded-full ${template.preview}`}>{isActive && <div className="w-full h-full rounded-full flex items-center justify-center bg-black/20"><Check className="w-3 h-3 text-white" /></div>}</div>
                        </div>
                        <span className="text-xs font-medium text-foreground/80">{template.label}</span>
                      </button>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          </TabsContent>

          {/* ── Banners Tab ── */}
          <TabsContent value="banners">
            <div className="space-y-5">
              {/* Save + info */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t('admin.banners.subtitle', 'Configure até 3 banners para a tela inicial.')}</p>
                <Button onClick={handleSaveBanners} size="sm">{t('common.save')}</Button>
              </div>

              <GlassCard className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-foreground">{t('admin.banners.sizeGuide', 'Tamanhos recomendados')}</p>
                    <div className="flex flex-col sm:flex-row gap-4 text-muted-foreground">
                      <span className="flex items-center gap-1"><Monitor className="w-4 h-4 text-primary/70" /> Desktop: <strong className="text-foreground/80">1920×800px</strong></span>
                      <span className="flex items-center gap-1"><Smartphone className="w-4 h-4 text-primary/70" /> Mobile: <strong className="text-foreground/80">750×1000px</strong></span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Hero text */}
              <GlassCard className="p-5 space-y-4">
                <h3 className="font-semibold text-foreground text-sm">{t('admin.banners.heroText', 'Texto do Banner')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('admin.banners.greeting', 'Título / Saudação')}</Label>
                    <Input value={heroGreeting} onChange={(e) => setHeroGreeting(e.target.value)} placeholder="Bem-vindo! 🤍" className="bg-background/50 border-border/30" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('admin.banners.subtitleLabel', 'Subtítulo')}</Label>
                    <Input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Relaxe com ASMR de qualidade" className="bg-background/50 border-border/30" />
                  </div>
                </div>
              </GlassCard>

              {/* Banner cards */}
              {banners.map((banner, index) => (
                <motion.div key={banner.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <GlassCard className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center"><span className="text-sm font-bold text-primary">{index + 1}</span></div>
                        <h3 className="font-semibold text-sm text-foreground">Banner {index + 1}</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`en-${banner.id}`} className="text-xs text-muted-foreground">{banner.enabled ? t('common.active') : 'Off'}</Label>
                          <Switch id={`en-${banner.id}`} checked={banner.enabled} onCheckedChange={(v) => updateBanner(banner.id, 'enabled', v)} />
                        </div>
                        {banners.length > 1 && (
                          <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => removeBanner(banner.id)}><Trash2 className="w-4 h-4" /></Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderUploadArea(banner, 'desktop', index)}
                      {renderUploadArea(banner, 'mobile', index)}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}

              {canAdd && (
                <Button variant="outline" className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5" onClick={addBanner}>
                  <Plus className="w-4 h-4 mr-2" />{t('admin.banners.addBanner', 'Adicionar Banner')} ({banners.length}/3)
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview modal */}
        {previewBanner && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewBanner(null)}>
            <div className="max-w-4xl w-full space-y-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/70 font-medium">{previewBanner.type} Preview</span>
                <Button variant="ghost" size="sm" onClick={() => setPreviewBanner(null)} className="text-foreground/50">✕</Button>
              </div>
              <img src={previewBanner.url} alt="Banner preview" className="w-full rounded-lg max-h-[70vh] object-contain" />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPersonalizacao;
