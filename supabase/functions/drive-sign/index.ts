import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { signMediaToken } from "../_shared/drive.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TTL_SECONDS = 5 * 60; // protected media: 5 min, renewed by the player

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

    const body = await req.json().catch(() => ({}));
    const fileId = String(body?.ref || body?.fileId || '').replace(/^gdrive:/, '').trim();
    if (!fileId) return json({ success: false, error: 'ref required' }, 400);

    const { data: row } = await admin
      .from('drive_files')
      .select('file_id, store_id, kind, order_id, mime_type, name')
      .eq('file_id', fileId)
      .maybeSingle();
    if (!row) return json({ success: false, error: 'Arquivo não encontrado' }, 404);

    // Public assets (store landing/customs teaser, brand config files) need no authentication.
    if (row.kind === 'preview' || row.kind === 'config') {
      const ttl = row.kind === 'config' ? 60 * 60 * 24 * 365 * 5 : 60 * 60 * 2;
      const previewExp = Math.floor(Date.now() / 1000) + ttl;
      const previewSig = await signMediaToken(fileId, previewExp, row.kind);
      return json({
        success: true,
        url: `${SUPABASE_URL}/functions/v1/drive-media?f=${encodeURIComponent(fileId)}&exp=${previewExp}&sig=${previewSig}&k=${row.kind}`,
        expiresAt: previewExp,
        name: row.name,
        mimeType: row.mime_type,
      });
    }


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


    // ── Authorization ──
    let allowed = false;

    const { data: store } = await admin
      .from('stores')
      .select('id, created_by')
      .eq('id', row.store_id)
      .maybeSingle();
    if (store?.created_by === userId) allowed = true;

    if (!allowed) {
      const { data: adminRow } = await admin
        .from('store_admins')
        .select('id')
        .eq('store_id', row.store_id)
        .eq('user_id', userId)
        .maybeSingle();
      if (adminRow) allowed = true;
    }

    if (!allowed && row.kind === 'vip') {
      const { data: sub } = await admin
        .from('vip_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('store_id', row.store_id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (sub) allowed = true;
    }

    if (!allowed && row.kind === 'custom' && row.order_id) {
      const { data: order } = await admin
        .from('custom_orders')
        .select('user_id, status')
        .eq('id', row.order_id)
        .maybeSingle();
      if (order?.user_id === userId && ['paid', 'processing', 'completed', 'delivered'].includes(String(order.status))) {
        allowed = true;
      }
    }

    if (!allowed) return json({ success: false, error: 'Acesso negado' }, 403);

    const kind = String(row.kind || 'vip');
    const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
    const sig = await signMediaToken(fileId, exp, kind);
    const url = `${SUPABASE_URL}/functions/v1/drive-media?f=${encodeURIComponent(fileId)}&exp=${exp}&sig=${sig}&k=${encodeURIComponent(kind)}`;


    return json({ success: true, url, expiresAt: exp, name: row.name, mimeType: row.mime_type });
  } catch (err) {
    console.error('drive-sign error:', err);
    return json({ success: false, error: 'Falha ao gerar link' }, 500);
  }
});
