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

  const { data: urlData } = supabase.storage
    .from(VIP_MEDIA_BUCKET)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

export async function deleteVipMedia(url: string): Promise<void> {
  // Extract file path from the public URL
  const marker = `/storage/v1/object/public/${VIP_MEDIA_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;

  const filePath = url.substring(idx + marker.length);
  await supabase.storage.from(VIP_MEDIA_BUCKET).remove([filePath]);
}
