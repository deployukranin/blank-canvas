import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image, Trash2, Plus, Monitor, Smartphone, Info, Eye, Upload, Loader2, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWhiteLabel, type BannerConfig } from '@/contexts/WhiteLabelContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

const generateId = () => Math.random().toString(36).substring(2, 10);
const BUCKET = 'banners';

const AdminBanners: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { config, setConfig } = useWhiteLabel();

  const [heroGreeting, setHeroGreeting] = useState(config.heroGreeting || 'Bem-vindo! 🤍');
  const [heroSubtitle, setHeroSubtitle] = useState(config.heroSubtitle || 'Relaxe com ASMR de qualidade');

  const [banners, setBanners] = useState<BannerConfig[]>(
    config.banners?.length ? config.banners : [
      { id: generateId(), desktopUrl: '', mobileUrl: '', enabled: true }
    ]
  );

  const [previewBanner, setPreviewBanner] = useState<{ url: string; type: string } | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const canAdd = banners.length < 3;

  const addBanner = () => {
    if (!canAdd) return;
    setBanners(prev => [...prev, { id: generateId(), desktopUrl: '', mobileUrl: '', enabled: true }]);
  };

  const removeBanner = (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  const updateBanner = (id: string, field: keyof BannerConfig, value: string | boolean) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const uploadFile = async (file: File, bannerId: string, variant: 'desktop' | 'mobile') => {
    const uploadKey = `${bannerId}-${variant}`;
    setUploading(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${bannerId}/${variant}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const field = variant === 'desktop' ? 'desktopUrl' : 'mobileUrl';
      updateBanner(bannerId, field, publicUrl);

      toast({
        title: t('admin.banners.uploadSuccess', 'Image uploaded!'),
        description: `${variant === 'desktop' ? 'Desktop' : 'Mobile'} banner uploaded successfully.`,
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({
        title: t('admin.banners.uploadError', 'Upload failed'),
        description: err.message || 'An error occurred while uploading.',
        variant: 'destructive',
      });
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
          toast({
            title: t('admin.banners.fileTooLarge', 'File too large'),
            description: t('admin.banners.maxSize', 'Maximum file size is 5MB.'),
            variant: 'destructive',
          });
          return;
        }
        uploadFile(file, bannerId, variant);
      }
    };
    input.click();
  };

  const clearImage = (bannerId: string, field: 'desktopUrl' | 'mobileUrl') => {
    updateBanner(bannerId, field, '');
  };

  const handleSave = () => {
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

    toast({
      title: t('admin.banners.saved', 'Banners saved!'),
      description: t('admin.banners.savedDesc', 'Your banner configuration has been updated.'),
    });
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
          /* Image preview with actions */
          <div className="relative group">
            <div className={`relative rounded-lg overflow-hidden bg-background/30 border border-border/20 ${isDesktop ? 'w-full h-28' : 'w-32 h-40'}`}>
              <img
                src={url}
                alt={`${variant} Banner ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/70 hover:bg-background text-foreground"
                  onClick={() => setPreviewBanner({ url, type: isDesktop ? 'Desktop' : 'Mobile' })}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-destructive/70 hover:bg-destructive text-destructive-foreground"
                  onClick={() => clearImage(banner.id, field)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Upload drop zone */
          <div
            onClick={() => !isUploading && handleFileSelect(banner.id, variant)}
            className={`relative rounded-lg border-2 border-dashed border-border/40 hover:border-primary/40 bg-background/20 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${isDesktop ? 'w-full h-28' : 'w-32 h-40'}`}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground text-center px-2">
                  {t('admin.banners.clickToUpload', 'Click to upload')}
                </span>
              </>
            )}
          </div>
        )}

        {/* URL input as fallback */}
        <Input
          placeholder={`${isDesktop ? 'Desktop' : 'Mobile'} URL (${t('admin.banners.orPasteUrl', 'or paste URL')})`}
          value={url}
          onChange={(e) => updateBanner(banner.id, field, e.target.value)}
          className="bg-background/50 border-border/30 text-xs h-8"
        />
      </div>
    );
  };

  return (
    <AdminLayout title={t('admin.banners.title', 'Banners')}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              {t('admin.banners.title', 'Banners')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t('admin.banners.subtitle', 'Configure up to 3 banners for the home screen. Upload or paste URLs for desktop and mobile versions.')}
            </p>
          </div>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            {t('common.save', 'Save')}
          </Button>
        </div>

        {/* Size recommendations */}
        <GlassCard className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-foreground">
                {t('admin.banners.sizeGuide', 'Recommended sizes')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary/70" />
                  <span>Desktop: <strong className="text-foreground/80">1920 × 800px</strong> (16:7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary/70" />
                  <span>Mobile: <strong className="text-foreground/80">750 × 1000px</strong> (3:4)</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {t('admin.banners.sizeHint', 'JPG, PNG or WebP. Max 5MB per image.')}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Hero Text */}
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            {t('admin.banners.heroText', 'Texto do Banner')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.banners.greeting', 'Título / Saudação')}</Label>
              <Input
                value={heroGreeting}
                onChange={(e) => setHeroGreeting(e.target.value)}
                placeholder="Bem-vindo! 🤍"
                className="bg-background/50 border-border/30"
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.banners.greetingHint', 'Exibido para visitantes não logados.')}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.banners.subtitle', 'Subtítulo')}</Label>
              <Input
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Relaxe com ASMR de qualidade"
                className="bg-background/50 border-border/30"
              />
            </div>
          </div>
        </GlassCard>

        {/* Banner Cards */}
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <h3 className="font-semibold text-foreground">
                      Banner {index + 1}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`enabled-${banner.id}`} className="text-xs text-muted-foreground">
                        {banner.enabled ? t('common.active', 'Active') : t('admin.banners.disabled', 'Disabled')}
                      </Label>
                      <Switch
                        id={`enabled-${banner.id}`}
                        checked={banner.enabled}
                        onCheckedChange={(v) => updateBanner(banner.id, 'enabled', v)}
                      />
                    </div>
                    {banners.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeBanner(banner.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderUploadArea(banner, 'desktop', index)}
                  {renderUploadArea(banner, 'mobile', index)}
                </div>

                {!banner.desktopUrl && !banner.mobileUrl && (
                  <p className="text-xs text-muted-foreground/60 mt-3 italic">
                    {t('admin.banners.emptyHint', 'Upload an image or paste a URL for desktop and/or mobile banner.')}
                  </p>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Add button */}
        {canAdd && (
          <Button
            variant="outline"
            className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
            onClick={addBanner}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('admin.banners.addBanner', 'Add Banner')} ({banners.length}/3)
          </Button>
        )}

        {/* Preview modal */}
        {previewBanner && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreviewBanner(null)}
          >
            <div className="max-w-4xl w-full space-y-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/70 font-medium">
                  {previewBanner.type} Preview
                </span>
                <Button variant="ghost" size="sm" onClick={() => setPreviewBanner(null)} className="text-foreground/50">
                  ✕
                </Button>
              </div>
              <img
                src={previewBanner.url}
                alt="Banner preview"
                className="w-full rounded-lg max-h-[70vh] object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBanners;
