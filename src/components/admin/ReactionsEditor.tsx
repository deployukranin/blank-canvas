import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Upload, Trash2, Smile } from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useTenant } from '@/contexts/TenantContext';
import { uploadConfigAsset, deleteDriveAsset } from '@/lib/external-storage';
import {
  DEFAULT_REACTION_LABEL_KEYS,
  normalizeReactions,
  type ReactionConfigItem,
} from '@/lib/video-reactions-config';

/** Admin editor: label, icon (PNG), color and visibility for the 4 reaction slots. */
export const ReactionsEditor: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { config, setConfig } = useWhiteLabel();
  const { store } = useTenant();

  const [items, setItems] = useState<ReactionConfigItem[]>(normalizeReactions(config.reactions));
  const [uploading, setUploading] = useState<string | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    setItems(normalizeReactions(config.reactions));
  }, [config.reactions]);

  const persist = (next: ReactionConfigItem[]) => {
    setItems(next);
    setConfig({ ...configRef.current, reactions: next });
  };

  const update = (type: string, patch: Partial<ReactionConfigItem>, persistNow = false) => {
    const next = items.map((item) => (item.type === type ? { ...item, ...patch } : item));
    if (persistNow) persist(next);
    else setItems(next);
  };

  const pickIcon = (item: ReactionConfigItem) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/webp,image/gif';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: t('admin.reactions.fileTooLarge', 'File too large'),
          description: t('admin.reactions.maxSize', 'Maximum 2MB per icon.'),
          variant: 'destructive',
        });
        return;
      }
      if (!store?.id) return;
      setUploading(item.type);
      try {
        await deleteDriveAsset(item.iconUrl);
        const { url } = await uploadConfigAsset(file, store.id);
        update(item.type, { iconUrl: url }, true);
        toast({ title: t('admin.reactions.saved', 'Reactions updated!') });
      } catch (err: any) {
        toast({
          title: t('admin.reactions.uploadError', 'Upload failed'),
          description: err?.message,
          variant: 'destructive',
        });
      } finally {
        setUploading(null);
      }
    };
    input.click();
  };

  const removeIcon = async (item: ReactionConfigItem) => {
    const previous = item.iconUrl;
    update(item.type, { iconUrl: '' }, true);
    await deleteDriveAsset(previous);
  };

  return (
    <GlassCard className="p-6 space-y-5">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {t('admin.reactions.title', 'Video reactions')}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('admin.reactions.desc', 'Customize the label, icon and color of each reaction shown under your videos.')}
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const fallback = DEFAULT_REACTION_LABEL_KEYS[item.type];
          const isUploading = uploading === item.type;

          return (
            <div
              key={item.type}
              className="rounded-2xl border border-border/60 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0 overflow-hidden">
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt={item.label || item.type} className="w-9 h-9 object-contain" />
                ) : (
                  <span className="text-2xl">{item.emoji}</span>
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">{t('admin.reactions.label', 'Label')}</Label>
                  <Input
                    value={item.label}
                    placeholder={t(fallback.key, fallback.fallback)}
                    onChange={(e) => update(item.type, { label: e.target.value })}
                    onBlur={() => persist(items)}
                    maxLength={24}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('admin.reactions.emoji', 'Emoji')}</Label>
                  <Input
                    value={item.emoji}
                    onChange={(e) => update(item.type, { emoji: e.target.value.slice(0, 4) })}
                    onBlur={() => persist(items)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  aria-label={t('admin.reactions.color', 'Highlight color')}
                  value={item.color || '#8b5cf6'}
                  onChange={(e) => update(item.type, { color: e.target.value }, true)}
                  className="w-9 h-9 rounded-lg bg-transparent border border-border/60 cursor-pointer"
                />
                <Button size="sm" variant="outline" onClick={() => pickIcon(item)} disabled={isUploading}>
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
                {item.iconUrl && (
                  <Button size="sm" variant="ghost" onClick={() => removeIcon(item)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Switch
                  checked={item.enabled}
                  onCheckedChange={(checked) => update(item.type, { enabled: checked }, true)}
                  aria-label={t('admin.reactions.enabled', 'Enabled')}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <Smile className="w-3.5 h-3.5" />
        {t('admin.reactions.hint', 'PNG with transparent background works best (max 2MB).')}
      </p>
    </GlassCard>
  );
};

export default ReactionsEditor;
