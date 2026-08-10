import { useSearchParams } from 'react-router-dom';

import { useTenant } from '@/contexts/TenantContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { VideoWatchModal } from '@/components/video/VideoWatchModal';
import { useStorefrontData } from '@/components/storefront/use-storefront-data';
import { CinematicLayout } from '@/components/storefront/layouts/CinematicLayout';

const Index = () => {
  const [searchParams] = useSearchParams();
  const { selectedVideoId, setSelectedVideoId, selectedVideo, ...data } = useStorefrontData();

  // Admin preview override (?preview_layout=cinematic) — visual only, never persisted
  // Only Cinematic Desktop is currently enabled; parameter is ignored otherwise.
  const previewParam = searchParams.get('preview_layout');
  if (previewParam && previewParam !== 'cinematic') {
    // strip invalid preview param from URL silently
    searchParams.delete('preview_layout');
  }

  return (
    <MobileLayout hideHeader>
      <CinematicLayout {...data} onSelectVideo={(videoId) => setSelectedVideoId(videoId)} />

      <VideoWatchModal
        open={Boolean(selectedVideoId)}
        onOpenChange={(open) => { if (!open) setSelectedVideoId(null); }}
        videos={data.allVideos}
        selectedVideo={selectedVideo}
        onSelectVideo={(videoId) => setSelectedVideoId(videoId)}
      />
    </MobileLayout>
  );
};

export default Index;
