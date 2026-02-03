import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useYouTubeVideos } from '@/hooks/use-youtube-videos';
import { useVideoFavorites } from '@/hooks/use-video-favorites';
import { VideoGalleryCarousel } from '@/components/video/VideoGalleryCarousel';
import { VideoWatchModal } from '@/components/video/VideoWatchModal';
import { mockFeedPosts } from '@/lib/mock-data';
import heroImage from '@/assets/hero-asmr.jpg';

const Index = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { config } = useWhiteLabel();

  const displayName = profile?.handle ? `@${profile.handle}` : user?.username;

  // Get quick actions from config, filter only enabled ones
  const quickActions = config.quickActions.filter(action => action.enabled);

  // YouTube videos
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

  // Favorites
  const { favoriteIds, toggleFavorite, getFavoriteVideos } = useVideoFavorites();
  const favoriteVideos = useMemo(
    () => getFavoriteVideos(allVideos).slice(0, 6),
    [getFavoriteVideos, allVideos]
  );

  return (
    <MobileLayout hideHeader>
      <div className="px-4 py-6 space-y-6">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <Carousel opts={{ loop: true }} className="w-full">
            <CarouselContent>
              {(config.bannerImages?.length ? config.bannerImages : (config.bannerImage ? [config.bannerImage] : [heroImage]))
                .filter(Boolean)
                .map((src, idx) => (
                  <CarouselItem key={`${src}-${idx}`}>
                    <img
                      src={src}
                      alt={`Banner principal ${idx + 1}`}
                      className="w-full h-48 object-cover"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />
                  </CarouselItem>
                ))}
            </CarouselContent>

            {(config.bannerImages?.length ?? 0) > 1 && (
              <>
                <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2" />
                <CarouselNext className="right-2 top-1/2 -translate-y-1/2" />
              </>
            )}
          </Carousel>

          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
            <h2 className="font-display text-xl font-bold mb-1">
              {user ? `Olá, ${displayName}! 💜` : 'Bem-vindo! 💜'}
            </h2>
            <p className="text-sm text-muted-foreground">Relaxe com ASMR de qualidade</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-display font-semibold mb-3">Explorar</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={action.path}>
                  <div className="glass glass-hover rounded-xl p-4 text-center">
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                      <DynamicIcon icon={action.icon} size={20} className="text-white" />
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Favoritos */}
        {youtubeEnabled && favoriteVideos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                Meus Favoritos
              </h3>
              <Link to="/galeria-videos" className="text-primary text-sm font-medium">
                Ver todos
              </Link>
            </div>
            <VideoGalleryCarousel
              videos={favoriteVideos}
              isLoading={false}
              onSelect={(videoId) => setSelectedVideoId(videoId)}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
            />
          </motion.div>
        )}

        {/* Vídeos em Destaque */}
        {youtubeEnabled && videos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold">Vídeos Recentes</h3>
              <Link to="/galeria-videos" className="text-primary text-sm font-medium">
                Ver todos
              </Link>
            </div>
            <VideoGalleryCarousel
              videos={videos}
              isLoading={videosLoading}
              onSelect={(videoId) => setSelectedVideoId(videoId)}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
            />
          </motion.div>
        )}

        {/* Feed Preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold">Novidades</h3>
            <Link to="/comunidade" className="text-primary text-sm font-medium">
              Ver tudo
            </Link>
          </div>

          <div className="space-y-3">
            {mockFeedPosts.slice(0, 2).map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <GlassCard className="p-4" hover={false}>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">🌙</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1 truncate">{post.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal para assistir vídeo */}
      <VideoWatchModal
        open={Boolean(selectedVideoId)}
        onOpenChange={(open) => {
          if (!open) setSelectedVideoId(null);
        }}
        videos={allVideos}
        selectedVideo={selectedVideo}
        onSelectVideo={(videoId) => setSelectedVideoId(videoId)}
      />
    </MobileLayout>
  );
};

export default Index;
