import { useSearchParams } from 'react-router-dom';

import { useTenant } from '@/contexts/TenantContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { VideoWatchModal } from '@/components/video/VideoWatchModal';
import { useStorefrontData } from '@/components/storefront/use-storefront-data';
import { ClassicLayout } from '@/components/storefront/layouts/ClassicLayout';
import { CinematicLayout } from '@/components/storefront/layouts/CinematicLayout';
import { LAYOUT_VARIANTS, normalizeLayout, type LayoutVariant } from '@/lib/store-layouts';

const Index = () => {
  const { store } = useTenant();
  const [searchParams] = useSearchParams();
  const { selectedVideoId, setSelectedVideoId, selectedVideo, ...data } = useStorefrontData();

  // Admin preview override (?preview_layout=cinematic) — visual only, never persisted
  const previewParam = searchParams.get('preview_layout') as LayoutVariant | null;
  const variant = previewParam && LAYOUT_VARIANTS.includes(previewParam)
    ? previewParam
    : normalizeLayout(data.config.layout?.variant, store?.plan_type);

  const LayoutComponent = variant === 'cinematic' ? CinematicLayout : ClassicLayout;

  return (
    <MobileLayout hideHeader>
      <LayoutComponent {...data} onSelectVideo={(videoId) => setSelectedVideoId(videoId)} />

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
