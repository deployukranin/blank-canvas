import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, LogIn, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';

import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { Button } from '@/components/ui/button';
import { SocialLinksBar } from '@/components/social/SocialLinksBar';
import bannerStudio from '@/assets/banner-studio.jpg';
import type { StorefrontLayoutProps } from '../use-storefront-data';

/**
 * Magazine — compact editorial layout: small masthead, side-by-side
 * hero card, list-style video rows and an editorial news column.
 */
export const MagazineLayout = ({
  config, greeting, subtitle, quickActions, youtubeEnabled, videos, favoriteVideos,
  feedPosts, isAuthenticated, withBase, onSelectVideo, favoriteIds, toggleFavorite, storeName,
}: StorefrontLayoutProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const enabledBanners = (config.banners || []).filter(b => b.enabled);
  const heroImage =
    (isMobile ? enabledBanners[0]?.mobileUrl : enabledBanners[0]?.desktopUrl) ||
    enabledBanners[0]?.desktopUrl ||
    enabledBanners[0]?.mobileUrl ||
    bannerStudio;

  return (
    <div className="px-4 pt-6 pb-8 space-y-8">
      {/* Masthead */}
      <header className="border-b border-border/60 pb-4">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{storeName}</p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="mt-2 font-display font-bold text-2xl sm:text-3xl leading-tight text-foreground break-words"
        >
          {greeting}
        </motion.h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      </header>

      {/* Editorial hero card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-[1.1fr_1fr] gap-4 items-stretch"
      >
        <div className="overflow-hidden rounded-2xl border border-border/50">
          <img src={heroImage} alt={storeName} className="w-full h-full min-h-[180px] object-cover" />
        </div>
        <div className="flex flex-col justify-center gap-3">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, i) => (
              <motion.div key={action.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}>
                <Link
                  to={withBase(action.path)}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-foreground/[0.02] px-3 py-2.5 text-xs font-medium text-foreground hover:border-primary/50 transition-colors"
                >
                  <DynamicIcon icon={action.icon} size={15} className="text-primary shrink-0" />
                  <span className="truncate">{action.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
          {!isAuthenticated && (
            <div className="flex gap-2">
              <Link to={`${withBase('/login')}?tab=signup`} className="flex-1">
                <Button size="sm" className="w-full gap-2"><UserPlus className="w-3.5 h-3.5" />{t('storefront.signUp')}</Button>
              </Link>
              <Link to={withBase('/login')} className="flex-1">
                <Button size="sm" variant="outline" className="w-full gap-2"><LogIn className="w-3.5 h-3.5" />{t('storefront.signIn')}</Button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      <SocialLinksBar />

      {/* Video list rows */}
      {youtubeEnabled && videos.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-3 border-b border-border/60 pb-2">
            <h2 className="font-display font-semibold text-sm uppercase tracking-widest text-foreground">
              {t('storefront.recentVideos')}
            </h2>
            <Link to={withBase('/gallery')} className="text-xs font-medium text-primary">{t('storefront.viewAll')}</Link>
          </div>
          <div className="divide-y divide-border/50">
            {videos.slice(0, 6).map((video, i) => (
              <motion.button
                key={video.video_id}
                onClick={() => onSelectVideo(video.video_id)}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}
                className="group flex w-full items-center gap-3 py-3 text-left"
              >
                <span className="w-6 shrink-0 font-display text-sm text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                <img src={video.thumbnail_url} alt={video.video_title} className="w-24 aspect-video shrink-0 rounded-md object-cover" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {video.video_title}
                  </span>
                </span>
                <span
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(video.video_id); }}
                  className="shrink-0 p-1.5"
                >
                  <Heart className={`w-4 h-4 ${favoriteIds.has(video.video_id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                </span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {youtubeEnabled && favoriteVideos.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-sm uppercase tracking-widest text-foreground border-b border-border/60 pb-2 mb-3">
            {t('storefront.myFavorites')}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {favoriteVideos.slice(0, 6).map(video => (
              <button key={video.video_id} onClick={() => onSelectVideo(video.video_id)} className="text-left">
                <img src={video.thumbnail_url} alt={video.video_title} className="w-full aspect-video rounded-md object-cover" />
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{video.video_title}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {feedPosts.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-3 border-b border-border/60 pb-2">
            <h2 className="font-display font-semibold text-sm uppercase tracking-widest text-foreground">{t('storefront.news')}</h2>
            <Link to={withBase('/community')} className="text-xs font-medium text-primary">{t('storefront.viewAllNews')}</Link>
          </div>
          <div className="columns-1 sm:columns-2 gap-4 space-y-4">
            {feedPosts.slice(0, 4).map(post => (
              <article key={post.id} className="break-inside-avoid rounded-xl border border-border/50 p-4">
                <h3 className="font-display font-semibold text-sm text-foreground">{post.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-4">{post.content}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MagazineLayout;
