import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  DRIVE_ROOT_FOLDER_ID,
  MAX_UPLOAD_BYTES,
  deleteFile,
  ensureFolder,
  ensureStoreFolder,
  signMediaToken,
  uploadFile,
} from "../_shared/drive.ts";

/** Sub-folder per content kind inside the tenant folder. */
const KIND_FOLDER: Record<string, string> = {
  config: 'config',
  vip: 'vip',
  custom: 'customs',
  preview: 'customs',
};

/** Brand assets (banners/icon) need a long-lived public link. */
const CONFIG_URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 5; // 5 years


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ success: false, error: 'Authentication required' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ success: false, error: 'Invalid authentication token' }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // ── DELETE: remove a previously uploaded file ──
    if (req.method === 'DELETE') {
      const body = await req.json().catch(() => ({}));
      const fileId = String(body?.fileId || '').replace(/^gdrive:/, '').trim();
      if (!fileId) return json({ success: false, error: 'fileId required' }, 400);

      const { data: row } = await admin
        .from('drive_files')
        .select('id, store_id')
        .eq('file_id', fileId)
        .maybeSingle();
      if (!row) return json({ success: true });

      if (!(await isStoreManager(admin, userId, row.store_id))) {
        return json({ success: false, error: 'Forbidden' }, 403);
      }
      await deleteFile(fileId);
      await admin.from('drive_files').delete().eq('id', row.id);
      return json({ success: true });
    }

    if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

    const { data: rl } = await admin.rpc('check_rate_limit', {
      p_identifier: userId,
      p_endpoint: 'drive-upload',
      p_max_requests: 60,
      p_window_minutes: 60,
    });
    if (rl && !(rl as { allowed?: boolean }).allowed) {
      return json({ success: false, error: 'Too many uploads, try again later' }, 429);
    }

    // ── JSON: migrate a legacy Supabase Storage asset into the tenant's Drive folder ──
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      if (body?.action !== 'migrate_config') {
        return json({ success: false, error: 'invalid action' }, 400);
      }
      const storeId = String(body.store_id || '').trim();
      const sourceUrl = String(body.url || '').trim();
      if (!storeId || !sourceUrl) return json({ success: false, error: 'store_id and url required' }, 400);
      if (!(await isStoreManager(admin, userId, storeId))) {
        return json({ success: false, error: 'Forbidden' }, 403);
      }
      const publicPrefix = `${SUPABASE_URL}/storage/v1/object/public/`;
      if (!sourceUrl.startsWith(publicPrefix)) {
        return json({ success: false, error: 'unsupported source' }, 400);
      }
      const objectPath = sourceUrl.slice(publicPrefix.length).split('?')[0];
      const [bucket, ...rest] = objectPath.split('/');
      if (!bucket || rest.length === 0 || rest[0] !== storeId) {
        return json({ success: false, error: 'unsupported source' }, 400);
      }

      const srcRes = await fetch(sourceUrl);
      if (!srcRes.ok) return json({ success: false, error: 'source not reachable' }, 400);
      const srcBytes = new Uint8Array(await srcRes.arrayBuffer());
      if (srcBytes.length > MAX_UPLOAD_BYTES) return json({ success: false, error: 'file too large' }, 413);

      const srcMime = srcRes.headers.get('content-type') || 'application/octet-stream';
      const srcName = decodeURIComponent(rest[rest.length - 1] || 'asset');

      const configFolder = await resolveKindFolder(admin, storeId, 'config');
      const migratedId = await uploadFile(srcBytes, `${Date.now()}-${srcName}`, srcMime, configFolder);

      await admin.from('drive_files').insert({
        store_id: storeId,
        file_id: migratedId,
        name: srcName,
        mime_type: srcMime,
        size_bytes: srcBytes.length,
        kind: 'config',
        created_by: userId,
      });

      await admin.storage.from(bucket).remove([rest.join('/')]);

      const migExp = Math.floor(Date.now() / 1000) + CONFIG_URL_TTL_SECONDS;
      const migSig = await signMediaToken(migratedId, migExp);
      return json({
        success: true,
        ref: `gdrive:${migratedId}`,
        fileId: migratedId,
        name: srcName,
        url: `${SUPABASE_URL}/functions/v1/drive-media?f=${encodeURIComponent(migratedId)}&exp=${migExp}&sig=${migSig}`,
      });
    }

    const form = await req.formData();

    const file = form.get('file');
    const storeId = String(form.get('store_id') || '').trim();
    const kind = String(form.get('kind') || 'vip').trim();
    const orderId = String(form.get('order_id') || '').trim() || null;

    if (!(file instanceof File)) return json({ success: false, error: 'file required' }, 400);
    if (!storeId) return json({ success: false, error: 'store_id required' }, 400);
    if (!KIND_FOLDER[kind]) return json({ success: false, error: 'invalid kind' }, 400);
    if (file.size > MAX_UPLOAD_BYTES) {
      return json({ success: false, error: 'Arquivo maior que 100MB' }, 413);
    }

    if (!(await isStoreManager(admin, userId, storeId))) {
      return json({ success: false, error: 'Forbidden' }, 403);
    }

    // ── Storage quota (trial = 100MB total) ──
    const { data: quota } = await admin.rpc('get_store_storage_quota', { p_store_id: storeId });
    const q = quota as { used_bytes?: number; limit_bytes?: number; unlimited?: boolean } | null;
    if (q && !q.unlimited && typeof q.limit_bytes === 'number' && q.limit_bytes > 0) {
      const used = Number(q.used_bytes || 0);
      if (used + file.size > q.limit_bytes) {
        return json({
          success: false,
          error: 'storage_quota_exceeded',
          used_bytes: used,
          limit_bytes: q.limit_bytes,
        }, 413);
      }
    }


    if (orderId) {
      const { data: order } = await admin
        .from('custom_orders')
        .select('id, store_id')
        .eq('id', orderId)
        .maybeSingle();
      if (!order || order.store_id !== storeId) {
        return json({ success: false, error: 'Pedido inválido' }, 400);
      }
    }

    // Folder named after the tenant (slug/name + owner email) instead of the raw UUID
    const { data: storeRow } = await admin
      .from('stores')
      .select('slug, name, created_by')
      .eq('id', storeId)
      .maybeSingle();
    let ownerEmail = '';
    if (storeRow?.created_by) {
      const { data: ownerData } = await admin.auth.admin.getUserById(storeRow.created_by);
      ownerEmail = ownerData?.user?.email || '';
    }
    const label = [storeRow?.slug || storeRow?.name || storeId, ownerEmail ? `(${ownerEmail})` : '']
      .filter(Boolean)
      .join(' ');

    const storeFolder = await ensureStoreFolder(storeId, label, DRIVE_ROOT_FOLDER_ID);
    const kindFolder = await ensureFolder(KIND_FOLDER[kind], storeFolder);


    const safeName = (file.name || 'arquivo').replace(/[\\/\r\n]/g, '_').slice(0, 180);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const driveId = await uploadFile(
      bytes,
      `${Date.now()}-${safeName}`,
      file.type || 'application/octet-stream',
      kindFolder,
    );

    await admin.from('drive_files').insert({
      store_id: storeId,
      file_id: driveId,
      name: safeName,
      mime_type: file.type || null,
      size_bytes: file.size,
      kind,
      order_id: orderId,
      created_by: userId,
    });

    // Brand assets are public: return a ready-to-use long-lived media URL
    let publicUrl: string | null = null;
    if (kind === 'config') {
      const exp = Math.floor(Date.now() / 1000) + CONFIG_URL_TTL_SECONDS;
      const sig = await signMediaToken(driveId, exp);
      publicUrl = `${SUPABASE_URL}/functions/v1/drive-media?f=${encodeURIComponent(driveId)}&exp=${exp}&sig=${sig}`;
    }

    return json({ success: true, ref: `gdrive:${driveId}`, fileId: driveId, name: safeName, url: publicUrl });
  } catch (err) {
    console.error('drive-upload error:', err);
    return json({ success: false, error: (err as Error).message || 'Upload failed' }, 500);
  }
});

async function isStoreManager(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  storeId: string,
): Promise<boolean> {
  const { data: store } = await admin
    .from('stores')
    .select('id, created_by')
    .eq('id', storeId)
    .maybeSingle();
  if (store?.created_by === userId) return true;

  const { data: adminRow } = await admin
    .from('store_admins')
    .select('id')
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!adminRow;
}
