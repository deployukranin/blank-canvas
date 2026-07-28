// CSP violation report collector.
// Public endpoint (browsers post reports without credentials); we only accept
// small JSON payloads, throttle per-IP, and log to console (Supabase log drain).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_BODY_BYTES = 8 * 1024; // 8 KB — real reports are tiny
const RATE_LIMIT_MAX = 60;       // per IP per hour
const RATE_LIMIT_MINUTES = 60;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  // Size guard
  const cl = Number(req.headers.get('content-length') || '0');
  if (cl > MAX_BODY_BYTES) {
    return new Response('Payload too large', { status: 413, headers: corsHeaders });
  }

  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  // Rate limit per IP via existing RPC
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data: rl } = await admin.rpc('check_rate_limit', {
      p_identifier: `ip:${ip}`,
      p_endpoint: 'csp-report',
      p_max_requests: RATE_LIMIT_MAX,
      p_window_minutes: RATE_LIMIT_MINUTES,
    });
    if (rl && rl.allowed === false) {
      return new Response(JSON.stringify({ ok: false, error: 'rate_limited' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch {
    // fail-open: never block reports on infra hiccups
  }

  let body: unknown = null;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return new Response('Payload too large', { status: 413, headers: corsHeaders });
    }
    body = raw ? JSON.parse(raw) : null;
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
  }

  // Accept both CSP2 (`csp-report`) and Reporting API (array of reports) shapes.
  console.log(
    JSON.stringify({
      kind: 'csp-report',
      ip,
      ua: req.headers.get('user-agent') || null,
      report: body,
      at: new Date().toISOString(),
    }),
  );

  // No body — browsers ignore it anyway.
  return new Response(null, { status: 204, headers: corsHeaders });
});
