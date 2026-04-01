import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, LogIn, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTenant } from '@/contexts/TenantContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { HeroBanner } from '@/components/layout/HeroBanner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useYouTubeVideos } from '@/hooks/use-youtube-videos';
import { useVideoFavorites } from '@/hooks/use-video-favorites';
import { VideoGalleryCarousel } from '@/components/video/VideoGalleryCarousel';
import { VideoWatchModal } from '@/components/video/VideoWatchModal';
import { mockFeedPosts } from '@/lib/mock-data';
import bannerStudio from '@/assets/banner-studio.jpg';

const Index = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { config } = useWhiteLabel();
  const { basePath, isTenantScope } = useTenant();

  const displayName = profile?.handle ? `@${profile.handle}` : user?.username;

  const quickActions = config.quickActions.filter(action => action.enabled);

  const channelId = config.youtube?.channelId?.trim() || '';
  const youtubeEnabled = Boolean(config.youtube?.enabled) && Boolean(channelId);

  const { data: youtubeData, isLoading: videosLoading } = useYouTubeVideos({
    channelId,
    enabled: youtubeEnabled,
  });

  const allVideos = useMemo(() => youtubeData?.videos ?? [], [youtubeData]);
  const videos = useMemo(() => allVideos.slice(0, 8), [allVideos]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const selectedVideo = useMemo(
    () => allVideos.find((v) => v.video_id === selectedVideoId) ?? null,
    [allVideos, selectedVideoId]
  );

  const { favoriteIds, toggleFavorite, getFavoriteVideos } = useVideoFavorites();
  const favoriteVideos = useMemo(
    () => getFavoriteVideos(allVideos).slice(0, 6),
    [getFavoriteVideos, allVideos]
  );

  return (
    <MobileLayout hideHeader>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <HeroBanner
          images={[bannerStudio]}
          banners={config.banners}
          greeting={user ? `${t('home.greeting').replace('ceo', displayName || '')}` : (config.heroGreeting || t('home.subtitle'))}
          subtitle={config.heroSubtitle || t('home.subtitle')}
        />
      </motion.div>

      <div className="px-4 py-6 space-y-6">
        {!user && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-5 border border-primary/20">
            <h3 className="font-display font-semibold text-foreground mb-1">{t('storefront.joinCommunity')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('storefront.joinCommunityDesc')}</p>
            <div className="flex gap-3">
              <Link to={`${isTenantScope ? basePath : ''}/login?tab=signup`} className="flex-1">
                <Button className="w-full gap-2 h-10" size="sm">
                  <UserPlus className="w-4 h-4" />
                  {t('storefront.signUp')}
                </Button>
              </Link>
              <Link to={`${isTenantScope ? basePath : ''}/login`} className="flex-1">
                <Button variant="outline" className="w-full gap-2 h-10" size="sm">
                  <LogIn className="w-4 h-4" />
                  {t('storefront.signIn')}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        <div>
          <h3 className="font-display font-semibold mb-3 text-foreground">{t('storefront.explore')}</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <motion.div key={action.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                <Link to={isTenantScope ? `${basePath}${action.path}` : action.path}>
                  <div className="glass glass-hover rounded-xl p-4 text-center group">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                      <DynamicIcon icon={action.icon} size={20} className="text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{action.label}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {youtubeEnabled && favoriteVideos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold flex items-center gap-2 text-foreground">
                <Heart className="w-4 h-4 fill-primary text-primary" />
                {t('storefront.myFavorites')}
              </h3>
              <Link to="/gallery" className="text-primary text-sm font-medium hover:text-primary/80 transition-colors">
                {t('storefront.viewAll')}
              </Link>
            </div>
            <VideoGalleryCarousel videos={favoriteVideos} isLoading={false} onSelect={(videoId) => setSelectedVideoId(videoId)} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
          </motion.div>
        )}

        {youtubeEnabled && videos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-foreground">{t('storefront.recentVideos')}</h3>
              <Link to="/gallery" className="text-primary text-sm font-medium hover:text-primary/80 transition-colors">
                {t('storefront.viewAll')}
              </Link>
            </div>
            <VideoGalleryCarousel videos={videos} isLoading={videosLoading} onSelect={(videoId) => setSelectedVideoId(videoId)} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
          </motion.div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-foreground">{t('storefront.news')}</h3>
            <Link to="/community" className="text-primary text-sm font-medium hover:text-primary/80 transition-colors">
              {t('storefront.viewAllNews')}
            </Link>
          </div>
          <div className="space-y-3">
            {mockFeedPosts.slice(0, 2).map((post, index) => (
              <motion.div key={post.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + index * 0.1 }}>
                <GlassCard className="p-4" hover={false}>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">🌙</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1 truncate text-foreground">{post.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <VideoWatchModal
        open={Boolean(selectedVideoId)}
        onOpenChange={(open) => { if (!open) setSelectedVideoId(null); }}
        videos={allVideos}
        selectedVideo={selectedVideo}
        onSelectVideo={(videoId) => setSelectedVideoId(videoId)}
      />
    </MobileLayout>
  );
};

export default Index;
