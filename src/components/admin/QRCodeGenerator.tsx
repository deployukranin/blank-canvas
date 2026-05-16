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

const PRODUCTION_DOMAIN = 'www.mytinglebox.com';

interface QRCodeConfig {
  url: string;
  size: number;
  fgColor: string;
  bgColor: string;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  dotStyle: 'square' | 'rounded' | 'dots';
  centerEmoji: string;
  showCenter: boolean;
  borderColor: string;
  showGradient: boolean;
  gradientColor: string;
}

const PRESET_COLORS = [
  { label: 'Clássico', fg: '#000000', bg: '#ffffff', border: '#000000' },
  { label: 'Roxo', fg: '#7c3aed', bg: '#ffffff', border: '#7c3aed' },
  { label: 'Azul', fg: '#2563eb', bg: '#ffffff', border: '#2563eb' },
  { label: 'Rosa', fg: '#ec4899', bg: '#ffffff', border: '#ec4899' },
  { label: 'Verde', fg: '#10b981', bg: '#ffffff', border: '#10b981' },
  { label: 'Vermelho', fg: '#ef4444', bg: '#ffffff', border: '#ef4444' },
  { label: 'Neon', fg: '#a855f7', bg: '#0a0a0a', border: '#a855f7' },
  { label: 'Gold', fg: '#d97706', bg: '#1a1a2e', border: '#d97706' },
];

const CENTER_EMOJIS = [
  { label: 'Nenhum', value: '' },
  { label: '🎵 Música', value: '🎵' },
  { label: '🎧 Headphone', value: '🎧' },
  { label: '🌙 Lua', value: '🌙' },
  { label: '✨ Estrelas', value: '✨' },
  { label: '💜 Coração', value: '💜' },
  { label: '🔥 Fogo', value: '🔥' },
  { label: '⭐ Estrela', value: '⭐' },
  { label: '🎬 Cinema', value: '🎬' },
  { label: '🎤 Microfone', value: '🎤' },
  { label: '👑 Coroa', value: '👑' },
  { label: '💎 Diamante', value: '💎' },
  { label: '🦋 Borboleta', value: '🦋' },
  { label: '🍃 Folha', value: '🍃' },
  { label: '🌸 Flor', value: '🌸' },
  { label: '😴 Sono', value: '😴' },
  { label: '💤 ZZZ', value: '💤' },
  { label: '🫧 Bolhas', value: '🫧' },
  { label: '🎯 Alvo', value: '🎯' },
  { label: '🚀 Foguete', value: '🚀' },
];

