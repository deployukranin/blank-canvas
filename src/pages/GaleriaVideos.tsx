import { MobileLayout } from "@/components/layout/MobileLayout";
import { VideoGalleryPanel } from "@/components/video/VideoGalleryPanel";

const GaleriaVideos = () => {
  return (
    <MobileLayout title="Vídeos" showBack>
      <div className="px-4 py-6">
        <VideoGalleryPanel className="space-y-4" />
      </div>
    </MobileLayout>
  );
};

export default GaleriaVideos;
