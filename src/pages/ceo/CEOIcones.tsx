import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Search, Filter } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWhiteLabel, availableLucideIcons, availableEmojis, IconConfig, IconItem } from '@/contexts/WhiteLabelContext';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { toast } from 'sonner';
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

// Icon categories for display
const iconCategories = [
  {
    title: 'Navegação',
    description: 'Ícones do menu de navegação',
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
    description: 'Ícones da tela inicial',
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
    description: 'Ícones de recursos',
    icons: [
      { key: 'featureVideos', label: 'Vídeos' },
      { key: 'featureAudios', label: 'Áudios' },
      { key: 'featureVIP', label: 'VIP' },
    ] as { key: keyof IconConfig; label: string }[],
  },
  {
    title: 'Geral',
    description: 'Outros ícones',
    icons: [
      { key: 'logoIcon', label: 'Logo' },
      { key: 'successIcon', label: 'Sucesso' },
    ] as { key: keyof IconConfig; label: string }[],
  },
];

// Get unique categories from icons
const lucideCategories = [...new Set(availableLucideIcons.map(i => i.category))];

// Get Lucide icon component by name
const getLucideIcon = (name: string): LucideIcons.LucideIcon | null => {
  const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
  return icons[name] || null;
};

const CEOIcones = () => {
  const { config, updateIcons, resetIconsToDefaults } = useWhiteLabel();
  const [form, setForm] = useState<IconConfig>({ ...config.icons });
  const [showPicker, setShowPicker] = useState(false);
  const [activeIconKey, setActiveIconKey] = useState<keyof IconConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerTab, setPickerTab] = useState<'lucide' | 'emoji'>('lucide');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleSave = () => {
    updateIcons(form);
    toast.success('Ícones salvos com sucesso!');
  };

  const handleReset = () => {
    resetIconsToDefaults();
    setForm({ ...config.icons });
    toast.success('Ícones resetados para o padrão!');
  };

  const openPicker = (key: keyof IconConfig) => {
    setActiveIconKey(key);
    setSearchQuery('');
    setPickerTab(form[key].type);
    setSelectedCategory('all');
    setShowPicker(true);
  };

  const selectIcon = (iconItem: IconItem) => {
    if (activeIconKey) {
      setForm(prev => ({ ...prev, [activeIconKey]: iconItem }));
    }
    setShowPicker(false);
  };

  const filteredLucideIcons = useMemo(() => {
    return availableLucideIcons.filter(icon => {
      const matchesSearch = 
        icon.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        icon.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || icon.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const filteredEmojis = useMemo(() => {
    return availableEmojis.filter(icon => 
      icon.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Group icons by category for display
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

  return (
    <CEOLayout title="Ícones">
      <div className="space-y-8 max-w-4xl">
        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <DynamicIcon icon={form.logoIcon} size={24} className="text-amber-400" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-amber-100 mb-1">
                  Personalize os Ícones
                </h2>
                <p className="text-amber-200/70 text-sm">
                  Mais de {availableLucideIcons.length} ícones vetoriais disponíveis! Escolha ícones Lucide ou emojis para cada seção.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Icon Categories */}
        {iconCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (categoryIndex + 1) }}
          >
            <GlassCard>
              <div className="mb-4">
                <h3 className="font-display font-semibold text-lg text-amber-100">
                  {category.title}
                </h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {category.icons.map((icon) => (
                  <button
                    key={icon.key}
                    onClick={() => openPicker(icon.key)}
                    className="glass glass-hover rounded-xl p-4 text-center transition-all hover:scale-105 hover:ring-2 hover:ring-amber-500/50"
                  >
                    <div className="flex items-center justify-center mb-2 h-8">
                      <DynamicIcon icon={form[icon.key]} size={28} className="text-foreground" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{icon.label}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {form[icon.key].type === 'lucide' ? 'Vetor' : 'Emoji'}
                    </p>
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        ))}

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard>
            <h3 className="font-display font-semibold text-lg mb-4 text-amber-100">
              Pré-visualização da Navegação
            </h3>
            <div className="flex items-center justify-around bg-background/50 rounded-xl p-4">
              {[
                { icon: form.navHome, label: 'Início' },
                { icon: form.navCustoms, label: "Custom's" },
                { icon: form.navLoja, label: 'Loja' },
                { icon: form.navComunidade, label: 'Comunidade' },
                { icon: form.navPerfil, label: 'Perfil' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <DynamicIcon icon={item.icon} size={24} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-end gap-4"
        >
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Resetar para Padrão
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
            <Save className="w-4 h-4" />
            Salvar Alterações
          </Button>
        </motion.div>
      </div>

      {/* Icon Picker Dialog */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="glass max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Escolher Ícone ({availableLucideIcons.length}+ disponíveis)</DialogTitle>
          </DialogHeader>
          
          <Tabs value={pickerTab} onValueChange={(v) => setPickerTab(v as 'lucide' | 'emoji')} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lucide">Vetoriais ({availableLucideIcons.length})</TabsTrigger>
              <TabsTrigger value="emoji">Emojis ({availableEmojis.length})</TabsTrigger>
            </TabsList>

            <div className="mt-4 flex-1 flex flex-col overflow-hidden">
              {/* Search and Filter */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ícone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {pickerTab === 'lucide' && (
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas ({availableLucideIcons.length})</SelectItem>
                      {lucideCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat} ({availableLucideIcons.filter(i => i.category === cat).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <TabsContent value="lucide" className="mt-0 flex-1 overflow-hidden">
                <ScrollArea className="h-[400px] pr-4">
                  {selectedCategory === 'all' ? (
                    // Grouped view
                    <div className="space-y-6">
                      {Object.entries(groupedIcons).map(([category, icons]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-background/80 backdrop-blur-sm py-1">
                            {category} ({icons.length})
                          </h4>
                          <div className="grid grid-cols-8 gap-1">
                            {icons.map((icon) => {
                              const IconComponent = getLucideIcon(icon.id);
                              if (!IconComponent) return null;
                              
                              return (
                                <button
                                  key={icon.id}
                                  onClick={() => selectIcon({ type: 'lucide', value: icon.id })}
                                  className="p-2 rounded-lg hover:bg-primary/20 transition-colors hover:scale-110 flex items-center justify-center group relative"
                                  title={icon.label}
                                >
                                  <IconComponent size={20} />
                                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                                    {icon.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Flat view for filtered
                    <div className="grid grid-cols-8 gap-1">
                      {filteredLucideIcons.map((icon) => {
                        const IconComponent = getLucideIcon(icon.id);
                        if (!IconComponent) return null;
                        
                        return (
                          <button
                            key={icon.id}
                            onClick={() => selectIcon({ type: 'lucide', value: icon.id })}
                            className="p-2 rounded-lg hover:bg-primary/20 transition-colors hover:scale-110 flex items-center justify-center group relative"
                            title={icon.label}
                          >
                            <IconComponent size={20} />
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                              {icon.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {filteredLucideIcons.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum ícone encontrado para "{searchQuery}"
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="emoji" className="mt-0 flex-1 overflow-hidden">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-8 gap-2">
                    {filteredEmojis.map((icon) => (
                      <button
                        key={icon.id}
                        onClick={() => selectIcon({ type: 'emoji', value: icon.emoji })}
                        className="p-3 text-2xl rounded-lg hover:bg-primary/20 transition-colors hover:scale-110"
                        title={icon.label}
                      >
                        {icon.emoji}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 mt-4">
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Ou digite um emoji personalizado:
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Cole um emoji..."
                        maxLength={4}
                        className="text-center text-2xl"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value) {
                            selectIcon({ type: 'emoji', value: e.currentTarget.value });
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                          if (input?.value) {
                            selectIcon({ type: 'emoji', value: input.value });
                          }
                        }}
                      >
                        Usar
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </CEOLayout>
  );
};

export default CEOIcones;
