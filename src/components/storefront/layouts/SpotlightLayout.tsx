import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Heart, ChevronRight, LogIn, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';

import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { SocialLinksBar } from '@/components/social/SocialLinksBar';
import bannerStudio from '@/assets/banner-studio.jpg';
import type { StorefrontLayoutProps } from '../use-storefront-data';

/**
 * Spotlight — "Midnight Neon Pulse".
 * Cinematic hero with neon bloom, mono eyebrow labels, glass pills,
 * featured video with layered glow play button, square video grid,
 * and a community hub list. Accent always derives from the tenant token.
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

  const glow = 'shadow-[0_0_28px_-4px_hsl(var(--primary)/0.55)]';
  const textGlow = 'drop-shadow-[0_0_10px_hsl(var(--primary)/0.7)]';

  return (
    <>
      {/* Cinematic neon hero */}
      <section className="relative min-h-[68vh] w-full overflow-hidden">
        <motion.img
          src={heroImage}
          alt={storeName}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        {/* neon bloom */}
        <motion.div
          aria-hidden
          animate={{ opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 h-64 w-[120%] rounded-full bg-primary/25 blur-[90px]"
        />

        <div className="relative pt-[38vh] px-6 pb-9 space-y-4">
          <motion.span
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className={`block font-mono text-[10px] uppercase tracking-[0.4em] text-primary ${textGlow}`}
          >
            {storeName}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="font-display font-extrabold tracking-tighter text-4xl sm:text-5xl leading-[1.05] text-foreground break-words max-w-2xl"
          >
            {greeting}
            <span className={`text-primary ${textGlow}`}>.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-sm text-muted-foreground max-w-sm leading-relaxed"
          >
            {subtitle}
          </motion.p>

          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="flex gap-3 pt-2"
            >
              <Link
                to={`${withBase('/login')}?tab=signup`}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold transition-transform active:scale-95 ${glow}`}
              >
                <UserPlus className="w-4 h-4" />{t('storefront.signUp')}
              </Link>
              <Link
                to={withBase('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-foreground/5 backdrop-blur-xl border border-foreground/10 text-foreground text-sm font-bold transition-transform active:scale-95"
              >
                <LogIn className="w-4 h-4" />{t('storefront.signIn')}
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      <div className="px-6 pb-10 space-y-10">
        {/* Quick actions — glass neon chips */}
        <div className="flex gap-3 overflow-x-auto pt-6 pb-1 -mx-1 px-1">
          {quickActions.map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
              <Link
                to={withBase(action.path)}
                className="flex-none flex items-center gap-2 whitespace-nowrap rounded-xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-xs font-bold text-foreground shadow-[inset_0_0_14px_hsl(var(--primary)/0.15)] hover:border-primary/70 hover:shadow-[0_0_18px_-2px_hsl(var(--primary)/0.5)] transition-all"
              >
                <DynamicIcon icon={action.icon} size={15} className="text-primary" />
                {action.label}
              </Link>
            </motion.div>
          ))}
        </div>

        <SocialLinksBar />

        {youtubeEnabled && featured && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground">{t('storefront.recentVideos')}</h2>
              <Link to={withBase('/gallery')} className="font-mono text-[10px] uppercase tracking-widest text-primary hover:opacity-80">
                {t('storefront.viewAll')}
              </Link>
            </div>

            <motion.button
              onClick={() => onSelectVideo(featured.video_id)}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              className="group relative w-full aspect-video overflow-hidden rounded-[2rem] border border-foreground/10 text-left shadow-2xl"
            >
              <img src={featured.thumbnail_url} alt={featured.video_title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`w-14 h-14 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center transition-transform group-hover:scale-110 ${glow}`}>
                  <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Play className="w-4 h-4 text-primary-foreground fill-current ml-0.5" />
                  </span>
                </span>
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <p className={`font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-1 ${textGlow}`}>{t('storefront.news')}</p>
                <p className="font-display font-bold text-lg text-white line-clamp-2">{featured.video_title}</p>
              </div>
            </motion.button>

            <div className="grid grid-cols-2 gap-4 pt-2">
              {rest.slice(0, 6).map((video, i) => (
                <motion.button
                  key={video.video_id}
                  onClick={() => onSelectVideo(video.video_id)}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                  className="group text-left space-y-3"
                >
                  <div className="relative aspect-square overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/5 transition-shadow group-hover:shadow-[0_0_24px_-6px_hsl(var(--primary)/0.6)]">
                    <img src={video.thumbnail_url} alt={video.video_title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(video.video_id); }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center"
                    >
                      <Heart className={`w-4 h-4 ${favoriteIds.has(video.video_id) ? 'fill-primary text-primary' : 'text-white/70'}`} />
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">{video.video_title}</p>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {youtubeEnabled && favoriteVideos.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 fill-primary text-primary" />
              {t('storefront.myFavorites')}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {favoriteVideos.map(video => (
                <button key={video.video_id} onClick={() => onSelectVideo(video.video_id)} className="w-40 shrink-0 text-left">
                  <img
                    src={video.thumbnail_url}
                    alt={video.video_title}
                    className="w-full aspect-video object-cover rounded-2xl border border-primary/25 shadow-[0_0_18px_-8px_hsl(var(--primary)/0.7)]"
                  />
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{video.video_title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {feedPosts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground">{t('storefront.news')}</h2>
              <Link to={withBase('/community')} className="font-mono text-[10px] uppercase tracking-widest text-primary hover:opacity-80">
                {t('storefront.viewAllNews')}
              </Link>
            </div>
            <div className="space-y-3">
              {feedPosts.slice(0, 3).map(post => (
                <Link
                  key={post.id}
                  to={withBase('/community')}
                  className="group flex items-center gap-4 p-5 rounded-[1.5rem] border border-foreground/10 bg-gradient-to-r from-foreground/[0.06] to-transparent hover:border-primary/40 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-foreground truncate">{post.title}</span>
                    <span className="block text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.content}</span>
                  </span>
                  <span className="w-8 h-8 shrink-0 rounded-full bg-foreground/10 flex items-center justify-center transition-transform group-hover:translate-x-1">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SpotlightLayout;
