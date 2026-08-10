import { driveFetch, verifyMediaToken } from "../_shared/drive.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'range, authorization, content-type',
  'Access-Control-Expose-Headers': 'content-length, content-range, accept-ranges',
};

/** Hosts allowed to embed protected media. */
const ALLOWED_HOST_PATTERNS = [
  'mytinglebox.com',
  'lovableproject.com',
  'lovable.app',
  'lovable.dev',
  'localhost',
  '127.0.0.1',
];

const PROTECTED_KINDS = new Set(['vip', 'custom']);

function hostAllowed(value: string | null): boolean {
  if (!value) return false;
  try {
    const host = new URL(value).hostname;
    return ALLOWED_HOST_PATTERNS.some((p) => host === p || host.endsWith(`.${p}`) || host.includes(p));
  } catch {
    return false;
  }
}

function forbidden(reason: string): Response {
  console.warn('drive-media blocked:', reason);
  return new Response('Forbidden', {
    status: 403,
    headers: { ...corsHeaders, 'cache-control': 'no-store' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const fileId = (url.searchParams.get('f') || '').trim();
    const exp = Number(url.searchParams.get('exp') || '0');
    const sig = (url.searchParams.get('sig') || '').trim();
    const kind = (url.searchParams.get('k') || '').trim();

    if (!fileId || !sig || !(await verifyMediaToken(fileId, exp, sig, kind || undefined))) {
      return forbidden('invalid token');
    }

    // ── Anti hot-link / anti "open in a new tab" ──
    const dest = (req.headers.get('sec-fetch-dest') || '').toLowerCase();
    const site = (req.headers.get('sec-fetch-site') || '').toLowerCase();
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');

    // Never render media as a top-level document, regardless of kind.
    if (['document', 'iframe', 'frame', 'object', 'embed'].includes(dest)) {
      return forbidden('top-level navigation');
    }

    if (PROTECTED_KINDS.has(kind)) {
      // Must be an embedded media subresource…
      if (dest && !['image', 'video', 'audio', 'empty', 'track'].includes(dest)) {
        return forbidden(`unexpected dest ${dest}`);
      }
      // …coming from one of our own pages.
      if (site === 'cross-site' || site === 'none') return forbidden(`sec-fetch-site ${site || 'none'}`);
      if (!hostAllowed(origin) && !hostAllowed(referer)) return forbidden('missing/foreign referer');
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
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Content-Security-Policy', "sandbox; default-src 'none'");

    if (PROTECTED_KINDS.has(kind)) {
      headers.set('Cache-Control', 'private, no-store, max-age=0');
      headers.set('Cross-Origin-Resource-Policy', 'same-site');
    } else {
      headers.set('Cache-Control', 'public, max-age=3600');
    }

    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (err) {
    console.error('drive-media error:', err);
    return new Response('Error', { status: 500, headers: corsHeaders });
  }
});
