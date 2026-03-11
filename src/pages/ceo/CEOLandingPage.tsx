import { motion } from 'framer-motion';
import { Layout, Eye, EyeOff, Type, Save } from 'lucide-react';
import { CEOLayout } from './CEOLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { toast } from 'sonner';

interface SectionToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

const SectionToggle = ({ label, description, checked, onCheckedChange }: SectionToggleProps) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {checked ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
      <div>
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

const CEOLandingPage = () => {
  const { config, setConfig } = useWhiteLabel();
  const lp = config.landingPage;

  const update = (partial: Partial<typeof lp>) => {
    setConfig({
      ...config,
      landingPage: { ...lp, ...partial },
    });
  };

  const handleSave = () => {
    toast.success('Configurações da Landing Page salvas!');
  };

  return (
    <CEOLayout title="Landing Page">
      <div className="space-y-6 max-w-3xl">
        {/* Visibilidade das Seções */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold">Visibilidade das Seções</h3>
            </div>
            <div className="space-y-4">
              <SectionToggle label="Hero" description="Seção principal com título e CTA" checked={lp.heroVisible} onCheckedChange={(v) => update({ heroVisible: v })} />
              <Separator />
              <SectionToggle label="Estatísticas" description="Barra de números (100% Grátis, ∞ Conteúdos...)" checked={lp.statsVisible} onCheckedChange={(v) => update({ statsVisible: v })} />
              <Separator />
              <SectionToggle label="Recursos" description="Cards com funcionalidades da plataforma" checked={lp.featuresVisible} onCheckedChange={(v) => update({ featuresVisible: v })} />
              <Separator />
              <SectionToggle label="Passo a Passo" description="Seção 'Como Funciona'" checked={lp.stepsVisible} onCheckedChange={(v) => update({ stepsVisible: v })} />
              <Separator />
              <SectionToggle label="Destaque Gratuito" description="Seção 'Totalmente grátis'" checked={lp.freeHighlightVisible} onCheckedChange={(v) => update({ freeHighlightVisible: v })} />
              <Separator />
              <SectionToggle label="Depoimentos" description="Testemunhos de criadores" checked={lp.testimonialsVisible} onCheckedChange={(v) => update({ testimonialsVisible: v })} />
              <Separator />
              <SectionToggle label="CTA Final" description="Chamada para ação no final da página" checked={lp.ctaVisible} onCheckedChange={(v) => update({ ctaVisible: v })} />
            </div>
          </GlassCard>
        </motion.div>

        {/* Textos do Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold">Textos do Hero</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Badge (topo)</Label>
                <Input value={lp.heroBadgeText} onChange={(e) => update({ heroBadgeText: e.target.value })} className="mt-1" placeholder="100% Grátis — Crie sua loja agora" />
              </div>
              <div>
                <Label>Título Principal</Label>
                <Input value={lp.heroTitle} onChange={(e) => update({ heroTitle: e.target.value })} className="mt-1" placeholder="Sua loja ASMR completa em minutos" />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Textarea value={lp.heroSubtitle} onChange={(e) => update({ heroSubtitle: e.target.value })} className="mt-1" placeholder="Loja, comunidade, assinaturas VIP..." rows={2} />
              </div>
              <div>
                <Label>Botão CTA</Label>
                <Input value={lp.heroCtaText} onChange={(e) => update({ heroCtaText: e.target.value })} className="mt-1" placeholder="Criar Minha Loja Grátis" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Textos dos Recursos */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Layout className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold">Textos das Seções</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Seção Recursos</Label>
                <Input value={lp.featuresTitle} onChange={(e) => update({ featuresTitle: e.target.value })} className="mt-1" placeholder="Tudo para monetizar seu conteúdo" />
                <Input value={lp.featuresSubtitle} onChange={(e) => update({ featuresSubtitle: e.target.value })} className="mt-2" placeholder="Ferramentas feitas sob medida..." />
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Seção Passo a Passo</Label>
                <Input value={lp.stepsTitle} onChange={(e) => update({ stepsTitle: e.target.value })} className="mt-1" placeholder="Como funciona" />
                <Input value={lp.stepsSubtitle} onChange={(e) => update({ stepsSubtitle: e.target.value })} className="mt-2" placeholder="4 passos para ter sua loja no ar" />
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Destaque Gratuito</Label>
                <Input value={lp.freeHighlightTitle} onChange={(e) => update({ freeHighlightTitle: e.target.value })} className="mt-1" placeholder="Totalmente grátis" />
                <Textarea value={lp.freeHighlightDescription} onChange={(e) => update({ freeHighlightDescription: e.target.value })} className="mt-2" placeholder="Sem mensalidades, sem taxas ocultas..." rows={2} />
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Depoimentos</Label>
                <Input value={lp.testimonialsTitle} onChange={(e) => update({ testimonialsTitle: e.target.value })} className="mt-1" placeholder="Criadores que confiam" />
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">CTA Final</Label>
                <Input value={lp.ctaTitle} onChange={(e) => update({ ctaTitle: e.target.value })} className="mt-1" placeholder="Pronto para criar sua loja ASMR?" />
                <Textarea value={lp.ctaDescription} onChange={(e) => update({ ctaDescription: e.target.value })} className="mt-2" placeholder="Junte-se a criadores..." rows={2} />
                <Input value={lp.ctaButtonText} onChange={(e) => update({ ctaButtonText: e.target.value })} className="mt-2" placeholder="Criar Minha Loja Grátis" />
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Footer</Label>
                <Input value={lp.footerName} onChange={(e) => update({ footerName: e.target.value })} className="mt-1" placeholder="ASMR Store" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Salvar Landing Page
          </Button>
        </div>
      </div>
    </CEOLayout>
  );
};

export default CEOLandingPage;
