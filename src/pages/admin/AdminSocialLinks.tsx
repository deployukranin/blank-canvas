import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, GripVertical } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useTenant } from '@/contexts/TenantContext';
import { loadConfig, saveConfig } from '@/lib/config-storage';

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface SocialLinksConfig {
  links: SocialLink[];
}

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube', icon: '🎬' },
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'facebook', label: 'Facebook', icon: '👤' },
  { value: 'telegram', label: 'Telegram', icon: '✈️' },
  { value: 'spotify', label: 'Spotify', icon: '🎧' },
  { value: 'twitter', label: 'X (Twitter)', icon: '𝕏' },
  { value: 'twitch', label: 'Twitch', icon: '🎮' },
  { value: 'discord', label: 'Discord', icon: '💬' },
  { value: 'website', label: 'Website', icon: '🌐' },
];

const generateId = () => Math.random().toString(36).substring(2, 10);

const AdminSocialLinks: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { store } = useTenant();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await loadConfig<SocialLinksConfig>('social_links', store?.id);
      if (data?.links) setLinks(data.links);
      setLoading(false);
    };
    load();
  }, [store?.id]);

  const addLink = () => {
    setLinks(prev => [...prev, { id: generateId(), platform: 'youtube', url: '' }]);
  };

  const removeLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const updateLink = (id: string, field: keyof SocialLink, value: string) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleSave = async () => {
    setSaving(true);
    const validLinks = links.filter(l => l.url.trim());
    const saved = await saveConfig<SocialLinksConfig>('social_links', { links: validLinks }, store?.id);
    setSaving(false);
    if (saved) {
      toast({ title: t('admin.socialLinks.saved', 'Social links saved!') });
    } else {
      toast({ title: t('admin.socialLinks.saveError', 'Error saving'), variant: 'destructive' });
    }
  };

  const getPlatformInfo = (value: string) => PLATFORMS.find(p => p.value === value) || PLATFORMS[0];

  if (loading) {
    return (
      <AdminLayout title={t('admin.socialLinks.title', 'Social Links')}>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('admin.socialLinks.title', 'Social Links')}>
      <div className="max-w-2xl mx-auto space-y-6">
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">
            {t('admin.socialLinks.description', 'Add your social media links so your fans can find you easily. These will be displayed on your storefront.')}
          </p>
        </GlassCard>

        {links.map((link, index) => {
          const platform = getPlatformInfo(link.platform);
          return (
            <motion.div key={link.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <GlassCard className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platform.icon}</span>
                      <Select value={link.platform} onValueChange={(v) => updateLink(link.id, 'platform', v)}>
                        <SelectTrigger className="w-48 bg-background/50 border-border/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLATFORMS.map(p => (
                            <SelectItem key={p.value} value={p.value}>
                              <span className="flex items-center gap-2">
                                <span>{p.icon}</span> {p.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">URL</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                        placeholder={`https://${link.platform}.com/...`}
                        className="bg-background/50 border-border/30"
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 mt-1" onClick={() => removeLink(link.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}

        <Button variant="outline" className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5" onClick={addLink}>
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.socialLinks.add', 'Add Social Link')}
        </Button>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSocialLinks;
