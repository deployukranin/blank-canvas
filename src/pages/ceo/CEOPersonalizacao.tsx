import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, RotateCcw, Upload, Trash2, Plus, X, Search, Filter,
  Image, Palette, Sparkles, LayoutDashboard, Users, Eye, EyeOff, GripVertical,
  Sun, Moon, Video, Crown, Bell, Lightbulb, Navigation
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import AdminLayout from '@/pages/admin/AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useWhiteLabel, 
  availableLucideIcons, 
  availableEmojis,
  availableGradientColors,
  availableRoutes,
  defaultQuickActions,
  defaultNavigationTabs,
  IconConfig, 
  IconItem,
  QuickActionItem,
  NavTabConfig
} from '@/contexts/WhiteLabelContext';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';

// ===== Types =====
interface HSLColor {
  h: number;
  s: number;
  l: number;
}

type BenefitIcon = 'star' | 'bell' | 'message' | 'gift' | 'zap' | 'heart';

// ===== Helper Functions =====
const parseHSL = (hslString: string): HSLColor => {
  const parts = hslString.split(' ');
  return {
    h: parseInt(parts[0]) || 0,
    s: parseInt(parts[1]) || 50,
    l: parseInt(parts[2]) || 50,
  };
};

const formatHSL = (color: HSLColor): string => {
  return `${color.h} ${color.s}% ${color.l}%`;
};

const getLucideIcon = (name: string): LucideIcons.LucideIcon | null => {
  const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
  return icons[name] || null;
};

const lucideCategories = [...new Set(availableLucideIcons.map(i => i.category))];

// ===== Icon Categories for Display =====
const iconCategories = [
  {
    title: 'Navegação',
    icons: [
      { key: 'navHome', label: 'Início' },
      { key: 'navCustoms', label: "Custom's" },
      { key: 'navLoja', label: 'Loja' },
      { key: 'navComunidade', label: 'Comunidade' },
      { key: 'navPerfil', label: 'Perfil' },
    ] as { key: keyof IconConfig; label: string }[],
  },
  {
    title: 'Ações Rápidas',
    icons: [
      { key: 'actionIdeias', label: 'Ideias' },
      { key: 'actionVIP', label: 'VIP' },
      { key: 'actionCustoms', label: "Custom's" },
      { key: 'actionLoja', label: 'Loja' },
      { key: 'actionComunidade', label: 'Comunidade' },
    ] as { key: keyof IconConfig; label: string }[],
  },
  {
    title: 'Funcionalidades',
    icons: [
      { key: 'featureVideos', label: 'Vídeos' },
      { key: 'featureAudios', label: 'Áudios' },
      { key: 'featureVIP', label: 'VIP' },
    ] as { key: keyof IconConfig; label: string }[],
  },
  {
    title: 'Geral',
    icons: [
      { key: 'logoIcon', label: 'Logo' },
      { key: 'successIcon', label: 'Sucesso' },
    ] as { key: keyof IconConfig; label: string }[],
  },
];

// ===== Color Picker Component =====
const ColorPicker = ({ 
  label, 
  value, 
  onChange,
  description 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
  description?: string;
}) => {
  const [hsl, setHsl] = useState<HSLColor>(parseHSL(value));

  useEffect(() => {
    setHsl(parseHSL(value));
  }, [value]);

  const handleChange = (key: keyof HSLColor, val: number) => {
    const newHsl = { ...hsl, [key]: val };
    setHsl(newHsl);
    onChange(formatHSL(newHsl));
  };

  const previewColor = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div 
          className="w-10 h-10 rounded-lg border-2 border-border"
          style={{ backgroundColor: previewColor }}
        />
      </div>

      <div className="space-y-3 pl-3 border-l-2 border-border">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Matiz</span>
            <span className="font-mono">{hsl.h}°</span>
          </div>
          <Slider
            value={[hsl.h]}
            onValueChange={([v]) => handleChange('h', v)}
            max={360}
            step={1}
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Saturação</span>
            <span className="font-mono">{hsl.s}%</span>
          </div>
          <Slider
            value={[hsl.s]}
            onValueChange={([v]) => handleChange('s', v)}
            max={100}
            step={1}
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Luminosidade</span>
            <span className="font-mono">{hsl.l}%</span>
          </div>
          <Slider
            value={[hsl.l]}
            onValueChange={([v]) => handleChange('l', v)}
            max={100}
            step={1}
          />
        </div>
      </div>
    </div>
  );
};

