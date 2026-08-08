import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import { useTenant } from '@/contexts/TenantContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useYouTubeVideos, type YouTubeVideoItem } from '@/hooks/use-youtube-videos';
import { useVideoFavorites } from '@/hooks/use-video-favorites';
import { useFeedPosts, type FeedPostRow } from '@/hooks/use-feed-posts';
import { isLegacyGreeting, isLegacySubtitle } from '@/lib/hero-defaults';
import type { WhiteLabelConfig } from '@/contexts/WhiteLabelContext';

export interface StorefrontData {
  config: WhiteLabelConfig;
  greeting: string;
  subtitle: string;
  quickActions: WhiteLabelConfig['quickActions'];
  youtubeEnabled: boolean;
  videos: YouTubeVideoItem[];
  allVideos: YouTubeVideoItem[];
  favoriteVideos: YouTubeVideoItem[];
  videosLoading: boolean;
  favoriteIds: string[];
  toggleFavorite: (videoId: string) => void;
  feedPosts: FeedPostRow[];
  isAuthenticated: boolean;
  withBase: (path: string) => string;
  storeName: string;
}

export interface StorefrontLayoutProps extends StorefrontData {
  onSelectVideo: (videoId: string) => void;
  /** Disables navigation/interaction (used by the admin preview) */
  previewMode?: boolean;
}

export const useStorefrontData = (): StorefrontData & {
  selectedVideoId: string | null;
  setSelectedVideoId: (id: string | null) => void;
  selectedVideo: YouTubeVideoItem | null;
} => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { config } = useWhiteLabel();
  const { basePath, isTenantScope, store } = useTenant();

  const withBase = (path: string) => {
    if (!isTenantScope) return path;
    if (path === '/') return basePath || '/';
    return `${basePath}${path}`;
  };

  const displayName = profile?.handle ? `@${profile.handle}` : user?.username;

  const quickActions = useMemo(
    () => config.quickActions.filter(action => action.enabled),
    [config.quickActions]
  );
  const { posts: feedPosts } = useFeedPosts();

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

  const greeting = isLegacyGreeting(config.heroGreeting)
    ? (user
        ? `${t('home.greeting').replace('ceo', displayName || '')}`
        : t('admin.banners.defaultGreeting', 'Welcome! 🤍'))
    : config.heroGreeting;

  const subtitle = isLegacySubtitle(config.heroSubtitle)
    ? t('admin.banners.defaultSubtitle', 'Relax with quality ASMR')
    : config.heroSubtitle;

  return {
    config,
    greeting,
    subtitle,
    quickActions,
    youtubeEnabled,
    videos,
    allVideos,
    favoriteVideos,
    videosLoading,
    favoriteIds,
    toggleFavorite,
    feedPosts,
    isAuthenticated: Boolean(user),
    withBase,
    storeName: store?.name || config.siteName,
    selectedVideoId,
    setSelectedVideoId,
    selectedVideo,
  };
};
