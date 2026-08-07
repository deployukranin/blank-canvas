import { supabase } from '@/integrations/supabase/client';

const VIP_MEDIA_BUCKET = 'vip-media';
const DRIVE_PREFIX = 'gdrive:';

export const MAX_DRIVE_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB

export function isDriveRef(value?: string | null): boolean {
  return !!value && value.startsWith(DRIVE_PREFIX);
}

interface UploadResult {
  ref: string;
  name: string;
}

async function uploadToDrive(
  file: File,
  storeId: string,
  kind: 'vip' | 'custom',
  orderId?: string,
): Promise<UploadResult> {
  if (file.size > MAX_DRIVE_UPLOAD_BYTES) {
    throw new Error('Arquivo maior que 100MB');
  }

  const form = new FormData();
  form.append('file', file);
  form.append('store_id', storeId);
  form.append('kind', kind);
  if (orderId) form.append('order_id', orderId);

  const { data, error } = await supabase.functions.invoke('drive-upload', { body: form });
  if (error) {
    const detail = await extractFunctionError(error);
    throw new Error(detail || 'Falha no upload');
  }
  if (!data?.success || !data?.ref) {
    throw new Error(data?.error || 'Falha no upload');
  }
  return { ref: data.ref as string, name: (data.name as string) || file.name };
}

/** Uploads VIP media to Google Drive and returns a `gdrive:<id>` reference. */
export async function uploadVipMedia(file: File, storeId: string): Promise<string> {
  const { ref } = await uploadToDrive(file, storeId, 'vip');
  return ref;
}

/** Uploads a delivery file for a custom order. */
export async function uploadCustomDelivery(
  file: File,
  storeId: string,
  orderId: string,
): Promise<UploadResult> {
  return await uploadToDrive(file, storeId, 'custom', orderId);
}

/**
 * Resolve a playable/downloadable URL.
 * Supports Google Drive refs, legacy Supabase storage paths and external URLs.
 */
export async function getVipMediaSignedUrl(pathOrUrl: string): Promise<string | null> {
  if (!pathOrUrl) return null;

  if (isDriveRef(pathOrUrl)) {
    const { data, error } = await supabase.functions.invoke('drive-sign', {
      body: { ref: pathOrUrl },
    });
    if (error || !data?.success || !data?.url) return null;
    return data.url as string;
  }

  const filePath = extractFilePath(pathOrUrl);
  if (!filePath) return pathOrUrl; // external URL

  const { data, error } = await supabase.storage
    .from(VIP_MEDIA_BUCKET)
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Alias for order deliveries — same resolution logic. */
export const getDeliverySignedUrl = getVipMediaSignedUrl;

function extractFilePath(pathOrUrl: string): string | null {
  if (!pathOrUrl.startsWith('http')) return pathOrUrl;

  const marker = `/storage/v1/object/public/${VIP_MEDIA_BUCKET}/`;
  const idx = pathOrUrl.indexOf(marker);
  if (idx !== -1) return pathOrUrl.substring(idx + marker.length);

  const signedMarker = `/storage/v1/object/sign/${VIP_MEDIA_BUCKET}/`;
  const signedIdx = pathOrUrl.indexOf(signedMarker);
  if (signedIdx !== -1) {
    return pathOrUrl.substring(signedIdx + signedMarker.length).split('?')[0];
  }

  return null;
}

export async function deleteVipMedia(ref: string): Promise<void> {
  if (!ref) return;

  if (isDriveRef(ref)) {
    await supabase.functions.invoke('drive-upload', {
      method: 'DELETE',
      body: { fileId: ref },
    });
    return;
  }

  const filePath = extractFilePath(ref);
  if (!filePath) return;
  await supabase.storage.from(VIP_MEDIA_BUCKET).remove([filePath]);
}

async function extractFunctionError(error: unknown): Promise<string | null> {
  const ctx = (error as { context?: { text?: () => Promise<string> } })?.context;
  if (ctx?.text) {
    try {
      const body = await ctx.text();
      const parsed = JSON.parse(body);
      return parsed?.error || body;
    } catch {
      return null;
    }
  }
  return (error as Error)?.message ?? null;
}
