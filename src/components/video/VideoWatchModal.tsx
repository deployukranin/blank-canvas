import { ImmersiveVideoView, type ImmersiveVideoViewProps } from "@/components/video/ImmersiveVideoView";

/**
 * Kept for backwards compatibility: the watch experience is now a full-screen
 * immersive view instead of a popup dialog.
 */
export const VideoWatchModal = (props: ImmersiveVideoViewProps) => <ImmersiveVideoView {...props} />;

export default VideoWatchModal;
