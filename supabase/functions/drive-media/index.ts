import { driveFetch, verifyMediaToken } from "../_shared/drive.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'range, authorization, content-type',
  'Access-Control-Expose-Headers': 'content-length, content-range, accept-ranges',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const fileId = (url.searchParams.get('f') || '').trim();
    const exp = Number(url.searchParams.get('exp') || '0');
    const sig = (url.searchParams.get('sig') || '').trim();

    if (!fileId || !sig || !(await verifyMediaToken(fileId, exp, sig))) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    const range = req.headers.get('range');
    const upstream = await driveFetch(
      `/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
      { headers: range ? { Range: range } : {} },
    );

    if (!upstream.ok && upstream.status !== 206) {
      const detail = await upstream.text();
      console.error(`drive-media upstream [${upstream.status}]: ${detail}`);
      return new Response('Upstream error', { status: upstream.status, headers: corsHeaders });
    }

    const headers = new Headers(corsHeaders);
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }
    if (!headers.has('accept-ranges')) headers.set('accept-ranges', 'bytes');
    headers.set('Cache-Control', 'private, max-age=3600');

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (err) {
    console.error('drive-media error:', err);
    return new Response('Error', { status: 500, headers: corsHeaders });
  }
});
