import React, { useEffect, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useTenant } from '@/contexts/TenantContext';

interface QRCodeConfig {
  url: string;
  size: number;
  fgColor: string;
  bgColor: string;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  cornerRadius: number;
  dotStyle: 'square' | 'rounded' | 'dots';
}

const PRESET_COLORS = [
  { label: 'Preto', fg: '#000000', bg: '#ffffff' },
  { label: 'Roxo', fg: '#7c3aed', bg: '#ffffff' },
  { label: 'Azul', fg: '#2563eb', bg: '#ffffff' },
  { label: 'Rosa', fg: '#ec4899', bg: '#ffffff' },
  { label: 'Verde', fg: '#10b981', bg: '#ffffff' },
  { label: 'Vermelho', fg: '#ef4444', bg: '#ffffff' },
  { label: 'Neon', fg: '#a855f7', bg: '#0a0a0a' },
  { label: 'Gold', fg: '#d97706', bg: '#1a1a2e' },
];

const QRCodeGenerator: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { store } = useTenant();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const storeUrl = store?.slug 
    ? `${window.location.origin}/${store.slug}` 
    : window.location.origin;

  const [config, setConfig] = useState<QRCodeConfig>({
    url: storeUrl,
    size: 300,
    fgColor: '#000000',
    bgColor: '#ffffff',
    errorCorrection: 'M',
    cornerRadius: 0,
    dotStyle: 'square',
  });

  useEffect(() => {
    renderQRCode();
  }, [config]);

  const renderQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const qr = qrcode(0, config.errorCorrection);
    qr.addData(config.url || storeUrl);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const cellSize = config.size / moduleCount;
    
    canvas.width = config.size;
    canvas.height = config.size;

    // Background
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, config.size, config.size);

    // Draw modules
    ctx.fillStyle = config.fgColor;
    const radius = config.dotStyle === 'dots' 
      ? cellSize * 0.4 
      : config.dotStyle === 'rounded' 
        ? cellSize * 0.2 
        : 0;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          const x = col * cellSize;
          const y = row * cellSize;

          if (config.dotStyle === 'dots') {
            ctx.beginPath();
            ctx.arc(
              x + cellSize / 2,
              y + cellSize / 2,
              radius,
              0,
              Math.PI * 2
            );
            ctx.fill();
          } else if (config.dotStyle === 'rounded') {
            drawRoundRect(ctx, x, y, cellSize, cellSize, radius);
          } else {
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }
    }
  };

  const drawRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  };

  const downloadQR = (format: 'png' | 'svg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `qrcode-${store?.slug || 'store'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else {
      // Generate SVG
      const qr = qrcode(0, config.errorCorrection);
      qr.addData(config.url || storeUrl);
      qr.make();
      const svgStr = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = `qrcode-${store?.slug || 'store'}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
    }

    toast({ title: t('admin.qrcode.downloaded', 'QR Code downloaded!') });
  };

  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png')
      );
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast({ title: t('admin.qrcode.copied', 'QR Code copied to clipboard!') });
    } catch {
      toast({ title: t('admin.qrcode.copyError', 'Could not copy'), variant: 'destructive' });
    }
  };

  const applyPreset = (preset: typeof PRESET_COLORS[0]) => {
    setConfig(prev => ({ ...prev, fgColor: preset.fg, bgColor: preset.bg }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <GlassCard className="p-5">
        <p className="text-sm text-muted-foreground">
          {t('admin.qrcode.description', 'Generate a customizable QR Code to add to your videos and content. Your fans can scan it to access your platform directly.')}
        </p>
      </GlassCard>

      {/* Preview */}
      <GlassCard className="p-6">
        <div className="flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            className="rounded-xl shadow-lg"
            style={{ width: Math.min(config.size, 280), height: Math.min(config.size, 280) }}
          />
          <p className="text-xs text-muted-foreground text-center break-all max-w-xs">
            {config.url}
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button size="sm" variant="outline" onClick={() => downloadQR('png')} className="gap-2">
              <Download className="w-4 h-4" /> PNG
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadQR('svg')} className="gap-2">
              <Download className="w-4 h-4" /> SVG
            </Button>
            <Button size="sm" variant="outline" onClick={copyToClipboard} className="gap-2">
              <Copy className="w-4 h-4" /> {t('admin.qrcode.copy', 'Copy')}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* URL */}
      <GlassCard className="p-5 space-y-3">
        <Label className="text-sm font-medium">URL</Label>
        <Input
          value={config.url}
          onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
          placeholder={storeUrl}
          className="bg-background/50 border-border/30"
        />
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 text-xs text-muted-foreground"
          onClick={() => setConfig(prev => ({ ...prev, url: storeUrl }))}
        >
          <RefreshCw className="w-3 h-3" /> {t('admin.qrcode.resetUrl', 'Reset to store URL')}
        </Button>
      </GlassCard>

      {/* Color presets */}
      <GlassCard className="p-5 space-y-3">
        <Label className="text-sm font-medium">{t('admin.qrcode.colorPresets', 'Color Presets')}</Label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/30 hover:border-primary/50 transition-colors text-xs"
              title={preset.label}
            >
              <span
                className="w-4 h-4 rounded-full border border-border/30"
                style={{ background: preset.fg }}
              />
              <span
                className="w-4 h-4 rounded-full border border-border/30"
                style={{ background: preset.bg }}
              />
              <span className="text-foreground/70">{preset.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Custom colors */}
      <GlassCard className="p-5 space-y-4">
        <Label className="text-sm font-medium">{t('admin.qrcode.customColors', 'Custom Colors')}</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('admin.qrcode.foreground', 'Foreground')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.fgColor}
                onChange={(e) => setConfig(prev => ({ ...prev, fgColor: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer border border-border/30"
              />
              <Input
                value={config.fgColor}
                onChange={(e) => setConfig(prev => ({ ...prev, fgColor: e.target.value }))}
                className="flex-1 bg-background/50 border-border/30 text-xs font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('admin.qrcode.background', 'Background')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.bgColor}
                onChange={(e) => setConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer border border-border/30"
              />
              <Input
                value={config.bgColor}
                onChange={(e) => setConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                className="flex-1 bg-background/50 border-border/30 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Style options */}
      <GlassCard className="p-5 space-y-4">
        <Label className="text-sm font-medium">{t('admin.qrcode.style', 'Style')}</Label>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('admin.qrcode.dotStyle', 'Dot Style')}</Label>
            <Select value={config.dotStyle} onValueChange={(v) => setConfig(prev => ({ ...prev, dotStyle: v as QRCodeConfig['dotStyle'] }))}>
              <SelectTrigger className="bg-background/50 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">{t('admin.qrcode.square', 'Square')}</SelectItem>
                <SelectItem value="rounded">{t('admin.qrcode.rounded', 'Rounded')}</SelectItem>
                <SelectItem value="dots">{t('admin.qrcode.dots', 'Dots')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t('admin.qrcode.errorCorrection', 'Error Correction')}
            </Label>
            <Select value={config.errorCorrection} onValueChange={(v) => setConfig(prev => ({ ...prev, errorCorrection: v as QRCodeConfig['errorCorrection'] }))}>
              <SelectTrigger className="bg-background/50 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Low (7%)</SelectItem>
                <SelectItem value="M">Medium (15%)</SelectItem>
                <SelectItem value="Q">Quartile (25%)</SelectItem>
                <SelectItem value="H">High (30%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t('admin.qrcode.size', 'Size')}: {config.size}px
            </Label>
            <Slider
              value={[config.size]}
              onValueChange={(v) => setConfig(prev => ({ ...prev, size: v[0] }))}
              min={200}
              max={800}
              step={50}
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default QRCodeGenerator;
