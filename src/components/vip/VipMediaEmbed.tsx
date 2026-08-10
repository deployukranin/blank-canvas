import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { getDriveMedia } from '@/lib/external-storage';

interface VipMediaEmbedProps {
  /** Drive ref / storage path / external URL of the media */
  mediaRef: string;
  title?: string;
  className?: string;
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
 * Renders VIP media inline (like a feed post) — no click needed,
 * always served through our own signed media proxy.
 */
export const VipMediaEmbed = ({ mediaRef, title, className = '' }: VipMediaEmbedProps) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>('other');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Signed links are short-lived; re-sign transparently when one expires.
  const refresh = () => setAttempt((n) => (n < 3 ? n + 1 : n));

  useEffect(() => {
    let active = true;
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
    <div className={`w-full overflow-hidden rounded-xl bg-black/40 ${className}`}>
      {loading && (
        <div className="w-full h-48 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && failed && (
        <p className="text-xs text-muted-foreground p-6 text-center">
          {t('storefront.vipMediaError', 'Could not load this content. Please try again.')}
        </p>
      )}

      {!loading && url && kind === 'video' && (
        <video src={url} controls playsInline preload="metadata" className="w-full max-h-[70vh] bg-black" />
      )}
      {!loading && url && kind === 'image' && (
        <img src={url} alt={title || ''} loading="lazy" className="w-full max-h-[70vh] object-contain bg-black" />
      )}
      {!loading && url && kind === 'audio' && (
        <div className="w-full p-4">
          <audio src={url} controls className="w-full" />
        </div>
      )}
      {!loading && url && kind === 'other' && (
        <iframe src={url} title={title || 'media'} className="w-full h-[60vh] bg-black" />
      )}
    </div>
  );
};
