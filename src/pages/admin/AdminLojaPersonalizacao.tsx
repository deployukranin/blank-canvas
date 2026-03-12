import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Image, Palette, Trash2, Plus, Upload } from 'lucide-react';
import AdminLayout from '@/pages/admin/AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStoreConfig, StoreVisualConfig } from '@/hooks/use-store-config';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HSLColor {
  h: number;
  s: number;
  l: number;
}

const parseHSL = (hslString: string): HSLColor => {
  const parts = hslString.split(' ');
  return {
    h: parseInt(parts[0]) || 0,
    s: parseInt(parts[1]) || 50,
    l: parseInt(parts[2]) || 50,
  };
};

const formatHSL = (color: HSLColor): string => `${color.h} ${color.s}% ${color.l}%`;

const ColorSlider = ({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  description?: string;
}) => {
  const [hsl, setHsl] = useState<HSLColor>(parseHSL(value));

  useEffect(() => setHsl(parseHSL(value)), [value]);

  const handleChange = (key: keyof HSLColor, val: number) => {
    const newHsl = { ...hsl, [key]: val };
    setHsl(newHsl);
    onChange(formatHSL(newHsl));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-lg border-2 border-border"
          style={{ backgroundColor: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` }}
        />
      </div>
      <div className="space-y-3 pl-3 border-l-2 border-border">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Matiz</span>
            <span className="font-mono">{hsl.h}°</span>
          </div>
          <Slider value={[hsl.h]} onValueChange={([v]) => handleChange('h', v)} max={360} step={1} />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Saturação</span>
            <span className="font-mono">{hsl.s}%</span>
          </div>
          <Slider value={[hsl.s]} onValueChange={([v]) => handleChange('s', v)} max={100} step={1} />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Luminosidade</span>
            <span className="font-mono">{hsl.l}%</span>
          </div>
          <Slider value={[hsl.l]} onValueChange={([v]) => handleChange('l', v)} max={100} step={1} />
        </div>
      </div>
    </div>
  );
};

const colorPresets = [
  { name: 'Roxo ASMR', primary: '270 70% 60%', accent: '280 60% 70%', bg: '260 30% 6%' },
  { name: 'Rosa Suave', primary: '330 70% 60%', accent: '340 60% 70%', bg: '320 30% 6%' },
  { name: 'Azul Calmo', primary: '210 70% 50%', accent: '220 60% 65%', bg: '220 30% 6%' },
  { name: 'Verde Zen', primary: '160 60% 45%', accent: '170 50% 55%', bg: '170 30% 6%' },
  { name: 'Dourado VIP', primary: '45 80% 55%', accent: '35 90% 60%', bg: '42 30% 6%' },
  { name: 'Vermelho Neon', primary: '0 80% 55%', accent: '350 75% 60%', bg: '350 30% 6%' },
];

const AdminLojaPersonalizacao = () => {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');

  // Find the admin's store
  useEffect(() => {
    const findStore = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('store_admins')
        .select('store_id, stores(name)')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (data) {
        setStoreId(data.store_id);
        if (data.stores && typeof data.stores === 'object' && 'name' in data.stores) {
          setStoreName((data.stores as { name: string }).name);
        }
      }
    };
    findStore();
  }, [user]);

  const { config, isLoading, saveConfig } = useStoreConfig(storeId);

  // Local form state
  const [form, setForm] = useState<StoreVisualConfig>({});

  useEffect(() => {
    if (!isLoading) {
      setForm({ ...config });
    }
  }, [config, isLoading]);

  const [newBannerUrl, setNewBannerUrl] = useState('');

  const handleSave = async () => {
    await saveConfig(form);
    toast.success('Personalização da loja salva!');
  };

  const addBanner = () => {
    if (!newBannerUrl.trim()) return;
    setForm((prev) => ({
      ...prev,
      bannerImages: [...(prev.bannerImages || []), newBannerUrl.trim()],
    }));
    setNewBannerUrl('');
  };

  const removeBanner = (index: number) => {
    setForm((prev) => ({
      ...prev,
      bannerImages: (prev.bannerImages || []).filter((_, i) => i !== index),
    }));
  };

  const updateColor = (key: 'primary' | 'accent' | 'background', value: string) => {
    setForm((prev) => ({
      ...prev,
      colors: { ...prev.colors!, [key]: value },
    }));
  };

  if (isLoading) {
    return (
      <AdminLayout title="Personalização da Loja">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Personalização da Loja">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">
              Configure a identidade visual da loja <strong>{storeName}</strong>
            </p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Salvar
          </Button>
        </div>

        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="branding" className="gap-1.5">
              <Image className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="cores" className="gap-1.5">
              <Palette className="w-4 h-4" />
              Cores
            </TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-4 mt-4">
            <GlassCard className="p-5 space-y-5">
              <div className="space-y-2">
                <Label>Nome da Loja</Label>
                <Input
                  value={form.storeName || ''}
                  onChange={(e) => setForm((p) => ({ ...p, storeName: e.target.value }))}
                  placeholder="Minha Loja ASMR"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.storeDescription || ''}
                  onChange={(e) => setForm((p) => ({ ...p, storeDescription: e.target.value }))}
                  placeholder="Relaxe com conteúdo ASMR de qualidade"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>URL do Logo</Label>
                <Input
                  value={form.logoUrl || ''}
                  onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
                  placeholder="https://exemplo.com/logo.png"
                />
                {form.logoUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={form.logoUrl}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-xl object-cover border border-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm((p) => ({ ...p, logoUrl: '' }))}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Banners */}
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Banners</Label>
                <span className="text-xs text-muted-foreground">
                  {(form.bannerImages || []).length} banner(s)
                </span>
              </div>

              {(form.bannerImages || []).length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {(form.bannerImages || []).map((url, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-border">
                      <img
                        src={url}
                        alt={`Banner ${idx + 1}`}
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <button
                        onClick={() => removeBanner(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={newBannerUrl}
                  onChange={(e) => setNewBannerUrl(e.target.value)}
                  placeholder="https://exemplo.com/banner.jpg"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBanner())}
                />
                <Button onClick={addBanner} size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>
            </GlassCard>

            {/* Preview */}
            <GlassCard className="p-5 space-y-3">
              <Label className="text-base font-semibold">Preview</Label>
              <div className="rounded-xl overflow-hidden border border-border bg-muted/20">
                <div className="relative">
                  {(form.bannerImages || []).length > 0 ? (
                    <img
                      src={form.bannerImages![0]}
                      alt="Banner preview"
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">Sem banner</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background to-transparent">
                    <div className="flex items-center gap-2">
                      {form.logoUrl && (
                        <img src={form.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="font-bold text-sm">{form.storeName || 'Nome da Loja'}</p>
                        <p className="text-xs text-muted-foreground">{form.storeDescription || 'Descrição'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="cores" className="space-y-4 mt-4">
            {/* Presets */}
            <GlassCard className="p-5 space-y-3">
              <Label className="text-base font-semibold">Presets de Cores</Label>
              <div className="grid grid-cols-3 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        colors: { primary: preset.primary, accent: preset.accent, background: preset.bg },
                      }))
                    }
                    className="p-3 rounded-lg border border-border hover:border-primary/50 transition-all text-center"
                  >
                    <div className="flex gap-1 justify-center mb-1.5">
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: `hsl(${parseHSL(preset.primary).h}, ${parseHSL(preset.primary).s}%, ${parseHSL(preset.primary).l}%)` }}
                      />
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: `hsl(${parseHSL(preset.accent).h}, ${parseHSL(preset.accent).s}%, ${parseHSL(preset.accent).l}%)` }}
                      />
                    </div>
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Custom Colors */}
            <GlassCard className="p-5 space-y-6">
              <Label className="text-base font-semibold">Cores Personalizadas</Label>
              <ColorSlider
                label="Cor Primária"
                description="Cor principal de botões e destaques"
                value={form.colors?.primary || '270 70% 60%'}
                onChange={(v) => updateColor('primary', v)}
              />
              <ColorSlider
                label="Cor de Destaque"
                description="Cor secundária para gradientes"
                value={form.colors?.accent || '280 60% 70%'}
                onChange={(v) => updateColor('accent', v)}
              />
              <ColorSlider
                label="Fundo"
                description="Cor de fundo principal"
                value={form.colors?.background || '260 30% 6%'}
                onChange={(v) => updateColor('background', v)}
              />
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminLojaPersonalizacao;
