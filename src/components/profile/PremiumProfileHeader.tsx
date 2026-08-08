import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Crown, ImagePlus, Loader2, Lock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useProfileCustomization, MAX_PROFILE_MEDIA_BYTES } from '@/hooks/use-profile-customization';
import type { ReputationSummary } from '@/lib/gamification';

interface PremiumProfileHeaderProps {
  isVIP: boolean;
  vipPath: string;
  fallbackName: string;
  handle?: string | null;
  fallbackAvatar?: string | null;
  reputation?: ReputationSummary | null;
}

export const PremiumProfileHeader = ({
  isVIP,
  vipPath,
  fallbackName,
  handle,
  fallbackAvatar,
  reputation,
}: PremiumProfileHeaderProps) => {
  const { t } = useTranslation();
  const { customization, save, uploadMedia, isSaving } = useProfileCustomization();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState<'banner' | 'avatar' | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [statusText, setStatusText] = useState('');
  const bannerInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const banner = isVIP ? customization.banner_url : null;
  const avatar = (isVIP ? customization.avatar_url : null) || fallbackAvatar || null;
  const name = (isVIP ? customization.display_name : null) || fallbackName;

  const openEditor = () => {
    setDisplayName(customization.display_name || '');
    setPronouns(customization.pronouns || '');
    setStatusText(customization.status_text || '');
    setEditing(true);
  };

  const handleUpload = async (file: File | undefined, kind: 'banner' | 'avatar') => {
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadMedia(file, kind);
      await save(kind === 'banner' ? { banner_url: url } : { avatar_url: url });
      toast.success(t('profile.premium.saved', 'Profile updated!'));
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'too_large') {
        toast.error(t('profile.premium.tooLarge', 'File is too large (max 5MB).'));
      } else if (code === 'invalid_type') {
        toast.error(t('profile.premium.invalidType', 'Use JPG, PNG, WEBP or GIF.'));
      } else if (code.includes('vip_required')) {
        toast.error(t('profile.premium.vipRequired', 'Active VIP required to customize your profile.'));
      } else {
        toast.error(t('profile.premium.uploadError', 'Could not upload the file.'));
      }
    } finally {
      setUploading(null);
    }
  };

  const handleSaveText = async () => {
    try {
      await save({
        display_name: displayName.trim() || null,
        pronouns: pronouns.trim() || null,
        status_text: statusText.trim() || null,
      });
      toast.success(t('profile.premium.saved', 'Profile updated!'));
      setEditing(false);
    } catch {
      toast.error(t('profile.premium.saveError', 'Could not save your profile.'));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden border border-border/60 bg-card/60 backdrop-blur">
      {/* Banner */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-br from-primary/40 via-accent/30 to-primary/10">
        {banner && <img src={banner} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        {!isVIP && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Link to={vipPath}>
              <Button size="sm" className="gap-2">
                <Crown className="w-4 h-4" />
                {t('profile.premium.unlock', 'Unlock with VIP')}
              </Button>
            </Link>
          </div>
        )}
        {isVIP && (
          <button
            onClick={() => bannerInput.current?.click()}
            className="absolute top-3 right-3 h-8 px-3 rounded-full bg-background/80 text-xs font-medium flex items-center gap-1.5 border border-border/60"
          >
            {uploading === 'banner' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            {t('profile.premium.changeBanner', 'Banner')}
          </button>
        )}

        {/* Status bubble */}
        {isVIP && customization.status_text && (
          <div className="absolute left-28 right-4 top-1/2 -translate-y-1/2 hidden sm:block">
            <div className="inline-block max-w-full rounded-2xl bg-background/90 px-4 py-2 text-sm shadow-lg border border-border/50">
              {customization.status_text}
            </div>
          </div>
        )}

        {/* Avatar */}
        <div className="absolute -bottom-8 left-4">
          <div className={`w-20 h-20 rounded-full overflow-hidden border-4 ${isVIP ? 'border-primary' : 'border-background'} bg-gradient-to-br from-primary to-accent flex items-center justify-center`}>
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary-foreground">{name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          {isVIP && (
            <button
              onClick={() => avatarInput.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background"
            >
              {uploading === 'avatar' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-foreground" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-primary-foreground" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Identity */}
      <div className="pt-10 px-4 pb-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold truncate">{name}</h2>
            <p className="text-xs text-muted-foreground truncate">
              {handle ? `@${handle}` : ''}
              {isVIP && customization.pronouns ? ` • ${customization.pronouns}` : ''}
            </p>
          </div>
          {isVIP && (
            <Button variant="outline" size="sm" onClick={openEditor} className="shrink-0">
              {t('profile.premium.edit', 'Edit')}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isVIP ? (
            <Badge className="gap-1"><Crown className="w-3 h-3" /> {t('profile.premium.vipBadge', 'Premium')}</Badge>
          ) : (
            <Badge variant="outline" className="gap-1"><Lock className="w-3 h-3" /> {t('profile.premium.free', 'Free')}</Badge>
          )}
          {reputation && (
            <Badge variant="secondary" className="gap-1">
              <span>{reputation.icon}</span> {reputation.title} · {t('profile.premium.level', 'Lv.')}{reputation.level}
            </Badge>
          )}
        </div>

        {!isVIP && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {t('profile.premium.teaser', 'VIP members can set a custom banner and avatar (image or GIF).')}
          </p>
        )}

        {editing && (
          <div className="space-y-3 pt-3 border-t border-border/50">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} placeholder={t('profile.premium.displayName', 'Display name')} />
            <Input value={pronouns} onChange={(e) => setPronouns(e.target.value)} maxLength={24} placeholder={t('profile.premium.pronouns', 'Pronouns (they/them)')} />
            <Input value={statusText} onChange={(e) => setStatusText(e.target.value)} maxLength={80} placeholder={t('profile.premium.status', 'Status message')} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveText} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save', 'Save')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t('profile.premium.limits', 'JPG, PNG, WEBP or GIF up to {{mb}}MB.', { mb: Math.round(MAX_PROFILE_MEDIA_BYTES / (1024 * 1024)) })}
            </p>
          </div>
        )}
      </div>

      <input ref={bannerInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], 'banner')} />
      <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], 'avatar')} />
    </motion.div>
  );
};
