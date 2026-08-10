import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { getDriveMedia } from '@/lib/external-storage';

interface VipMediaViewerProps {
  /** Drive ref / storage path / external URL of the media */
  mediaRef: string | null;
  title?: string;
  onClose: () => void;
}

type Kind = 'video' | 'image' | 'audio' | 'other';

function detectKind(mime: string | null, url: string): Kind {
  const m = (mime || '').toLowerCase();
  if (m.startsWith('video')) return 'video';
  if (m.startsWith('image')) return 'image';
  if (m.startsWith('audio')) return 'audio';
  const lower = url.toLowerCase();
  if (/\.(mp4|webm|mov|m4v)(\?|$)/.test(lower)) return 'video';
  if (/\.(png|jpe?g|gif|webp|avif)(\?|$)/.test(lower)) return 'image';
  if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/.test(lower)) return 'audio';
  return 'other';
}

/**
 * Plays VIP media inline (embedded), never redirecting the user to
 * Google Drive — the signed URL always points to our own media proxy.
 */
export const VipMediaViewer = ({ mediaRef, title, onClose }: VipMediaViewerProps) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>('other');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Signed links expire quickly on purpose; renew silently while in use.
  const refresh = () => setAttempt((n) => (n < 3 ? n + 1 : n));

  useEffect(() => {
    let active = true;
    if (!mediaRef) {
      setUrl(null);
      return;
    }
    setLoading(true);
    setFailed(false);
    setUrl(null);
    void (async () => {
      const media = await getDriveMedia(mediaRef);
      if (!active) return;
      if (!media?.url) {
        setFailed(true);
      } else {
        setUrl(media.url);
        setKind(detectKind(media.mimeType, media.url));
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [mediaRef, attempt]);

  return (
    <Dialog open={!!mediaRef} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/95 border-white/10">
        <DialogTitle className="sr-only">{title || t('storefront.vipMedia', 'VIP media')}</DialogTitle>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
          className="absolute right-3 top-3 z-20 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-full min-h-[240px] flex items-center justify-center">
          {loading && <Loader2 className="w-8 h-8 animate-spin text-white/70" />}

          {!loading && failed && (
            <p className="text-sm text-white/70 p-8 text-center">
              {t('storefront.vipMediaError', 'Could not load this content. Please try again.')}
            </p>
          )}

          {!loading && url && kind === 'video' && (
            <video
              src={url}
              controls
              autoPlay
              playsInline
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              onError={refresh}
              className="w-full max-h-[80vh] bg-black"
            />
          )}
          {!loading && url && kind === 'image' && (
            <img
              src={url}
              alt={title || ''}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onError={refresh}
              className="w-full max-h-[80vh] object-contain select-none"
            />
          )}
          {!loading && url && kind === 'audio' && (
            <div className="w-full p-8">
              <audio src={url} controls autoPlay controlsList="nodownload" onError={refresh} className="w-full" />
            </div>
          )}
          {!loading && url && kind === 'other' && (
            <p className="text-sm text-white/70 p-8 text-center">
              {t('storefront.vipMediaError', 'Could not load this content. Please try again.')}
            </p>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
};
