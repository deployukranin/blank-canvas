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
 * Spotlight — dark "midnight neon" storefront.
 * Two fully separate compositions: one built for mobile, one built for desktop.
 * They are NOT a single responsive tree on purpose.
 */

const GLOW = 'shadow-[0_0_30px_-6px_hsl(var(--primary)/0.75)]';
const TEXT_GLOW = 'drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]';
const EYEBROW = 'font-mono uppercase tracking-[0.42em] text-primary';

const useHero = (config: StorefrontLayoutProps['config'], mobile: boolean) => {
  const banners = (config.banners || []).filter(b => b.enabled);
  return (
    (mobile ? banners[0]?.mobileUrl : banners[0]?.desktopUrl) ||
    banners[0]?.desktopUrl ||
    banners[0]?.mobileUrl ||
    bannerStudio
  );
};

/* ------------------------------------------------------------------ MOBILE */

const SpotlightMobile = ({
  config, greeting, subtitle, quickActions, youtubeEnabled, videos, favoriteVideos,
  feedPosts, isAuthenticated, withBase, onSelectVideo, favoriteIds, toggleFavorite, storeName,
}: StorefrontLayoutProps) => {
  const { t } = useTranslation();
  const heroImage = useHero(config, true);
  const [featured, ...rest] = videos;

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex flex-col justify-end overflow-hidden">
        <img src={heroImage} alt={storeName} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
        <motion.div
          aria-hidden
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-primary/30 blur-[100px]"
        />

        <div className="relative px-6 pb-10 pt-32 space-y-4">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`${EYEBROW} text-[10px] ${TEXT_GLOW}`}>
            {storeName} {t('storefront.spotlight', 'Spotlight')}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-display font-bold tracking-tight text-[2.75rem] leading-[1.02] text-foreground break-words">
            {greeting}<span className={`text-primary ${TEXT_GLOW}`}>.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="text-[13px] leading-relaxed text-muted-foreground max-w-[17rem]">
            {subtitle}
          </motion.p>

          {!isAuthenticated && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
              className="flex gap-3 pt-2">
              <Link to={`${withBase('/login')}?tab=signup`}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform ${GLOW}`}>
                <UserPlus className="w-4 h-4" />{t('storefront.signUp')}
              </Link>
              <Link to={withBase('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-foreground/15 bg-foreground/[0.04] text-foreground text-sm font-semibold active:scale-95 transition-transform">
                <LogIn className="w-4 h-4" />{t('storefront.signIn')}
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      <div className="px-6 pb-12 space-y-9">
        {/* Pills */}
        <div className="flex gap-2.5 overflow-x-auto -mx-1 px-1 pt-2 pb-1">
          {quickActions.map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
              <Link to={withBase(action.path)}
                className={`flex-none flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-[11px] font-semibold transition-all ${
                  i === 0
                    ? `border border-primary/70 bg-primary/15 text-foreground ${GLOW}`
                    : 'border border-foreground/12 bg-foreground/[0.04] text-muted-foreground hover:border-primary/40'
                }`}>
                <DynamicIcon icon={action.icon} size={13} className={i === 0 ? 'text-primary' : ''} />
                {action.label}
              </Link>
            </motion.div>
          ))}
        </div>

        <SocialLinksBar />

        {youtubeEnabled && featured && (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-base font-semibold text-foreground">{t('storefront.featuredContent', 'Featured Content')}</h2>
              <Link to={withBase('/gallery')} className={`${EYEBROW} text-[9px] hover:opacity-80`}>{t('storefront.viewAll')}</Link>
            </div>

            <motion.button onClick={() => onSelectVideo(featured.video_id)}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              className="group relative w-full aspect-[4/3] overflow-hidden rounded-2xl border border-foreground/10 text-left">
              <img src={featured.thumbnail_url} alt={featured.video_title} className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
              <span className={`absolute inset-0 m-auto h-12 w-12 rounded-full bg-primary flex items-center justify-center ${GLOW}`}>
                <Play className="w-4 h-4 text-primary-foreground fill-current ml-0.5" />
              </span>
              <div className="absolute bottom-4 left-4 right-4">
                <p className={`${EYEBROW} text-[9px] mb-1`}>{t('storefront.newRelease', 'New Release')}</p>
                <p className="font-display font-semibold text-[15px] text-white line-clamp-2">{featured.video_title}</p>
              </div>
            </motion.button>

            <div className="grid grid-cols-2 gap-3">
              {rest.slice(0, 6).map((video, i) => (
                <motion.button key={video.video_id} onClick={() => onSelectVideo(video.video_id)}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}
                  className="group text-left space-y-2">
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-foreground/10 bg-foreground/5">
                    <img src={video.thumbnail_url} alt={video.video_title} className="w-full h-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105" />
                    <span onClick={(e) => { e.stopPropagation(); toggleFavorite(video.video_id); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 border border-white/10 flex items-center justify-center">
                      <Heart className={`w-3.5 h-3.5 ${favoriteIds.has(video.video_id) ? 'fill-primary text-primary' : 'text-white/70'}`} />
                    </span>
                  </div>
                  <p className="text-[12px] font-medium text-foreground line-clamp-2">{video.video_title}</p>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {youtubeEnabled && favoriteVideos.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 fill-primary text-primary" />{t('storefront.myFavorites')}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {favoriteVideos.map(video => (
                <button key={video.video_id} onClick={() => onSelectVideo(video.video_id)} className="w-36 shrink-0 text-left">
                  <img src={video.thumbnail_url} alt={video.video_title} className="w-full aspect-video object-cover rounded-xl border border-primary/25" />
                  <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-2">{video.video_title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {feedPosts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-base font-semibold text-foreground">{t('storefront.news')}</h2>
              <Link to={withBase('/community')} className={`${EYEBROW} text-[9px] hover:opacity-80`}>{t('storefront.viewAllNews')}</Link>
            </div>
            {feedPosts.slice(0, 3).map(post => (
              <Link key={post.id} to={withBase('/community')}
                className="group flex items-center gap-3 p-4 rounded-xl border border-foreground/10 bg-foreground/[0.03] hover:border-primary/40 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold text-foreground truncate">{post.title}</span>
                  <span className="block text-[11px] text-muted-foreground line-clamp-1">{post.content}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------- DESKTOP */

const SpotlightDesktop = ({
  config, greeting, subtitle, quickActions, youtubeEnabled, videos, favoriteVideos,
  feedPosts, isAuthenticated, withBase, onSelectVideo, favoriteIds, toggleFavorite, storeName,
}: StorefrontLayoutProps) => {
  const { t } = useTranslation();
  const heroImage = useHero(config, false);
  const [featured, ...rest] = videos;

  return (
    <div className="bg-background">
      {/* Split hero */}
      <section className="relative overflow-hidden border-b border-foreground/10">
        <motion.div aria-hidden animate={{ opacity: [0.2, 0.45, 0.2] }} transition={{ duration: 7, repeat: Infinity }}
          className="pointer-events-none absolute -top-40 left-1/3 h-[32rem] w-[32rem] rounded-full bg-primary/25 blur-[140px]" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-12 items-center gap-12 px-12 py-24">
          <div className="col-span-6 space-y-6">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${EYEBROW} text-xs ${TEXT_GLOW}`}>
              {storeName} {t('storefront.spotlight', 'Spotlight')}
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="font-display font-bold tracking-tight text-7xl leading-[0.98] text-foreground">
              {greeting}<span className={`text-primary ${TEXT_GLOW}`}>.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="max-w-md text-base leading-relaxed text-muted-foreground">
              {subtitle}
            </motion.p>

            {!isAuthenticated && (
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="flex gap-4 pt-2">
                <Link to={`${withBase('/login')}?tab=signup`}
                  className={`inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 ${GLOW}`}>
                  <UserPlus className="w-4 h-4" />{t('storefront.signUp')}
                </Link>
                <Link to={withBase('/login')}
                  className="inline-flex items-center gap-2 rounded-xl border border-foreground/15 bg-foreground/[0.04] px-8 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50">
                  <LogIn className="w-4 h-4" />{t('storefront.signIn')}
                </Link>
              </motion.div>
            )}

            <div className="flex flex-wrap gap-2.5 pt-6">
              {quickActions.map((action, i) => (
                <Link key={action.label} to={withBase(action.path)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                    i === 0
                      ? `border border-primary/70 bg-primary/15 text-foreground ${GLOW}`
                      : 'border border-foreground/12 bg-foreground/[0.04] text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}>
                  <DynamicIcon icon={action.icon} size={14} className={i === 0 ? 'text-primary' : ''} />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
            className="col-span-6 relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-foreground/10">
            <img src={heroImage} alt={storeName} className="h-full w-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-tr from-background via-transparent to-primary/20" />
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-12 py-16 space-y-16">
        <SocialLinksBar />

        {youtubeEnabled && featured && (
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b border-foreground/10 pb-3">
              <h2 className="font-display text-2xl font-semibold text-foreground">{t('storefront.featuredContent', 'Featured Content')}</h2>
              <Link to={withBase('/gallery')} className={`${EYEBROW} text-[10px] hover:opacity-80`}>{t('storefront.viewAll')}</Link>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <motion.button onClick={() => onSelectVideo(featured.video_id)}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="group relative col-span-7 aspect-video overflow-hidden rounded-2xl border border-foreground/10 text-left">
                <img src={featured.thumbnail_url} alt={featured.video_title} className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
                <span className={`absolute inset-0 m-auto h-16 w-16 rounded-full bg-primary flex items-center justify-center transition-transform group-hover:scale-110 ${GLOW}`}>
                  <Play className="w-6 h-6 text-primary-foreground fill-current ml-0.5" />
                </span>
                <div className="absolute bottom-6 left-6 right-6">
                  <p className={`${EYEBROW} text-[10px] mb-1.5`}>{t('storefront.newRelease', 'New Release')}</p>
                  <p className="font-display text-xl font-semibold text-white line-clamp-2">{featured.video_title}</p>
                </div>
              </motion.button>

              <div className="col-span-5 grid grid-cols-2 gap-4 content-start">
                {rest.slice(0, 4).map((video, i) => (
                  <motion.button key={video.video_id} onClick={() => onSelectVideo(video.video_id)}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                    className="group text-left space-y-2">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-foreground/10 transition-shadow group-hover:shadow-[0_0_26px_-8px_hsl(var(--primary)/0.8)]">
                      <img src={video.thumbnail_url} alt={video.video_title} className="h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105" />
                      <span onClick={(e) => { e.stopPropagation(); toggleFavorite(video.video_id); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 border border-white/10 flex items-center justify-center">
                        <Heart className={`w-3.5 h-3.5 ${favoriteIds.has(video.video_id) ? 'fill-primary text-primary' : 'text-white/70'}`} />
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground line-clamp-2">{video.video_title}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </section>
        )}

        {youtubeEnabled && favoriteVideos.length > 0 && (
          <section className="space-y-5">
            <h2 className="font-display text-2xl font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 fill-primary text-primary" />{t('storefront.myFavorites')}
            </h2>
            <div className="grid grid-cols-5 gap-4">
              {favoriteVideos.slice(0, 5).map(video => (
                <button key={video.video_id} onClick={() => onSelectVideo(video.video_id)} className="text-left">
                  <img src={video.thumbnail_url} alt={video.video_title} className="w-full aspect-video object-cover rounded-xl border border-primary/25" />
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{video.video_title}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {feedPosts.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-end justify-between border-b border-foreground/10 pb-3">
              <h2 className="font-display text-2xl font-semibold text-foreground">{t('storefront.news')}</h2>
              <Link to={withBase('/community')} className={`${EYEBROW} text-[10px] hover:opacity-80`}>{t('storefront.viewAllNews')}</Link>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {feedPosts.slice(0, 3).map(post => (
                <Link key={post.id} to={withBase('/community')}
                  className="group rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 transition-colors hover:border-primary/40">
                  <span className="mb-4 block h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                  <p className="font-display text-base font-semibold text-foreground line-clamp-2">{post.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.content}</p>
                  <span className={`${EYEBROW} mt-4 inline-flex items-center gap-1 text-[10px]`}>
                    {t('storefront.viewAllNews')}<ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export const SpotlightLayout = (props: StorefrontLayoutProps) => {
  const isMobile = useIsMobile();
  return isMobile ? <SpotlightMobile {...props} /> : <SpotlightDesktop {...props} />;
};

export default SpotlightLayout;
