import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Save, Upload, Trash2, Eye } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';

const CEOBranding = () => {
  const { config, updateBranding } = useWhiteLabel();
  const [form, setForm] = useState({
    siteName: config.siteName,
    siteDescription: config.siteDescription,
    bannerImage: config.bannerImage,
    logoImage: config.logoImage,
  });

  const handleSave = () => {
    updateBranding(form);
    toast.success('Configurações de branding salvas!');
  };

  const handleBannerUpload = () => {
    // Simulated upload - in production, integrate with file storage
    const mockUrl = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=600&fit=crop';
    setForm(prev => ({ ...prev, bannerImage: mockUrl }));
    toast.success('Banner atualizado!');
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
              Banner Principal
            </h3>

            {/* Preview */}
            <div className="relative mb-6 rounded-xl overflow-hidden aspect-[16/6] bg-muted">
              {form.bannerImage ? (
                <img 
                  src={form.bannerImage} 
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Nenhum banner definido</p>
                </div>
              )}
              
              {/* Overlay with site name preview */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">{form.siteName}</h2>
                  <p className="text-white/80 text-sm">{form.siteDescription}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBannerUpload} className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Banner
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setForm(prev => ({ ...prev, bannerImage: '' }))}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </Button>
            </div>

            <div className="mt-4">
              <Label htmlFor="bannerUrl">Ou cole uma URL</Label>
              <Input
                id="bannerUrl"
                value={form.bannerImage}
                onChange={(e) => setForm(prev => ({ ...prev, bannerImage: e.target.value }))}
                placeholder="https://..."
                className="mt-2"
              />
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
