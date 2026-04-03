import { supabase } from '@/integrations/supabase/client';

const VIP_MEDIA_BUCKET = 'vip-media';

export async function uploadVipMedia(file: File, storeId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(VIP_MEDIA_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  // Return the file path (not a public URL) since bucket is now private
  return fileName;
}

/**
 * Get a signed URL for a VIP media file (valid for 1 hour).
 * Works with both legacy public URLs and new file paths.
 */
export async function getVipMediaSignedUrl(pathOrUrl: string): Promise<string | null> {
  const filePath = extractFilePath(pathOrUrl);
  if (!filePath) return pathOrUrl; // fallback for external URLs

  const { data, error } = await supabase.storage
    .from(VIP_MEDIA_BUCKET)
    .createSignedUrl(filePath, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    console.warn('Could not create signed URL:', error?.message);
    return null;
  }

  return data.signedUrl;
}

/**
 * Extract file path from either a public URL or a raw path.
 */
function extractFilePath(pathOrUrl: string): string | null {
  // If it's already a plain path (new format)
  if (!pathOrUrl.startsWith('http')) {
    return pathOrUrl;
  }

  // Legacy: extract from public URL
  const marker = `/storage/v1/object/public/${VIP_MEDIA_BUCKET}/`;
  const idx = pathOrUrl.indexOf(marker);
  if (idx !== -1) {
    return pathOrUrl.substring(idx + marker.length);
  }

  // Also handle signed URL format
  const signedMarker = `/storage/v1/object/sign/${VIP_MEDIA_BUCKET}/`;
  const signedIdx = pathOrUrl.indexOf(signedMarker);
  if (signedIdx !== -1) {
    const path = pathOrUrl.substring(signedIdx + signedMarker.length);
    return path.split('?')[0]; // remove query params
  }

  return null; // external URL, not from our bucket
}

export async function deleteVipMedia(url: string): Promise<void> {
  const filePath = extractFilePath(url);
  if (!filePath) return;

  await supabase.storage.from(VIP_MEDIA_BUCKET).remove([filePath]);
}
