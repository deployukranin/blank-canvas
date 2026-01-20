import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Plus, Trash2, GripVertical, Eye, EyeOff, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  useWhiteLabel, 
  availableLucideIcons, 
  availableEmojis, 
  availableGradientColors, 
  availableRoutes,
  defaultQuickActions,
  QuickActionItem,
  IconItem
} from '@/contexts/WhiteLabelContext';
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

// Get unique categories from icons
const lucideCategories = [...new Set(availableLucideIcons.map(i => i.category))];

const CEOExplorar = () => {
  const { config, updateQuickActions, resetQuickActionsToDefaults } = useWhiteLabel();
  const [form, setForm] = useState<QuickActionItem[]>([...config.quickActions]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerTab, setPickerTab] = useState<'lucide' | 'emoji'>('lucide');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleSave = () => {
    updateQuickActions(form);
    toast.success('Seção Explorar salva com sucesso!');
  };

  const handleReset = () => {
    resetQuickActionsToDefaults();
    setForm([...defaultQuickActions]);
    toast.success('Seção Explorar resetada para o padrão!');
  };

  const handleAddAction = () => {
    const newAction: QuickActionItem = {
      icon: { type: 'lucide', value: 'Star' },
      label: 'Novo Item',
      path: '/ideias',
      color: 'from-violet-500 to-purple-500',
      enabled: true,
    };
    setForm([...form, newAction]);
  };

  const handleRemoveAction = (index: number) => {
    setForm(form.filter((_, i) => i !== index));
  };

  const handleUpdateAction = (index: number, updates: Partial<QuickActionItem>) => {
    setForm(form.map((action, i) => (i === index ? { ...action, ...updates } : action)));
  };

  const openIconPicker = (index: number) => {
    setEditingIndex(index);
    setShowIconPicker(true);
  };

  const handleSelectIcon = (icon: IconItem) => {
    if (editingIndex !== null) {
      handleUpdateAction(editingIndex, { icon });
    }
    setShowIconPicker(false);
    setEditingIndex(null);
  };

  // Group and filter icons
  const groupedIcons = useMemo(() => {
    const filtered = availableLucideIcons.filter(icon => {
      const matchesSearch = icon.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           icon.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || icon.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return filtered.reduce((acc, icon) => {
      if (!acc[icon.category]) {
        acc[icon.category] = [];
      }
      acc[icon.category].push(icon);
      return acc;
    }, {} as Record<string, Array<{ id: string; label: string; category: string }>>);
  }, [searchQuery, selectedCategory]);

  const filteredEmojis = useMemo(() => {
    return availableEmojis.filter(emoji => 
      emoji.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <CEOLayout title="Configurar Explorar">
      <div className="space-y-6 max-w-4xl">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Configure os itens que aparecem na seção "Explorar" da página inicial
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Resetar
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Preview */}
        <GlassCard className="p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </h3>
          <div className="bg-background/50 rounded-xl p-4">
            <h4 className="font-display font-semibold mb-3">Explorar</h4>
            <div className="grid grid-cols-3 gap-3">
              {form.filter(action => action.enabled).map((action, index) => (
                <div key={index} className="glass rounded-xl p-4 text-center">
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                    <DynamicIcon icon={action.icon} size={20} className="text-white" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Actions List */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Itens do Explorar</h3>
            <Button onClick={handleAddAction} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Item
            </Button>
          </div>

          <div className="space-y-4">
            {form.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle & Icon */}
                  <div className="flex items-center gap-2 pt-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <button
                      onClick={() => openIconPicker(index)}
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center hover:scale-105 transition-transform`}
                    >
                      <DynamicIcon icon={action.icon} size={24} className="text-white" />
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Label */}
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={action.label}
                        onChange={(e) => handleUpdateAction(index, { label: e.target.value })}
                        placeholder="Nome do item"
                      />
                    </div>

                    {/* Route */}
                    <div className="space-y-2">
                      <Label>Rota</Label>
                      <Select
                        value={action.path}
                        onValueChange={(value) => handleUpdateAction(index, { path: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a rota" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoutes.map((route) => (
                            <SelectItem key={route.path} value={route.path}>
                              {route.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                      <Label>Cor</Label>
                      <Select
                        value={action.color}
                        onValueChange={(value) => handleUpdateAction(index, { color: value })}
                      >
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded bg-gradient-to-r ${action.color}`} />
                            <span className="truncate">
                              {availableGradientColors.find(c => c.id === action.color)?.label || 'Selecione'}
                            </span>
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
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={action.enabled}
                        onCheckedChange={(checked) => handleUpdateAction(index, { enabled: checked })}
                      />
                      {action.enabled ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAction(index)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}

            {form.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum item configurado</p>
                <Button onClick={handleAddAction} variant="outline" size="sm" className="mt-2 gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar primeiro item
                </Button>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Icon Picker Dialog */}
        <Dialog open={showIconPicker} onOpenChange={setShowIconPicker}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Selecionar Ícone</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ícones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Type Tabs */}
              <Tabs value={pickerTab} onValueChange={(v) => setPickerTab(v as 'lucide' | 'emoji')}>
                <TabsList className="w-full">
                  <TabsTrigger value="lucide" className="flex-1">Vetoriais (Lucide)</TabsTrigger>
                  <TabsTrigger value="emoji" className="flex-1">Emojis</TabsTrigger>
                </TabsList>

                <TabsContent value="lucide" className="mt-4">
                  {/* Category Filter */}
                  <div className="mb-4">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {lucideCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-6">
                      {Object.entries(groupedIcons).map(([category, icons]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                          <div className="grid grid-cols-8 gap-2">
                            {icons.map((icon) => {
                              const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[icon.id];
                              return (
                                <button
                                  key={icon.id}
                                  onClick={() => handleSelectIcon({ type: 'lucide', value: icon.id })}
                                  className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors flex flex-col items-center gap-1"
                                  title={icon.label}
                                >
                                  {IconComponent ? <IconComponent className="w-5 h-5" /> : <span className="w-5 h-5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="emoji" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-8 gap-2">
                      {filteredEmojis.map((emoji) => (
                        <button
                          key={emoji.id}
                          onClick={() => handleSelectIcon({ type: 'emoji', value: emoji.emoji })}
                          className="p-2 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-center text-2xl"
                          title={emoji.label}
                        >
                          {emoji.emoji}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </CEOLayout>
  );
};

export default CEOExplorar;
