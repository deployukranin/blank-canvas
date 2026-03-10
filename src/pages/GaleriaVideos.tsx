import { MobileLayout } from "@/components/layout/MobileLayout";
import { VideoGalleryPanel } from "@/components/video/VideoGalleryPanel";
import { AdPlaceholder } from "@/components/ads/AdBanner";

const GaleriaVideos = () => {
  return (
    <MobileLayout title="Vídeos" showBack>
      <div className="px-4 py-6 space-y-4">
        <VideoGalleryPanel className="space-y-4" />
        <AdPlaceholder format="horizontal" />
      </div>
    </MobileLayout>
  );
};

export default GaleriaVideos;
