import { useState, useEffect, useCallback, useMemo } from 'react';
import type { YouTubeVideoItem } from '@/hooks/use-youtube-videos';

const FAVORITES_KEY = 'video-favorites';

export interface VideoFavorite {
  videoId: string;
  addedAt: string;
}

function loadFavorites(): VideoFavorite[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: VideoFavorite[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function useVideoFavorites() {
  const [favorites, setFavorites] = useState<VideoFavorite[]>(() => loadFavorites());

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_KEY) {
        setFavorites(loadFavorites());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((f) => f.videoId)),
    [favorites]
  );

  const isFavorite = useCallback(
    (videoId: string) => favoriteIds.has(videoId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback((videoId: string) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.videoId === videoId);
      const next = exists
        ? prev.filter((f) => f.videoId !== videoId)
        : [...prev, { videoId, addedAt: new Date().toISOString() }];
      saveFavorites(next);
      return next;
    });
  }, []);

  const addFavorite = useCallback((videoId: string) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.videoId === videoId)) return prev;
      const next = [...prev, { videoId, addedAt: new Date().toISOString() }];
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((videoId: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.videoId !== videoId);
      saveFavorites(next);
      return next;
    });
  }, []);

  const getFavoriteVideos = useCallback(
    (allVideos: YouTubeVideoItem[]): YouTubeVideoItem[] => {
      // Return favorites in order they were added (most recent first)
      const videoMap = new Map(allVideos.map((v) => [v.video_id, v]));
      return favorites
        .slice()
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .map((f) => videoMap.get(f.videoId))
        .filter((v): v is YouTubeVideoItem => Boolean(v));
    },
    [favorites]
  );

  return {
    favorites,
    favoriteIds,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    getFavoriteVideos,
    count: favorites.length,
  };
}