// ===== Main Component =====
const CEOPersonalizacao = () => {
  const { config, updateBranding, updateColors, updateIcons, updateQuickActions, updateNavigationTabs, updateCommunity, resetToDefaults, resetIconsToDefaults, resetQuickActionsToDefaults, resetCommunityToDefaults, resetNavigationTabsToDefaults } = useWhiteLabel();
  const { toast: toastHook } = useToast();

  // ===== Branding State =====
  const initialBannerImages = useMemo(
    () => (Array.isArray(config.bannerImages) && config.bannerImages.length > 0
      ? config.bannerImages
      : (config.bannerImage ? [config.bannerImage] : [])),
    [config.bannerImages, config.bannerImage]
  );

  const [brandingForm, setBrandingForm] = useState({
    siteName: config.siteName,
    siteDescription: config.siteDescription,
    bannerImages: initialBannerImages,
    logoImage: config.logoImage,
  });
  const [newBannerUrl, setNewBannerUrl] = useState('');

  // ===== Colors State =====
  const [colors, setColors] = useState(config.colors);

  // ===== Icons State =====
  const [iconsForm, setIconsForm] = useState<IconConfig>({ ...config.icons });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [activeIconKey, setActiveIconKey] = useState<keyof IconConfig | null>(null);
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [iconPickerTab, setIconPickerTab] = useState<'lucide' | 'emoji'>('lucide');
  const [iconSelectedCategory, setIconSelectedCategory] = useState<string>('all');

  // ===== Explorar State =====
  const [explorarForm, setExplorarForm] = useState<QuickActionItem[]>([...config.quickActions]);
  const [showExplorarIconPicker, setShowExplorarIconPicker] = useState(false);
  const [explorarEditingIndex, setExplorarEditingIndex] = useState<number | null>(null);

  // ===== Navegação State =====
  const [navigationForm, setNavigationForm] = useState<NavTabConfig[]>([...config.navigationTabs]);
  const [showNavIconPicker, setShowNavIconPicker] = useState(false);
  const [navEditingIndex, setNavEditingIndex] = useState<number | null>(null);

  // ===== Comunidade State =====
  const [comunidadeForm, setComunidadeForm] = useState({
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

  // ===== Colors Effect =====
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--ring', colors.primary);
  }, [colors]);

  // ===== Save Handlers =====
  const handleSaveBranding = () => {
    updateBranding({
      siteName: brandingForm.siteName,
      siteDescription: brandingForm.siteDescription,
      bannerImages: brandingForm.bannerImages,
      bannerImage: brandingForm.bannerImages[0] ?? '',
      logoImage: brandingForm.logoImage,
    });
    toast.success('Branding salvo!');
  };

  const handleSaveColors = () => {
    updateColors(colors);
    toast.success('Cores salvas!');
  };

  const handleSaveIcons = () => {
    updateIcons(iconsForm);
    toast.success('Ícones salvos!');
  };

  const handleSaveExplorar = () => {
    updateQuickActions(explorarForm);
    toast.success('Seção Explorar salva!');
  };

  const handleSaveComunidade = () => {
    updateCommunity(comunidadeForm);
    toastHook({
      title: 'Configurações salvas!',
      description: 'As configurações da comunidade foram atualizadas.',
    });
  };

  const handleSaveNavigation = () => {
    // Validate: at least 2 tabs must be enabled
    const enabledCount = navigationForm.filter(tab => tab.enabled).length;
    if (enabledCount < 2) {
      toast.error('Mantenha pelo menos 2 abas visíveis!');
      return;
    }
    updateNavigationTabs(navigationForm);
    toast.success('Navegação salva!');
  };

  const handleSaveAll = () => {
    handleSaveBranding();
    handleSaveColors();
    handleSaveIcons();
    handleSaveExplorar();
    handleSaveComunidade();
    handleSaveNavigation();
    toast.success('Todas as personalizações foram salvas!');
  };

  // ===== Branding Handlers =====
  const handleBannerUpload = () => {
    const mockUrl = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=600&fit=crop';
    setBrandingForm(prev => ({
      ...prev,
      bannerImages: [...prev.bannerImages, mockUrl],
    }));
    toast.success('Banner adicionado!');
  };

  const handleLogoUpload = () => {
    const mockUrl = 'https://via.placeholder.com/200x200/8b5cf6/ffffff?text=Logo';
    setBrandingForm(prev => ({ ...prev, logoImage: mockUrl }));
    toast.success('Logo atualizado!');
  };

  // ===== Icon Picker Handlers =====
  const openIconPicker = (key: keyof IconConfig) => {
    setActiveIconKey(key);
    setIconSearchQuery('');
    setIconPickerTab(iconsForm[key].type);
    setIconSelectedCategory('all');
    setShowIconPicker(true);
  };

  const selectIcon = (iconItem: IconItem) => {
    if (activeIconKey) {
      setIconsForm(prev => ({ ...prev, [activeIconKey]: iconItem }));
    }
    setShowIconPicker(false);
  };

  const filteredLucideIcons = useMemo(() => {
    return availableLucideIcons.filter(icon => {
      const matchesSearch = 
        icon.label.toLowerCase().includes(iconSearchQuery.toLowerCase()) ||
        icon.id.toLowerCase().includes(iconSearchQuery.toLowerCase());
      const matchesCategory = iconSelectedCategory === 'all' || icon.category === iconSelectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [iconSearchQuery, iconSelectedCategory]);

  const groupedIcons = useMemo(() => {
    const groups: Record<string, Array<{ id: string; label: string; category: string }>> = {};
    filteredLucideIcons.forEach(icon => {
      if (!groups[icon.category]) {
        groups[icon.category] = [];
      }
      groups[icon.category].push({ id: icon.id, label: icon.label, category: icon.category });
    });
    return groups;
  }, [filteredLucideIcons]);

  // ===== Explorar Handlers =====
  const handleAddExplorarAction = () => {
    const newAction: QuickActionItem = {
      icon: { type: 'lucide', value: 'Star' },
      label: 'Novo Item',
      path: '/ideias',
      color: 'from-violet-500 to-purple-500',
      enabled: true,
    };
    setExplorarForm([...explorarForm, newAction]);
  };

  const handleRemoveExplorarAction = (index: number) => {
    setExplorarForm(explorarForm.filter((_, i) => i !== index));
  };

  const handleUpdateExplorarAction = (index: number, updates: Partial<QuickActionItem>) => {
    setExplorarForm(explorarForm.map((action, i) => (i === index ? { ...action, ...updates } : action)));
  };

  const openExplorarIconPicker = (index: number) => {
    setExplorarEditingIndex(index);
    setIconSearchQuery('');
    setShowExplorarIconPicker(true);
  };

  const handleSelectExplorarIcon = (icon: IconItem) => {
    if (explorarEditingIndex !== null) {
      handleUpdateExplorarAction(explorarEditingIndex, { icon });
    }
    setShowExplorarIconPicker(false);
    setExplorarEditingIndex(null);
  };

  // ===== Comunidade Handlers =====
  const addBenefit = () => {
    const newBenefit = {
      id: Date.now().toString(),
      title: 'Novo Benefício',
      description: 'Descrição do benefício',
      icon: 'star' as BenefitIcon,
    };
    setComunidadeForm({ ...comunidadeForm, vipBenefits: [...comunidadeForm.vipBenefits, newBenefit] });
  };

  const removeBenefit = (id: string) => {
    setComunidadeForm({ ...comunidadeForm, vipBenefits: comunidadeForm.vipBenefits.filter(b => b.id !== id) });
  };

  const updateBenefit = (id: string, field: string, value: string) => {
    setComunidadeForm({
      ...comunidadeForm,
      vipBenefits: comunidadeForm.vipBenefits.map(b => 
        b.id === id ? { ...b, [field]: value } : b
      ),
    });
  };

  // ===== Navigation Handlers =====
  const handleUpdateNavTab = (index: number, updates: Partial<NavTabConfig>) => {
    setNavigationForm(navigationForm.map((tab, i) => (i === index ? { ...tab, ...updates } : tab)));
  };

  const openNavIconPicker = (index: number) => {
    setNavEditingIndex(index);
    setIconSearchQuery('');
    setShowNavIconPicker(true);
  };

  const handleSelectNavIcon = (icon: IconItem) => {
    if (navEditingIndex !== null) {
      handleUpdateNavTab(navEditingIndex, { icon });
    }
    setShowNavIconPicker(false);
    setNavEditingIndex(null);
  };

  const handleResetNavigation = () => {
    setNavigationForm([...defaultNavigationTabs]);
    toast.success('Navegação resetada para o padrão!');
  };

  // Color presets
  const colorPresets = [
    { name: 'Roxo ASMR', primary: '270 70% 60%', accent: '280 60% 70%', bg: '260 30% 6%' },
    { name: 'Rosa Suave', primary: '330 70% 60%', accent: '340 60% 70%', bg: '320 30% 6%' },
    { name: 'Azul Calmo', primary: '210 70% 50%', accent: '220 60% 65%', bg: '220 30% 6%' },
    { name: 'Verde Zen', primary: '160 60% 45%', accent: '170 50% 55%', bg: '170 30% 6%' },
    { name: 'Dourado VIP', primary: '45 80% 55%', accent: '35 90% 60%', bg: '42 30% 6%' },
    { name: 'Vermelho Neon', primary: '0 80% 55%', accent: '350 75% 60%', bg: '350 30% 6%' },
  ];

  return (
    <CEOLayout title="Personalização">
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Configure branding, cores, ícones e seções do app
          </p>
          <Button onClick={handleSaveAll} className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
            <Save className="w-4 h-4" />
            Salvar Tudo
          </Button>
        </div>

        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="branding" className="gap-1">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="cores" className="gap-1">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Cores</span>
            </TabsTrigger>
            <TabsTrigger value="icones" className="gap-1">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Ícones</span>
            </TabsTrigger>
            <TabsTrigger value="explorar" className="gap-1">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Explorar</span>
            </TabsTrigger>
            <TabsTrigger value="comunidade" className="gap-1">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Comunidade</span>
            </TabsTrigger>
            <TabsTrigger value="navegacao" className="gap-1">
              <Navigation className="w-4 h-4" />
              <span className="hidden sm:inline">Navegação</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== Branding Tab ===== */}
          <TabsContent value="branding" className="space-y-6 mt-6">
            <GlassCard>
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-amber-400" />
                Informações do Site
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Site</Label>
                  <Input
                    value={brandingForm.siteName}
                    onChange={(e) => setBrandingForm(prev => ({ ...prev, siteName: e.target.value }))}
                    placeholder="Ex: WhisperScape"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={brandingForm.siteDescription}
                    onChange={(e) => setBrandingForm(prev => ({ ...prev, siteDescription: e.target.value }))}
                    placeholder="Descreva seu site..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-display font-semibold text-lg mb-4">Banner (Carrossel)</h3>
              <div className="relative mb-4 rounded-xl overflow-hidden aspect-[16/6] bg-muted">
                {brandingForm.bannerImages?.length ? (
                  <Carousel opts={{ loop: true }} className="w-full h-full">
                    <CarouselContent className="h-full">
                      {brandingForm.bannerImages.map((src, idx) => (
                        <CarouselItem key={`${src}-${idx}`} className="h-full">
                          <img src={src} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {brandingForm.bannerImages.length > 1 && (
                      <>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </>
                    )}
                  </Carousel>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Nenhum banner</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Button onClick={handleBannerUpload} size="sm" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBrandingForm(prev => ({ ...prev, bannerImages: [] }))}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpar
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newBannerUrl}
                  onChange={(e) => setNewBannerUrl(e.target.value)}
                  placeholder="https://..."
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (newBannerUrl.trim()) {
                      setBrandingForm(prev => ({
                        ...prev,
                        bannerImages: [...prev.bannerImages, newBannerUrl.trim()],
                      }));
                      setNewBannerUrl('');
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {brandingForm.bannerImages?.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {brandingForm.bannerImages.map((src, idx) => (
                    <div key={idx} className="flex items-center gap-2 glass rounded-lg p-2">
                      <img src={src} alt="" className="w-12 h-8 rounded object-cover" />
                      <p className="text-xs text-muted-foreground truncate flex-1">{src}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setBrandingForm(prev => ({
                            ...prev,
                            bannerImages: prev.bannerImages.filter((_, i) => i !== idx),
                          }));
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <h3 className="font-display font-semibold text-lg mb-4">Logo</h3>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                  {brandingForm.logoImage ? (
                    <img src={brandingForm.logoImage} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-3xl font-bold text-muted-foreground">
                      {brandingForm.siteName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <Button onClick={handleLogoUpload} variant="outline" size="sm" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Upload
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setBrandingForm(prev => ({ ...prev, logoImage: '' }))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    value={brandingForm.logoImage}
                    onChange={(e) => setBrandingForm(prev => ({ ...prev, logoImage: e.target.value }))}
                    placeholder="Ou cole uma URL"
                  />
                </div>
              </div>
            </GlassCard>

            <div className="flex justify-end">
              <Button onClick={handleSaveBranding} className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
                <Save className="w-4 h-4" />
                Salvar Branding
              </Button>
            </div>
          </TabsContent>

          {/* ===== Colors Tab ===== */}
          <TabsContent value="cores" className="space-y-6 mt-6">
            <GlassCard>
              <h3 className="font-display font-semibold text-lg mb-6">Paleta de Cores</h3>
              <div className="space-y-6">
                <ColorPicker
                  label="Cor Primária"
                  value={colors.primary}
                  onChange={(value) => setColors(prev => ({ ...prev, primary: value }))}
                  description="Botões e elementos de destaque"
                />
                <ColorPicker
                  label="Cor de Destaque"
                  value={colors.accent}
                  onChange={(value) => setColors(prev => ({ ...prev, accent: value }))}
                  description="Gradientes e elementos secundários"
                />
                <ColorPicker
                  label="Cor de Fundo"
                  value={colors.background}
                  onChange={(value) => setColors(prev => ({ ...prev, background: value }))}
                  description="Background do app"
                />
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-display font-semibold text-lg mb-4">Presets</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setColors({ primary: preset.primary, accent: preset.accent, background: preset.bg })}
                    className="p-3 rounded-xl border border-border hover:border-amber-500/50 transition-colors text-center"
                  >
                    <div className="flex justify-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: `hsl(${preset.primary})` }} />
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: `hsl(${preset.accent})` }} />
                    </div>
                    <p className="text-xs font-medium">{preset.name}</p>
                  </button>
                ))}
              </div>
            </GlassCard>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => {
                resetToDefaults();
                setColors({ primary: '270 70% 60%', accent: '280 60% 70%', background: '260 30% 6%' });
                toast.success('Cores resetadas!');
              }} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Resetar
              </Button>
              <Button onClick={handleSaveColors} className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
                <Save className="w-4 h-4" />
                Salvar Cores
              </Button>
            </div>
          </TabsContent>

          {/* ===== Icons Tab ===== */}
          <TabsContent value="icones" className="space-y-6 mt-6">
            {iconCategories.map((category) => (
              <GlassCard key={category.title}>
                <h3 className="font-display font-semibold mb-4">{category.title}</h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {category.icons.map((icon) => (
                    <button
                      key={icon.key}
                      onClick={() => openIconPicker(icon.key)}
                      className="glass glass-hover rounded-xl p-3 text-center transition-all hover:scale-105 hover:ring-2 hover:ring-amber-500/50"
                    >
                      <div className="flex items-center justify-center mb-1 h-6">
                        <DynamicIcon icon={iconsForm[icon.key]} size={24} className="text-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">{icon.label}</p>
                    </button>
                  ))}
                </div>
              </GlassCard>
            ))}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => {
                resetIconsToDefaults();
                setIconsForm({ ...config.icons });
                toast.success('Ícones resetados!');
              }} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Resetar
              </Button>
              <Button onClick={handleSaveIcons} className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
                <Save className="w-4 h-4" />
                Salvar Ícones
              </Button>
            </div>
          </TabsContent>

          {/* ===== Explorar Tab ===== */}
          <TabsContent value="explorar" className="space-y-6 mt-6">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Itens do Explorar</h3>
                <Button onClick={handleAddExplorarAction} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3">
                {explorarForm.map((action, index) => (
                  <div key={index} className="glass rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openExplorarIconPicker(index)}
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center hover:scale-105 transition-transform`}
                      >
                        <DynamicIcon icon={action.icon} size={20} className="text-white" />
                      </button>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input
                          value={action.label}
                          onChange={(e) => handleUpdateExplorarAction(index, { label: e.target.value })}
                          placeholder="Nome"
                        />
                        <Select
                          value={action.path}
                          onValueChange={(value) => handleUpdateExplorarAction(index, { path: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Rota" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoutes.map((route) => (
                              <SelectItem key={route.path} value={route.path}>
                                {route.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={action.color}
                          onValueChange={(value) => handleUpdateExplorarAction(index, { color: value })}
                        >
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded bg-gradient-to-r ${action.color}`} />
                              <span className="truncate text-xs">Cor</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {availableGradientColors.map((color) => (
                              <SelectItem key={color.id} value={color.id}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded bg-gradient-to-r ${color.id}`} />
                                  <span>{color.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={action.enabled}
                          onCheckedChange={(checked) => handleUpdateExplorarAction(index, { enabled: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveExplorarAction(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {explorarForm.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum item configurado</p>
                  </div>
                )}
              </div>
            </GlassCard>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => {
                resetQuickActionsToDefaults();
                setExplorarForm([...defaultQuickActions]);
                toast.success('Explorar resetado!');
              }} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Resetar
              </Button>
              <Button onClick={handleSaveExplorar} className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
                <Save className="w-4 h-4" />
                Salvar Explorar
              </Button>
            </div>
          </TabsContent>

          {/* ===== Comunidade Tab ===== */}
          <TabsContent value="comunidade" className="space-y-6 mt-6">
            <GlassCard>
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Configurações do Fórum
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Título do Fórum</Label>
                  <Input
                    value={comunidadeForm.title}
                    onChange={(e) => setComunidadeForm({ ...comunidadeForm, title: e.target.value })}
                    placeholder="Ex: Fórum da comunidade"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={comunidadeForm.description}
                    onChange={(e) => setComunidadeForm({ ...comunidadeForm, description: e.target.value })}
                    placeholder="Ex: Participe das discussões..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Label Avisos</Label>
                    <Input
                      value={comunidadeForm.avisosTabLabel}
                      onChange={(e) => setComunidadeForm({ ...comunidadeForm, avisosTabLabel: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Label Ideias</Label>
                    <Input
                      value={comunidadeForm.ideiasTabLabel}
                      onChange={(e) => setComunidadeForm({ ...comunidadeForm, ideiasTabLabel: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Aba de Vídeos</Label>
                    <p className="text-xs text-muted-foreground">Mostra/oculta a galeria</p>
                  </div>
                  <Switch
                    checked={comunidadeForm.videosTabEnabled}
                    onCheckedChange={(checked) => setComunidadeForm({ ...comunidadeForm, videosTabEnabled: checked })}
                  />
                </div>
                {comunidadeForm.videosTabEnabled && (
                  <div>
                    <Label>Label Vídeos</Label>
                    <Input
                      value={comunidadeForm.videosTabLabel}
                      onChange={(e) => setComunidadeForm({ ...comunidadeForm, videosTabLabel: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                Área VIP
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Aba VIP</Label>
                    <p className="text-xs text-muted-foreground">Mostra/oculta na comunidade</p>
                  </div>
                  <Switch
                    checked={comunidadeForm.vipTabEnabled}
                    onCheckedChange={(checked) => setComunidadeForm({ ...comunidadeForm, vipTabEnabled: checked })}
                  />
                </div>
                {comunidadeForm.vipTabEnabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Label da Aba</Label>
                        <Input
                          value={comunidadeForm.vipTabLabel}
                          onChange={(e) => setComunidadeForm({ ...comunidadeForm, vipTabLabel: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={comunidadeForm.vipTitle}
                          onChange={(e) => setComunidadeForm({ ...comunidadeForm, vipTitle: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Descrição VIP</Label>
                      <Textarea
                        value={comunidadeForm.vipDescription}
                        onChange={(e) => setComunidadeForm({ ...comunidadeForm, vipDescription: e.target.value })}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Texto do Botão</Label>
                      <Input
                        value={comunidadeForm.vipButtonLabel}
                        onChange={(e) => setComunidadeForm({ ...comunidadeForm, vipButtonLabel: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </div>
            </GlassCard>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => {
                resetCommunityToDefaults();
                toast.success('Comunidade resetada!');
              }} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Resetar
              </Button>
              <Button onClick={handleSaveComunidade} className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
                <Save className="w-4 h-4" />
                Salvar Comunidade
              </Button>
            </div>
          </TabsContent>

          {/* ===== Navegação Tab ===== */}
          <TabsContent value="navegacao" className="space-y-6 mt-6">
            <GlassCard>
              <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-amber-400" />
                Abas de Navegação
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Configure quais abas aparecem na barra de navegação inferior. Mantenha pelo menos 2 abas visíveis.
              </p>
              
              <div className="space-y-4">
                {navigationForm.sort((a, b) => a.order - b.order).map((tab, index) => {
                  const originalIndex = navigationForm.findIndex(t => t.id === tab.id);
                  const enabledCount = navigationForm.filter(t => t.enabled).length;
                  const isLastEnabled = tab.enabled && enabledCount <= 2;
                  
                  return (
                    <div
                      key={tab.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/50"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-sm font-mono w-6">{tab.order + 1}</span>
                      </div>
                      
                      <button
                        onClick={() => openNavIconPicker(originalIndex)}
                        className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
                      >
                        <DynamicIcon icon={tab.icon} size={20} />
                      </button>
                      
                      <div className="flex-1 space-y-2">
                        <Input
                          value={tab.label}
                          onChange={(e) => handleUpdateNavTab(originalIndex, { label: e.target.value })}
                          placeholder="Nome da aba"
                          className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">
                          Rota: <code className="bg-muted px-1 rounded">{tab.path}</code>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`nav-${tab.id}`} className="text-sm text-muted-foreground">
                          {tab.enabled ? 'Visível' : 'Oculto'}
                        </Label>
                        <Switch
                          id={`nav-${tab.id}`}
                          checked={tab.enabled}
                          onCheckedChange={(checked) => handleUpdateNavTab(originalIndex, { enabled: checked })}
                          disabled={isLastEnabled && tab.enabled}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Preview */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-medium mb-3">Preview da navegação:</h4>
                <div className="bg-background rounded-xl p-3 border border-border">
                  <div className="flex items-center justify-around">
                    {navigationForm
                      .filter(tab => tab.enabled)
                      .sort((a, b) => a.order - b.order)
                      .map((tab) => (
                        <div
                          key={tab.id}
                          className="flex flex-col items-center gap-1 py-2 px-3"
                        >
                          <DynamicIcon icon={tab.icon} size={18} className="text-primary" />
                          <span className="text-[10px] font-medium text-primary">
                            {tab.label}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleResetNavigation} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Resetar para padrão
              </Button>
              <Button onClick={handleSaveNavigation} className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
                <Save className="w-4 h-4" />
                Salvar Navegação
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Icon Picker Dialog */}
        <Dialog open={showIconPicker} onOpenChange={setShowIconPicker}>
          <DialogContent className="max-w-xl max-h-[70vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Escolher Ícone</DialogTitle>
            </DialogHeader>
            
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={iconSearchQuery}
                  onChange={(e) => setIconSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs value={iconPickerTab} onValueChange={(v) => setIconPickerTab(v as 'lucide' | 'emoji')} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lucide">Vetoriais</TabsTrigger>
                <TabsTrigger value="emoji">Emojis</TabsTrigger>
              </TabsList>

              <TabsContent value="lucide" className="mt-4 flex-1 overflow-hidden">
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-8 gap-1">
                    {filteredLucideIcons.slice(0, 100).map((icon) => {
                      const IconComponent = getLucideIcon(icon.id);
                      if (!IconComponent) return null;
                      return (
                        <button
                          key={icon.id}
                          onClick={() => selectIcon({ type: 'lucide', value: icon.id })}
                          className="p-2 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center"
                          title={icon.label}
                        >
                          <IconComponent size={18} />
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="emoji" className="mt-4 flex-1 overflow-hidden">
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-8 gap-2">
                    {availableEmojis.filter(e => e.label.toLowerCase().includes(iconSearchQuery.toLowerCase())).map((emoji) => (
                      <button
                        key={emoji.id}
                        onClick={() => selectIcon({ type: 'emoji', value: emoji.emoji })}
                        className="p-2 text-xl rounded-lg hover:bg-primary/20 transition-colors"
                        title={emoji.label}
                      >
                        {emoji.emoji}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Explorar Icon Picker Dialog */}
        <Dialog open={showExplorarIconPicker} onOpenChange={setShowExplorarIconPicker}>
          <DialogContent className="max-w-xl max-h-[70vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Escolher Ícone</DialogTitle>
            </DialogHeader>
            
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={iconSearchQuery}
                  onChange={(e) => setIconSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs defaultValue="lucide" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lucide">Vetoriais</TabsTrigger>
                <TabsTrigger value="emoji">Emojis</TabsTrigger>
              </TabsList>

              <TabsContent value="lucide" className="mt-4 flex-1 overflow-hidden">
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-8 gap-1">
                    {filteredLucideIcons.slice(0, 100).map((icon) => {
                      const IconComponent = getLucideIcon(icon.id);
                      if (!IconComponent) return null;
                      return (
                        <button
                          key={icon.id}
                          onClick={() => handleSelectExplorarIcon({ type: 'lucide', value: icon.id })}
                          className="p-2 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center"
                          title={icon.label}
                        >
                          <IconComponent size={18} />
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="emoji" className="mt-4 flex-1 overflow-hidden">
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-8 gap-2">
                    {availableEmojis.filter(e => e.label.toLowerCase().includes(iconSearchQuery.toLowerCase())).map((emoji) => (
                      <button
                        key={emoji.id}
                        onClick={() => handleSelectExplorarIcon({ type: 'emoji', value: emoji.emoji })}
                        className="p-2 text-xl rounded-lg hover:bg-primary/20 transition-colors"
                        title={emoji.label}
                      >
                        {emoji.emoji}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Navigation Icon Picker Dialog */}
        <Dialog open={showNavIconPicker} onOpenChange={setShowNavIconPicker}>
          <DialogContent className="max-w-xl max-h-[70vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Escolher Ícone de Navegação</DialogTitle>
            </DialogHeader>
            
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={iconSearchQuery}
                  onChange={(e) => setIconSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs defaultValue="lucide" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lucide">Vetoriais</TabsTrigger>
                <TabsTrigger value="emoji">Emojis</TabsTrigger>
              </TabsList>

              <TabsContent value="lucide" className="mt-4 flex-1 overflow-hidden">
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-8 gap-1">
                    {filteredLucideIcons.slice(0, 100).map((icon) => {
                      const IconComponent = getLucideIcon(icon.id);
                      if (!IconComponent) return null;
                      return (
                        <button
                          key={icon.id}
                          onClick={() => handleSelectNavIcon({ type: 'lucide', value: icon.id })}
                          className="p-2 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center"
                          title={icon.label}
                        >
                          <IconComponent size={18} />
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="emoji" className="mt-4 flex-1 overflow-hidden">
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-8 gap-2">
                    {availableEmojis.filter(e => e.label.toLowerCase().includes(iconSearchQuery.toLowerCase())).map((emoji) => (
                      <button
                        key={emoji.id}
                        onClick={() => handleSelectNavIcon({ type: 'emoji', value: emoji.emoji })}
                        className="p-2 text-xl rounded-lg hover:bg-primary/20 transition-colors"
                        title={emoji.label}
                      >
                        {emoji.emoji}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </CEOLayout>
  );
};

export default CEOPersonalizacao;
