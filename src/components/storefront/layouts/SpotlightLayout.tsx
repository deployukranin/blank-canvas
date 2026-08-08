import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Heart, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';

import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { Button } from '@/components/ui/button';
import { SocialLinksBar } from '@/components/social/SocialLinksBar';
import bannerStudio from '@/assets/banner-studio.jpg';
import type { StorefrontLayoutProps } from '../use-storefront-data';

/**
 * Spotlight — full-bleed cinematic hero, horizontal quick actions,
 * one featured video plus a 2-column grid.
 */
export const SpotlightLayout = ({
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

  const [featured, ...rest] = videos;

  return (
    <>
      {/* Cinematic hero */}
      <section className="relative h-[62vh] min-h-[380px] w-full overflow-hidden">
        <motion.img
          src={heroImage}
          alt={storeName}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 pb-10">
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xs uppercase tracking-[0.25em] text-primary mb-3"
          >
            {storeName}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="font-display font-bold text-4xl sm:text-5xl leading-[1.05] text-foreground max-w-2xl break-words"
          >
            {greeting}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="mt-3 text-sm sm:text-base text-muted-foreground max-w-lg"
          >
            {subtitle}
          </motion.p>

          {!isAuthenticated && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 flex gap-3">
              <Link to={`${withBase('/login')}?tab=signup`}>
                <Button className="gap-2 h-11 px-6 rounded-full"><UserPlus className="w-4 h-4" />{t('storefront.signUp')}</Button>
              </Link>
              <Link to={withBase('/login')}>
                <Button variant="outline" className="gap-2 h-11 px-6 rounded-full"><LogIn className="w-4 h-4" />{t('storefront.signIn')}</Button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      <div className="px-4 pt-5 pb-8 space-y-8">
        {/* Horizontal quick actions */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">
          {quickActions.map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
              <Link
                to={withBase(action.path)}
                className="flex items-center gap-2 whitespace-nowrap rounded-full border border-primary/25 bg-primary/10 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-primary/20 transition-colors"
              >
                <DynamicIcon icon={action.icon} size={16} className="text-primary" />
                {action.label}
              </Link>
            </motion.div>
          ))}
        </div>

        <SocialLinksBar />

        {youtubeEnabled && featured && (
          <div className="space-y-4">
            <motion.button
              onClick={() => onSelectVideo(featured.video_id)}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              className="group relative w-full overflow-hidden rounded-3xl border border-border/50 text-left"
            >
              <img src={featured.thumbnail_url} alt={featured.video_title} className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                  <Play className="w-7 h-7 text-primary-foreground fill-current ml-0.5" />
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="text-[10px] uppercase tracking-widest text-primary">{t('storefront.recentVideos')}</span>
                <p className="mt-1 font-display font-semibold text-lg text-white line-clamp-2">{featured.video_title}</p>
              </div>
            </motion.button>

            <div className="grid grid-cols-2 gap-3">
              {rest.slice(0, 6).map((video, i) => (
                <motion.button
                  key={video.video_id}
                  onClick={() => onSelectVideo(video.video_id)}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                  className="group text-left"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-border/40">
                    <img src={video.thumbnail_url} alt={video.video_title} className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(video.video_id); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
                    >
                      <Heart className={`w-3.5 h-3.5 ${favoriteIds.has(video.video_id) ? 'fill-primary text-primary' : 'text-white'}`} />
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-foreground line-clamp-2">{video.video_title}</p>
                </motion.button>
              ))}
            </div>

            <Link to={withBase('/gallery')} className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              {t('storefront.viewAll')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {youtubeEnabled && favoriteVideos.length > 0 && (
          <div>
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2 text-foreground">
              <Heart className="w-4 h-4 fill-primary text-primary" />
              {t('storefront.myFavorites')}
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {favoriteVideos.map(video => (
                <button key={video.video_id} onClick={() => onSelectVideo(video.video_id)} className="w-40 shrink-0 text-left">
                  <img src={video.thumbnail_url} alt={video.video_title} className="w-full aspect-video object-cover rounded-xl border border-border/40" />
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{video.video_title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {feedPosts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-foreground">{t('storefront.news')}</h3>
              <Link to={withBase('/community')} className="text-primary text-sm font-medium">{t('storefront.viewAllNews')}</Link>
            </div>
            <div className="space-y-3">
              {feedPosts.slice(0, 3).map(post => (
                <div key={post.id} className="rounded-2xl border-l-2 border-primary bg-foreground/[0.03] px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{post.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SpotlightLayout;
