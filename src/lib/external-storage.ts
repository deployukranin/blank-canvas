import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = 'https://bcojeroukkmfbybolvjm.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'sb_publishable_TY3fz0jctc1AVvS1OHUTKA_e2MOAxyp';
const VIP_MEDIA_BUCKET = 'vip-media';

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);

export async function uploadVipMedia(file: File, storeId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await externalSupabase.storage
    .from(VIP_MEDIA_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = externalSupabase.storage
    .from(VIP_MEDIA_BUCKET)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

export async function deleteVipMedia(url: string): Promise<void> {
  const bucketUrl = `${EXTERNAL_SUPABASE_URL}/storage/v1/object/public/${VIP_MEDIA_BUCKET}/`;
  if (!url.startsWith(bucketUrl)) return;
  
  const filePath = url.replace(bucketUrl, '');
  await externalSupabase.storage.from(VIP_MEDIA_BUCKET).remove([filePath]);
}