const QRCodeGenerator: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { store } = useTenant();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getProductionUrl = () => {
    return store?.slug
      ? `https://${PRODUCTION_DOMAIN}/${store.slug}`
      : `https://${PRODUCTION_DOMAIN}`;
  };

  const storeUrl = getProductionUrl();

  const [config, setConfig] = useState<QRCodeConfig>({
    url: storeUrl,
    size: 400,
    fgColor: '#000000',
    bgColor: '#ffffff',
    errorCorrection: 'H',
    dotStyle: 'rounded',
    centerEmoji: '🎧',
    showCenter: true,
    borderColor: '#7c3aed',
    showGradient: false,
    gradientColor: '#a855f7',
  });

  // Sync URL whenever store slug becomes available (avoid stale empty QR)
  const lastAutoUrlRef = useRef(storeUrl);
  useEffect(() => {
    setConfig((prev) => {
      // Only overwrite if user hasn't customized away from the previous auto URL
      if (prev.url === lastAutoUrlRef.current || !prev.url) {
        lastAutoUrlRef.current = storeUrl;
        return { ...prev, url: storeUrl };
      }
      lastAutoUrlRef.current = storeUrl;
      return prev;
    });
  }, [storeUrl]);

  useEffect(() => {
    renderQRCode();
  }, [config]);

  const renderQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 24;
    const totalSize = config.size + padding * 2;
    canvas.width = totalSize;
    canvas.height = totalSize;

    // Background with rounded corners
    ctx.clearRect(0, 0, totalSize, totalSize);

    // Outer border/frame
    const borderRadius = 24;
    ctx.fillStyle = config.borderColor;
    drawRoundRect(ctx, 0, 0, totalSize, totalSize, borderRadius);
    ctx.fill();

    // Inner background
    ctx.fillStyle = config.bgColor;
    drawRoundRect(ctx, 4, 4, totalSize - 8, totalSize - 8, borderRadius - 2);
    ctx.fill();

    // Generate QR
    const qr = qrcode(0, config.errorCorrection);
    qr.addData(config.url || storeUrl);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const qrAreaSize = config.size - padding;
    const cellSize = qrAreaSize / moduleCount;
    const offsetX = padding + (padding / 2);
    const offsetY = padding + (padding / 2);

    // Gradient support
    let fillStyle: string | CanvasGradient = config.fgColor;
    if (config.showGradient) {
      const gradient = ctx.createLinearGradient(offsetX, offsetY, offsetX + qrAreaSize, offsetY + qrAreaSize);
      gradient.addColorStop(0, config.fgColor);
      gradient.addColorStop(1, config.gradientColor);
      fillStyle = gradient;
    }

    ctx.fillStyle = fillStyle;

    // Center exclusion zone for emoji
    const centerZoneSize = config.showCenter && config.centerEmoji ? moduleCount * 0.25 : 0;
    const centerStart = (moduleCount - centerZoneSize) / 2;
    const centerEnd = (moduleCount + centerZoneSize) / 2;

    const radius = config.dotStyle === 'dots'
      ? cellSize * 0.38
      : config.dotStyle === 'rounded'
        ? cellSize * 0.22
        : 0;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        // Skip center area for emoji
        if (config.showCenter && config.centerEmoji &&
          row >= centerStart && row < centerEnd &&
          col >= centerStart && col < centerEnd) {
          continue;
        }

        if (qr.isDark(row, col)) {
          const x = offsetX + col * cellSize;
          const y = offsetY + row * cellSize;

          if (config.dotStyle === 'dots') {
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
            ctx.fill();
          } else if (config.dotStyle === 'rounded') {
            drawRoundRect(ctx, x, y, cellSize, cellSize, radius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }
    }

    // Draw center emoji
    if (config.showCenter && config.centerEmoji) {
      const emojiSize = centerZoneSize * cellSize;
      const emojiX = offsetX + centerStart * cellSize;
      const emojiY = offsetY + centerStart * cellSize;

      // White circle background
      ctx.fillStyle = config.bgColor;
      ctx.beginPath();
      ctx.arc(
        emojiX + emojiSize / 2,
        emojiY + emojiSize / 2,
        emojiSize / 2 + 4,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Border circle
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        emojiX + emojiSize / 2,
        emojiY + emojiSize / 2,
        emojiSize / 2 + 4,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Emoji
      ctx.font = `${emojiSize * 0.6}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.centerEmoji, emojiX + emojiSize / 2, emojiY + emojiSize / 2 + 2);
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
  };

  const downloadQR = (format: 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `qrcode-${store?.slug || 'store'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

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
    setConfig(prev => ({ ...prev, fgColor: preset.fg, bgColor: preset.bg, borderColor: preset.border }));
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
            className="rounded-2xl"
            style={{ width: 280, height: 280 }}
          />
          <div className="flex gap-2 flex-wrap justify-center">
            <Button size="sm" onClick={() => downloadQR('png')} className="gap-2">
              <Download className="w-4 h-4" /> {t('admin.qrcode.download', 'Download PNG')}
            </Button>
            <Button size="sm" variant="outline" onClick={copyToClipboard} className="gap-2">
              <Copy className="w-4 h-4" /> {t('admin.qrcode.copy', 'Copy')}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Center emoji */}
      <GlassCard className="p-5 space-y-3">
        <Label className="text-sm font-medium">{t('admin.qrcode.centerIcon', 'Center Icon')}</Label>
        <p className="text-xs text-muted-foreground">
          {t('admin.qrcode.centerIconDesc', 'Add an emoji in the center of your QR Code, like Instagram does.')}
        </p>
        <div className="flex gap-2 flex-wrap">
          {CENTER_EMOJIS.map((emoji) => (
            <button
              key={emoji.value || 'none'}
              onClick={() => setConfig(prev => ({
                ...prev,
                centerEmoji: emoji.value,
                showCenter: !!emoji.value,
              }))}
              className={`w-12 h-12 rounded-xl border-2 transition-all text-2xl flex items-center justify-center ${
                config.centerEmoji === emoji.value
                  ? 'border-primary bg-primary/10 scale-110'
                  : 'border-border/30 hover:border-primary/50 bg-background/50'
              }`}
            >
              {emoji.value || '✕'}
            </button>
          ))}
        </div>
        <div className="space-y-2 pt-2">
          <Label className="text-xs text-muted-foreground">{t('admin.qrcode.customEmoji', 'Custom emoji')}</Label>
          <Input
            value={config.centerEmoji}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              centerEmoji: e.target.value,
              showCenter: !!e.target.value,
            }))}
            placeholder="🎧"
            className="bg-background/50 border-border/30 w-24 text-center text-2xl"
            maxLength={2}
          />
        </div>
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
              <span className="w-4 h-4 rounded-full border border-border/30" style={{ background: preset.fg }} />
              <span className="w-4 h-4 rounded-full border border-border/30" style={{ background: preset.bg }} />
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
            <Label className="text-xs text-muted-foreground">{t('admin.qrcode.foreground', 'QR Code')}</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.fgColor} onChange={(e) => setConfig(prev => ({ ...prev, fgColor: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-border/30" />
              <Input value={config.fgColor} onChange={(e) => setConfig(prev => ({ ...prev, fgColor: e.target.value }))} className="flex-1 bg-background/50 border-border/30 text-xs font-mono" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('admin.qrcode.background', 'Background')}</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.bgColor} onChange={(e) => setConfig(prev => ({ ...prev, bgColor: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-border/30" />
              <Input value={config.bgColor} onChange={(e) => setConfig(prev => ({ ...prev, bgColor: e.target.value }))} className="flex-1 bg-background/50 border-border/30 text-xs font-mono" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('admin.qrcode.border', 'Border')}</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.borderColor} onChange={(e) => setConfig(prev => ({ ...prev, borderColor: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-border/30" />
              <Input value={config.borderColor} onChange={(e) => setConfig(prev => ({ ...prev, borderColor: e.target.value }))} className="flex-1 bg-background/50 border-border/30 text-xs font-mono" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('admin.qrcode.gradient', 'Gradient')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.showGradient}
                onChange={(e) => setConfig(prev => ({ ...prev, showGradient: e.target.checked }))}
                className="w-5 h-5 rounded cursor-pointer accent-primary"
              />
              {config.showGradient && (
                <>
                  <input type="color" value={config.gradientColor} onChange={(e) => setConfig(prev => ({ ...prev, gradientColor: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer border border-border/30" />
                  <Input value={config.gradientColor} onChange={(e) => setConfig(prev => ({ ...prev, gradientColor: e.target.value }))} className="flex-1 bg-background/50 border-border/30 text-xs font-mono" />
                </>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Style options */}
      <GlassCard className="p-5 space-y-4">
        <Label className="text-sm font-medium">{t('admin.qrcode.style', 'Style')}</Label>
        <div className="grid grid-cols-2 gap-4">
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
            <Label className="text-xs text-muted-foreground">{t('admin.qrcode.size', 'Size')}: {config.size}px</Label>
            <Slider value={[config.size]} onValueChange={(v) => setConfig(prev => ({ ...prev, size: v[0] }))} min={200} max={800} step={50} />
          </div>
        </div>
      </GlassCard>

      {/* URL (collapsible) */}
      <GlassCard className="p-5 space-y-3">
        <Label className="text-sm font-medium">URL</Label>
        <Input
          value={config.url}
          onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
          placeholder={storeUrl}
          className="bg-background/50 border-border/30"
        />
        <Button size="sm" variant="ghost" className="gap-2 text-xs text-muted-foreground" onClick={() => setConfig(prev => ({ ...prev, url: storeUrl }))}>
          <RefreshCw className="w-3 h-3" /> {t('admin.qrcode.resetUrl', 'Reset to store URL')}
        </Button>
      </GlassCard>
    </div>
  );
};

export default QRCodeGenerator;
