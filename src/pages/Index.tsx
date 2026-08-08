import { useTenant } from '@/contexts/TenantContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { VideoWatchModal } from '@/components/video/VideoWatchModal';
import { useStorefrontData } from '@/components/storefront/use-storefront-data';
import { ClassicLayout } from '@/components/storefront/layouts/ClassicLayout';
import { SpotlightLayout } from '@/components/storefront/layouts/SpotlightLayout';
import { MagazineLayout } from '@/components/storefront/layouts/MagazineLayout';
import { normalizeLayout } from '@/lib/store-layouts';

const Index = () => {
  const { store } = useTenant();
  const { selectedVideoId, setSelectedVideoId, selectedVideo, ...data } = useStorefrontData();

  const variant = normalizeLayout(data.config.layout?.variant, store?.plan_type);
  const LayoutComponent =
    variant === 'spotlight' ? SpotlightLayout : variant === 'magazine' ? MagazineLayout : ClassicLayout;

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
