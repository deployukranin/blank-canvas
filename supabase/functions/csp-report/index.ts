// CSP violation report collector.
// Public endpoint (browsers post reports without credentials); we accept small
// JSON payloads, throttle per-IP, and persist to `csp_violations` for the
// super-admin panel.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_MINUTES = 60;
const SCRIPT_SAMPLE_MAX = 500;

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function truncate(v: unknown, max = 2000): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v);
  return s.length > max ? s.slice(0, max) : s;
}

function toInt(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/**
 * Normalizes both CSP2 (`{"csp-report": {...}}`) and Reporting API v1
 * (array of `{type: "csp-violation", body: {...}}`) into row shapes.
 */
function extractRows(body: unknown): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  const pushCsp2 = (r: any) => {
    rows.push({
      violated_directive: truncate(r['violated-directive'] ?? r['effective-directive']),
      effective_directive: truncate(r['effective-directive']),
      blocked_uri: truncate(r['blocked-uri']),
      document_uri: truncate(r['document-uri']),
      source_file: truncate(r['source-file']),
      line_number: toInt(r['line-number']),
      column_number: toInt(r['column-number']),
      disposition: truncate(r['disposition'], 20),
      script_sample: truncate(r['script-sample'], SCRIPT_SAMPLE_MAX),
      referrer: truncate(r['referrer']),
      raw: r,
    });
  };

  if (body && typeof body === 'object') {
    if (Array.isArray(body)) {
      for (const item of body as any[]) {
        if (item?.type === 'csp-violation' && item?.body) {
          const b = item.body;
          rows.push({
            violated_directive: truncate(b['effectiveDirective'] ?? b['violatedDirective']),
            effective_directive: truncate(b['effectiveDirective']),
            blocked_uri: truncate(b['blockedURL']),
            document_uri: truncate(b['documentURL'] ?? item['url']),
            source_file: truncate(b['sourceFile']),
            line_number: toInt(b['lineNumber']),
            column_number: toInt(b['columnNumber']),
            disposition: truncate(b['disposition'], 20),
            script_sample: truncate(b['sample'], SCRIPT_SAMPLE_MAX),
            referrer: truncate(b['referrer'] ?? item['user_agent']),
            raw: item,
          });
        }
      }
    } else if ((body as any)['csp-report']) {
      pushCsp2((body as any)['csp-report']);
    }
  }

  return rows;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const cl = Number(req.headers.get('content-length') || '0');
  if (cl > MAX_BODY_BYTES) {
    return new Response('Payload too large', { status: 413, headers: corsHeaders });
  }

  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  const ua = truncate(req.headers.get('user-agent'), 500);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  try {
    const { data: rl } = await admin.rpc('check_rate_limit', {
      p_identifier: `ip:${ip}`,
      p_endpoint: 'csp-report',
      p_max_requests: RATE_LIMIT_MAX,
      p_window_minutes: RATE_LIMIT_MINUTES,
    });
    if (rl && (rl as any).allowed === false) {
      return new Response(JSON.stringify({ ok: false, error: 'rate_limited' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch {
    // fail-open
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

  const rows = extractRows(body);
  if (rows.length === 0) return new Response(null, { status: 204, headers: corsHeaders });

  const ipHash = await sha256Hex(`${ip}|csp`);
  const enriched = rows.map((r) => ({ ...r, ip_hash: ipHash, user_agent: ua }));

  const { error } = await admin.from('csp_violations').insert(enriched);
  if (error) {
    console.error('csp_violations insert error', error.message);
    // Still ack — never punish browsers for our infra issues.
  }

  return new Response(null, { status: 204, headers: corsHeaders });
});
