import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Crown, ImagePlus, Loader2, Lock, Sparkles, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useProfileCustomization } from '@/hooks/use-profile-customization';
import type { ReputationSummary } from '@/lib/gamification';
import { DefaultBanner } from '@/components/layout/DefaultBanner';

// Served from /public so it also resolves on custom domains.
const DEFAULT_AVATAR = '/default-avatar.svg';


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
  const { customization, save, uploadMedia } = useProfileCustomization();
  const [uploading, setUploading] = useState<'banner' | 'avatar' | null>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  // Existing premium media remains visible while VIP status is revalidated.
  // VIP still controls whether the editing controls are available.
  // Non-VIP users always get the themed gradient banner (no custom media).
  const banner = isVIP ? (customization.banner_url || '') : '';
  const avatar = customization.avatar_url || fallbackAvatar || DEFAULT_AVATAR;
  const name = handle ? `@${handle}` : fallbackName;

  const [visibleBanner, setVisibleBanner] = useState(banner);
  const [visibleAvatar, setVisibleAvatar] = useState(avatar);
  const [bannerFailed, setBannerFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setVisibleBanner(banner);
    setBannerFailed(false);
  }, [banner]);
  useEffect(() => {
    setVisibleAvatar(avatar);
    setAvatarFailed(false);
  }, [avatar]);

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

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden border border-border/60 bg-card/60 backdrop-blur">
      {/* Banner */}
      <div className="relative h-32 sm:h-40 overflow-hidden">
        <DefaultBanner />
        {visibleBanner && !bannerFailed && (
          <img
            src={visibleBanner}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setBannerFailed(true)}
          />
        )}

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

        {/* Avatar */}
        <div className="absolute -bottom-8 left-4">
          <div className={`w-20 h-20 rounded-full overflow-hidden border-4 ${isVIP ? 'border-primary' : 'border-background'} bg-gradient-to-br from-primary to-accent flex items-center justify-center`}>
            {avatarFailed ? (
              <User className="w-8 h-8 text-primary-foreground" aria-label={name} />
            ) : (
              <img
                src={visibleAvatar}
                alt={name}
                className="w-full h-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
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
        <h2 className="font-display text-xl font-bold truncate">{name}</h2>

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
      </div>

      <input ref={bannerInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], 'banner')} />
      <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], 'avatar')} />
    </motion.div>
  );
};
