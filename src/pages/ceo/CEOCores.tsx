import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Save, RotateCcw, Sun, Moon } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
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

const formatHSL = (color: HSLColor): string => {
  return `${color.h} ${color.s}% ${color.l}%`;
};

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div 
          className="w-12 h-12 rounded-xl border-2 border-white/20 shadow-lg"
          style={{ backgroundColor: previewColor }}
        />
      </div>

      <div className="space-y-4 pl-4 border-l-2 border-border">
        {/* Hue */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Matiz (H)</span>
            <span className="font-mono">{hsl.h}°</span>
          </div>
          <Slider
            value={[hsl.h]}
            onValueChange={([v]) => handleChange('h', v)}
            max={360}
            step={1}
            className="[&_[role=slider]]:border-amber-400"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Saturação (S)</span>
            <span className="font-mono">{hsl.s}%</span>
          </div>
          <Slider
            value={[hsl.s]}
            onValueChange={([v]) => handleChange('s', v)}
            max={100}
            step={1}
            className="[&_[role=slider]]:border-amber-400"
          />
        </div>

        {/* Lightness */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Luminosidade (L)</span>
            <span className="font-mono">{hsl.l}%</span>
          </div>
          <Slider
            value={[hsl.l]}
            onValueChange={([v]) => handleChange('l', v)}
            max={100}
            step={1}
            className="[&_[role=slider]]:border-amber-400"
          />
        </div>
      </div>
    </div>
  );
};

const CEOCores = () => {
  const { config, updateColors, resetToDefaults } = useWhiteLabel();
  const [colors, setColors] = useState(config.colors);

  const handleSave = () => {
    updateColors(colors);
    toast.success('Cores atualizadas! As mudanças são aplicadas em tempo real.');
  };

  const handleReset = () => {
    resetToDefaults();
    setColors({
      primary: '270 70% 60%',
      accent: '280 60% 70%',
      background: '260 30% 6%',
    });
    toast.success('Cores resetadas para o padrão');
  };

  // Apply preview in real-time
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--ring', colors.primary);
  }, [colors]);

  return (
    <CEOLayout title="Cores do App">
      <div className="space-y-8 max-w-4xl">
        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="bg-amber-500/5 border-amber-500/20">
            <div className="flex items-start gap-4">
              <Palette className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-medium text-amber-100 mb-1">Preview em Tempo Real</h3>
                <p className="text-sm text-amber-200/70">
                  As alterações são aplicadas instantaneamente. Você pode ver as mudanças 
                  refletidas em todo o app enquanto ajusta os valores.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Color Pickers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard>
            <h3 className="font-display font-semibold text-lg mb-8">
              Paleta de Cores
            </h3>

            <div className="space-y-10">
              <ColorPicker
                label="Cor Primária"
                value={colors.primary}
                onChange={(value) => setColors(prev => ({ ...prev, primary: value }))}
                description="Usada em botões, links e elementos de destaque"
              />

              <ColorPicker
                label="Cor de Destaque (Accent)"
                value={colors.accent}
                onChange={(value) => setColors(prev => ({ ...prev, accent: value }))}
                description="Usada em gradientes e elementos secundários"
              />

              <ColorPicker
                label="Cor de Fundo"
                value={colors.background}
                onChange={(value) => setColors(prev => ({ ...prev, background: value }))}
                description="Cor base do background do app"
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Preview Components */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <h3 className="font-display font-semibold text-lg mb-6">
              Preview de Componentes
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button>Botão Primário</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-primary/20 border border-primary/30">
              <p className="text-sm">
                Card com cor primária - texto de exemplo para visualização
              </p>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-accent/20 border border-accent/30">
              <p className="text-sm">
                Card com cor de destaque - texto de exemplo para visualização
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Preset Colors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <GlassCard>
            <h3 className="font-display font-semibold text-lg mb-6">
              Presets de Cores
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Roxo ASMR', primary: '270 70% 60%', accent: '280 60% 70%', bg: '260 30% 6%' },
                { name: 'Rosa Suave', primary: '330 70% 60%', accent: '340 60% 70%', bg: '320 30% 6%' },
                { name: 'Azul Calmo', primary: '210 70% 50%', accent: '220 60% 65%', bg: '220 30% 6%' },
                { name: 'Verde Zen', primary: '160 60% 45%', accent: '170 50% 55%', bg: '170 30% 6%' },

                { name: 'Dourado VIP', primary: '45 80% 55%', accent: '35 90% 60%', bg: '42 30% 6%' },
                { name: 'Vermelho Neon', primary: '0 80% 55%', accent: '350 75% 60%', bg: '350 30% 6%' },
                { name: 'Laranja Energia', primary: '22 90% 55%', accent: '35 90% 60%', bg: '25 30% 6%' },
                { name: 'Amarelo Solar', primary: '52 90% 55%', accent: '45 90% 60%', bg: '50 30% 6%' },

                { name: 'Turquesa Praia', primary: '185 75% 45%', accent: '195 70% 60%', bg: '195 30% 6%' },
                { name: 'Ciano Tech', primary: '200 85% 55%', accent: '210 80% 60%', bg: '215 30% 6%' },
                { name: 'Indigo Night', primary: '235 75% 62%', accent: '260 70% 68%', bg: '240 30% 6%' },
                { name: 'Lavanda Dream', primary: '285 65% 65%', accent: '300 55% 72%', bg: '285 30% 6%' },

                { name: 'Mint Clean', primary: '145 55% 45%', accent: '155 50% 60%', bg: '160 30% 6%' },
                { name: 'Forest Dark', primary: '120 45% 35%', accent: '145 45% 50%', bg: '130 30% 5%' },
                { name: 'Berry Pop', primary: '310 75% 55%', accent: '290 70% 68%', bg: '305 30% 6%' },
                { name: 'Chocolate', primary: '25 45% 45%', accent: '15 55% 55%', bg: '20 25% 6%' },
              ].map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setColors({ primary: preset.primary, accent: preset.accent, background: preset.bg })}
                  className="p-4 rounded-xl border border-border hover:border-amber-500/50 transition-colors text-center"
                >
                  <div className="flex justify-center gap-2 mb-3">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${preset.primary})` }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${preset.accent})` }}
                    />
                  </div>
                  <p className="text-sm font-medium">{preset.name}</p>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between"
        >
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Resetar Cores
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
            <Save className="w-4 h-4" />
            Salvar Cores
          </Button>
        </motion.div>
      </div>
    </CEOLayout>
  );
};

export default CEOCores;
