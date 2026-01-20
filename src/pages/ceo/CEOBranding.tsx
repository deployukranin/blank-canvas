import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Save, Upload, Trash2, Eye, Plus, X } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';

const CEOBranding = () => {
  const { config, updateBranding } = useWhiteLabel();
  const initialBannerImages = useMemo(
    () => (Array.isArray(config.bannerImages) && config.bannerImages.length > 0
      ? config.bannerImages
      : (config.bannerImage ? [config.bannerImage] : [])),
    [config.bannerImages, config.bannerImage]
  );

  const [form, setForm] = useState({
    siteName: config.siteName,
    siteDescription: config.siteDescription,
    bannerImages: initialBannerImages,
    bannerImage: initialBannerImages[0] ?? '',
    logoImage: config.logoImage,
  });

  const [newBannerUrl, setNewBannerUrl] = useState('');

  const handleSave = () => {
    updateBranding({
      siteName: form.siteName,
      siteDescription: form.siteDescription,
      bannerImages: form.bannerImages,
      bannerImage: form.bannerImages[0] ?? '',
      logoImage: form.logoImage,
    });
    toast.success('Configurações de branding salvas!');
  };

  const handleBannerUpload = () => {
    // Simulated upload - in production, integrate with file storage
    const mockUrl = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=600&fit=crop';
    setForm(prev => {
      const nextBannerImages = [...(prev.bannerImages || []), mockUrl];
      return { ...prev, bannerImages: nextBannerImages, bannerImage: nextBannerImages[0] ?? '' };
    });
    toast.success('Banner adicionado!');
  };

  const handleLogoUpload = () => {
    // Simulated upload - in production, integrate with file storage
    const mockUrl = 'https://via.placeholder.com/200x200/8b5cf6/ffffff?text=Logo';
    setForm(prev => ({ ...prev, logoImage: mockUrl }));
    toast.success('Logo atualizado!');
  };

  return (
    <CEOLayout title="Branding">
      <div className="space-y-8 max-w-4xl">
        {/* Site Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard>
            <h3 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
              <Image className="w-5 h-5 text-amber-400" />
              Informações do Site
            </h3>

            <div className="space-y-6">
              <div>
                <Label htmlFor="siteName">Nome do Site</Label>
                <Input
                  id="siteName"
                  value={form.siteName}
                  onChange={(e) => setForm(prev => ({ ...prev, siteName: e.target.value }))}
                  placeholder="Ex: WhisperScape"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este nome aparecerá no header e título da página
                </p>
              </div>

              <div>
                <Label htmlFor="siteDescription">Descrição</Label>
                <Textarea
                  id="siteDescription"
                  value={form.siteDescription}
                  onChange={(e) => setForm(prev => ({ ...prev, siteDescription: e.target.value }))}
                  placeholder="Descreva seu site..."
                  className="mt-2"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usada para SEO e meta descriptions
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard>
            <h3 className="font-display font-semibold text-lg mb-6">
              Banner Principal (Carrossel)
            </h3>

            {/* Preview */}
            <div className="relative mb-6 rounded-xl overflow-hidden aspect-[16/6] bg-muted">
              {form.bannerImages?.length ? (
                <Carousel
                  opts={{ loop: true }}
                  className="w-full h-full"
                >
                  <CarouselContent className="h-full">
                    {form.bannerImages.map((src, idx) => (
                      <CarouselItem key={`${src}-${idx}`} className="h-full">
                        <img
                          src={src}
                          alt={`Banner ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading={idx === 0 ? 'eager' : 'lazy'}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  {form.bannerImages.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
                      <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />
                    </>
                  )}
                </Carousel>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Nenhum banner definido</p>
                </div>
              )}

              {/* Overlay with site name preview */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 pointer-events-none">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">{form.siteName}</h2>
                  <p className="text-white/80 text-sm">{form.siteDescription}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleBannerUpload} className="gap-2">
                <Upload className="w-4 h-4" />
                Adicionar (upload)
              </Button>
              <Button
                variant="outline"
                onClick={() => setForm(prev => ({ ...prev, bannerImages: [], bannerImage: '' }))}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remover todos
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <Label htmlFor="bannerUrl">Adicionar por URL</Label>
              <div className="flex gap-2">
                <Input
                  id="bannerUrl"
                  value={newBannerUrl}
                  onChange={(e) => setNewBannerUrl(e.target.value)}
                  placeholder="https://..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const url = newBannerUrl.trim();
                    if (!url) return;
                    setForm(prev => {
                      const nextBannerImages = [...(prev.bannerImages || []), url];
                      return { ...prev, bannerImages: nextBannerImages, bannerImage: nextBannerImages[0] ?? '' };
                    });
                    setNewBannerUrl('');
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>

              {form.bannerImages?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {form.bannerImages.map((src, idx) => (
                    <div key={`${src}-${idx}`} className="flex items-center gap-2 glass rounded-lg p-2">
                      <div className="w-16 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                        <img src={src} alt={`Miniatura do banner ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{src}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setForm(prev => {
                            const nextBannerImages = (prev.bannerImages || []).filter((_, i) => i !== idx);
                            return { ...prev, bannerImages: nextBannerImages, bannerImage: nextBannerImages[0] ?? '' };
                          });
                        }}
                        className="shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </GlassCard>
        </motion.div>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <h3 className="font-display font-semibold text-lg mb-6">
              Logo
            </h3>

            <div className="flex items-start gap-6">
              {/* Preview */}
              <div className="w-32 h-32 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {form.logoImage ? (
                  <img 
                    src={form.logoImage} 
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-4xl font-display font-bold text-muted-foreground">
                    {form.siteName.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex gap-3">
                  <Button onClick={handleLogoUpload} variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setForm(prev => ({ ...prev, logoImage: '' }))}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </Button>
                </div>

                <div>
                  <Label htmlFor="logoUrl">Ou cole uma URL</Label>
                  <Input
                    id="logoUrl"
                    value={form.logoImage}
                    onChange={(e) => setForm(prev => ({ ...prev, logoImage: e.target.value }))}
                    placeholder="https://..."
                    className="mt-2"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Recomendado: PNG transparente, 200x200px ou maior
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end gap-4"
        >
          <Button variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            Pré-visualizar
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
            <Save className="w-4 h-4" />
            Salvar Alterações
          </Button>
        </motion.div>
      </div>
    </CEOLayout>
  );
};

export default CEOBranding;
