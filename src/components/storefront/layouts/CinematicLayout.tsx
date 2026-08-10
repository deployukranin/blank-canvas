import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, LogIn, Play, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { DefaultBanner } from '@/components/layout/DefaultBanner';
import { translatePathLabel } from '@/lib/nav-i18n';
import { useTenant } from '@/contexts/TenantContext';
import type { StorefrontLayoutProps } from '../use-storefront-data';

const VideoCardItem = ({
  video,
  onSelect,
  isFavorite,
  onToggleFavorite,
}: {
  video: { video_id: string; thumbnail_url: string; video_title: string };
  onSelect: (id: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) => (
  <div className="group cursor-pointer" onClick={() => onSelect(video.video_id)}>
    <div className="relative aspect-video rounded-2xl md:rounded-3xl overflow-hidden mb-3 md:mb-4 border border-border/50 bg-muted shadow-xl">
      <img
        src={video.thumbnail_url}
        alt={video.video_title}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center scale-90 group-hover:scale-100 transition-transform shadow-[0_0_30px_-4px_hsl(var(--primary)/0.8)]">
          <Play className="w-6 h-6 text-primary-foreground fill-current" />
        </div>
      </div>
      <button
        type="button"
        aria-label="favorite"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(video.video_id);
        }}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center border border-border/50"
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
      </button>
    </div>
    <h3 className="text-sm md:text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 px-1">
      {video.video_title}
    </h3>
  </div>
);

export const CinematicLayout = ({
  config, greeting, subtitle, quickActions, youtubeEnabled, videos, favoriteVideos,
  favoriteIds, toggleFavorite, feedPosts, isAuthenticated, withBase, onSelectVideo, storeName,
}: StorefrontLayoutProps) => {
  const { t } = useTranslation();
  const { store } = useTenant();
  // Reuse the favicon/icon uploaded in /customize as the brand mark
  const brandLogo = config.logoImage || store?.avatar_url || '';

  const heroImage =
    config.banners?.find((b) => b.enabled && b.desktopUrl)?.desktopUrl ||
    config.bannerImage ||
    '';
  const [heroFailed, setHeroFailed] = useState(false);
  const showDefaultBanner = !heroImage || heroFailed;

  return (
    <div className="space-y-10 md:space-y-16">
      {/* Immersive hero */}
      <motion.section
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative h-[440px] md:h-[460px] rounded-[28px] md:rounded-[40px] overflow-hidden border border-border/50 shadow-2xl group"
      >
        {showDefaultBanner ? (
          <DefaultBanner />
        ) : (
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            loading="eager"
            onError={() => setHeroFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />

        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/25 blur-[120px] pointer-events-none" />

        <div className="absolute bottom-0 left-0 p-6 md:p-14 w-full max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 mb-4 md:mb-6 bg-primary text-primary-foreground text-[10px] md:text-[11px] font-bold rounded-full uppercase tracking-[0.2em] shadow-[0_0_24px_-4px_hsl(var(--primary)/0.8)]">
            {brandLogo && (
              <img src={brandLogo} alt={storeName} className="w-4 h-4 rounded-full object-cover" />
            )}
            {storeName}
          </span>
          <h1 className="text-3xl md:text-6xl font-display font-black text-foreground leading-[1.05] md:leading-[0.95] tracking-tight mb-3 md:mb-5">
            {greeting}
          </h1>
          <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-9 leading-relaxed line-clamp-3">{subtitle}</p>

          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link to={`${withBase('/login')}?tab=signup`}>
                <Button size="lg" className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-9 rounded-2xl font-bold gap-3 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.8)]">
                  <UserPlus className="w-5 h-5" />
                  {t('storefront.signUp')}
                </Button>
              </Link>
              <Link to={withBase('/login')}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-9 rounded-2xl font-semibold gap-3 backdrop-blur-md">
                  <LogIn className="w-5 h-5" />
                  {t('storefront.signIn')}
                </Button>
              </Link>
            </div>
          ) : (
            <Link to={withBase('/gallery')}>
              <Button size="lg" className="h-12 md:h-14 px-6 md:px-9 rounded-2xl font-bold gap-3">
                <Play className="w-5 h-5 fill-current" />
                {t('storefront.explore')}
              </Button>
            </Link>
          )}
        </div>
      </motion.section>

      {/* News — kept near the top so members see updates first */}
      {feedPosts.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-end justify-between mb-5 md:mb-8">
            <h2 className="text-xl md:text-3xl font-display font-black text-foreground tracking-tight">
              {t('storefront.news')}
            </h2>
            <Link to={withBase('/community')} className="text-[11px] md:text-sm font-bold uppercase tracking-widest shrink-0 text-muted-foreground hover:text-primary transition-colors">
              {t('storefront.viewAllNews')}
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {feedPosts.slice(0, 3).map((post) => (
              <div key={post.id} className="rounded-3xl p-5 md:p-6 border border-border/50 bg-card/50 backdrop-blur-md hover:border-primary/30 transition-colors">
                <p className="font-semibold text-foreground mb-2 line-clamp-1">{post.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Quick actions row */}

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-5">

        {quickActions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={withBase(action.path)}>
              <div className="group h-full rounded-2xl p-3.5 md:p-5 border border-border/50 bg-card/50 backdrop-blur-md hover:border-primary/40 hover:bg-card transition-all flex flex-col md:flex-row items-start md:items-center gap-2.5 md:gap-4">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                  <DynamicIcon icon={action.icon} size={20} className="text-primary" />
                </div>
                <span className="text-xs md:text-sm font-semibold text-foreground">{translatePathLabel(t, action.path, action.label)}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      {youtubeEnabled && favoriteVideos.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-5 md:mb-8">
            <h2 className="text-xl md:text-3xl font-display font-black text-foreground tracking-tight flex items-center gap-2 md:gap-3">
              <Heart className="w-5 h-5 md:w-6 md:h-6 fill-primary text-primary" />
              {t('storefront.myFavorites')}
            </h2>
            <Link to={withBase('/gallery')} className="text-[11px] md:text-sm font-bold uppercase tracking-widest shrink-0 text-muted-foreground hover:text-primary transition-colors">
              {t('storefront.viewAll')}
            </Link>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-7">
            {favoriteVideos.slice(0, 4).map((v) => (
              <VideoCardItem
                key={v.video_id}
                video={v}
                onSelect={onSelectVideo}
                isFavorite={favoriteIds.has(v.video_id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {youtubeEnabled && videos.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-5 md:mb-8">
            <h2 className="text-xl md:text-3xl font-display font-black text-foreground tracking-tight">
              {t('storefront.recentVideos')}
            </h2>
            <Link to={withBase('/gallery')} className="text-[11px] md:text-sm font-bold uppercase tracking-widest shrink-0 text-muted-foreground hover:text-primary transition-colors">
              {t('storefront.viewAll')}
            </Link>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-7">
            {videos.slice(0, 8).map((v) => (
              <VideoCardItem
                key={v.video_id}
                video={v}
                onSelect={onSelectVideo}
                isFavorite={favoriteIds.has(v.video_id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CinematicLayout;
