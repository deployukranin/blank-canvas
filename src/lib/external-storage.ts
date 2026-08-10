import { supabase } from '@/integrations/supabase/client';
import { maskMediaUrl } from '@/lib/public-url';

const VIP_MEDIA_BUCKET = 'vip-media';
const DRIVE_PREFIX = 'gdrive:';

export const MAX_DRIVE_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB

export function isDriveRef(value?: string | null): boolean {
  return !!value && value.startsWith(DRIVE_PREFIX);
}

interface UploadResult {
  ref: string;
  name: string;
  url?: string | null;
}

export type UploadKind = 'vip' | 'custom' | 'preview' | 'config';

/** Maps backend error codes to a readable message. */
export function describeUploadError(raw?: string | null): string {
  const code = (raw || '').trim();
  if (!code) return 'Falha no upload';
  if (code.includes('storage_quota_exceeded')) return 'quota';
  if (code.includes('100MB') || code.includes('too large')) return 'size';
  if (code.toLowerCase().includes('forbidden')) return 'forbidden';
  return code;
}

async function uploadToDrive(
  file: File,
  storeId: string,
  kind: UploadKind,
  orderId?: string,
): Promise<UploadResult> {
  if (file.size > MAX_DRIVE_UPLOAD_BYTES) {
    throw new Error('size');
  }

  const form = new FormData();
  form.append('file', file);
  form.append('store_id', storeId);
  form.append('kind', kind);
  if (orderId) form.append('order_id', orderId);

  const { data, error } = await supabase.functions.invoke('drive-upload', { body: form });
  if (error) {
    const detail = await extractFunctionError(error);
    throw new Error(describeUploadError(detail));
  }
  if (!data?.success || !data?.ref) {
    throw new Error(describeUploadError(data?.error));
  }
  return {
    ref: data.ref as string,
    name: (data.name as string) || file.name,
    url: (data.url as string) || null,
  };
}

/** Uploads VIP media to Google Drive and returns a `gdrive:<id>` reference. */
export async function uploadVipMedia(file: File, storeId: string): Promise<string> {
  const { ref } = await uploadToDrive(file, storeId, 'vip');
  return ref;
}

/** Uploads a public preview asset (customs/videos page banner or teaser video). */
export async function uploadPreviewMedia(file: File, storeId: string): Promise<UploadResult> {
  return await uploadToDrive(file, storeId, 'preview');
}

/**
 * Uploads a brand/config asset (banner, platform icon) into the tenant's
 * `config` folder in Drive. Returns a long-lived public URL.
 */
export async function uploadConfigAsset(file: File, storeId: string): Promise<{ url: string; ref: string }> {
  const { ref, url } = await uploadToDrive(file, storeId, 'config');
  if (!url) throw new Error('Falha ao gerar link do arquivo');
  return { url: maskMediaUrl(url)!, ref };
}

/** True for legacy assets still stored in the Supabase `banners` bucket. */
export function isLegacyStorageAsset(value?: string | null): boolean {
  return !!value && value.includes('/storage/v1/object/public/banners/');
}

/**
 * Moves a legacy Supabase Storage brand asset into the tenant's Drive `config`
 * folder. Returns the new public URL, or null when nothing was migrated.
 */
export async function migrateConfigAsset(url: string, storeId: string): Promise<string | null> {
  if (!isLegacyStorageAsset(url) || !storeId) return null;
  const { data, error } = await supabase.functions.invoke('drive-upload', {
    body: { action: 'migrate_config', store_id: storeId, url },
  });
  if (error || !data?.success || !data?.url) return null;
  return data.url as string;
}

/**
 * Ensures the tenant folder (`TingleBox/<loja> (email)`) exists in Drive with
 * the three standard sub-folders: config, vip and customs. Runs once per store.
 */
export async function provisionStoreDrive(storeId: string): Promise<void> {
  if (!storeId) return;
  const key = `drive:provisioned:${storeId}`;
  try {
    if (localStorage.getItem(key)) return;
  } catch { /* ignore */ }
  const { data, error } = await supabase.functions.invoke('drive-upload', {
    body: { action: 'provision', store_id: storeId },
  });
  if (error || !data?.success) return;
  try {
    localStorage.setItem(key, '1');
  } catch { /* ignore */ }
}


/** Extracts the Drive file id from a `gdrive:` ref or a drive-media URL. */
export function driveFileIdFromUrl(value?: string | null): string | null {
  if (!value) return null;
  if (isDriveRef(value)) return value.slice(DRIVE_PREFIX.length);
  if (!value.includes('drive-media')) return null;
  try {
    return new URL(value).searchParams.get('f');
  } catch {
    return null;
  }
}

/** Deletes a Drive-backed asset given its stored URL or ref (no-op otherwise). */
export async function deleteDriveAsset(value?: string | null): Promise<void> {
  const fileId = driveFileIdFromUrl(value);
  if (!fileId) return;
  await supabase.functions.invoke('drive-upload', { method: 'DELETE', body: { fileId } });
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
    return maskMediaUrl(data.url as string);
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

/** Resolves a playable URL plus its mime type, so deliveries can play inline. */
export async function getDriveMedia(
  ref: string,
): Promise<{ url: string; mimeType: string | null } | null> {
  if (!ref) return null;
  if (isDriveRef(ref)) {
    const { data, error } = await supabase.functions.invoke('drive-sign', { body: { ref } });
    if (error || !data?.success || !data?.url) return null;
    return { url: maskMediaUrl(data.url as string)!, mimeType: (data.mimeType as string) || null };
  }
  const url = await getVipMediaSignedUrl(ref);
  return url ? { url, mimeType: null } : null;
}

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
