import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Trash2, Plus, Monitor, Smartphone, Info, Eye } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWhiteLabel, type BannerConfig } from '@/contexts/WhiteLabelContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'crypto';

const generateId = () => Math.random().toString(36).substring(2, 10);

const AdminBanners: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { config, setConfig } = useWhiteLabel();

  const [banners, setBanners] = useState<BannerConfig[]>(
    config.banners?.length ? config.banners : [
      { id: generateId(), desktopUrl: '', mobileUrl: '', enabled: true }
    ]
  );

  const [previewBanner, setPreviewBanner] = useState<{ url: string; type: string } | null>(null);

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

  const handleSave = () => {
    const enabledBanners = banners.filter(b => b.enabled && (b.desktopUrl || b.mobileUrl));
    const bannerImages = enabledBanners.map(b => b.desktopUrl || b.mobileUrl).filter(Boolean);

    setConfig({
      ...config,
      banners,
      bannerImages: bannerImages.length > 0 ? bannerImages : config.bannerImages,
      bannerImage: bannerImages[0] || config.bannerImage,
    });

    toast({
      title: t('admin.banners.saved', 'Banners saved!'),
      description: t('admin.banners.savedDesc', 'Your banner configuration has been updated.'),
    });
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
              {t('admin.banners.subtitle', 'Configure up to 3 banners for the home screen. Add desktop and mobile versions for full responsiveness.')}
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
                {t('admin.banners.sizeHint', 'Use JPG or WebP for best performance. Keep file size under 500KB.')}
              </p>
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
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => removeBanner(banner.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Desktop */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Monitor className="w-4 h-4 text-primary/70" />
                      Desktop
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/banner-desktop.jpg"
                        value={banner.desktopUrl}
                        onChange={(e) => updateBanner(banner.id, 'desktopUrl', e.target.value)}
                        className="bg-background/50 border-border/30"
                      />
                      {banner.desktopUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => setPreviewBanner({ url: banner.desktopUrl, type: 'Desktop' })}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {banner.desktopUrl && (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden bg-background/30 border border-border/20">
                        <img
                          src={banner.desktopUrl}
                          alt={`Desktop Banner ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Mobile */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Smartphone className="w-4 h-4 text-primary/70" />
                      Mobile
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/banner-mobile.jpg"
                        value={banner.mobileUrl}
                        onChange={(e) => updateBanner(banner.id, 'mobileUrl', e.target.value)}
                        className="bg-background/50 border-border/30"
                      />
                      {banner.mobileUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => setPreviewBanner({ url: banner.mobileUrl, type: 'Mobile' })}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {banner.mobileUrl && (
                      <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-background/30 border border-border/20">
                        <img
                          src={banner.mobileUrl}
                          alt={`Mobile Banner ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {!banner.desktopUrl && !banner.mobileUrl && (
                  <p className="text-xs text-muted-foreground/60 mt-2 italic">
                    {t('admin.banners.emptyHint', 'Paste a URL for the desktop and/or mobile banner image.')}
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
