// Deletes an unconfirmed, storeless auth user so a retry can happen with the
// same email. Safe to call anonymously — it never deletes confirmed accounts
// or accounts that already own a store.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const FN = 'cleanup-orphan-signup'
function maskEmail(e: string) {
  const [u, d] = e.split('@')
  if (!u || !d) return '***'
  return `${u.slice(0, 2)}***@${d}`
}
function log(event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ fn: FN, ts: new Date().toISOString(), event, ...data }))
}
function logErr(event: string, data: Record<string, unknown> = {}) {
  console.error(JSON.stringify({ fn: FN, ts: new Date().toISOString(), event, level: 'error', ...data }))
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function adminFetch(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(init.headers || {}),
    },
  })
}

async function checkRateLimit(identifier: string, max: number, minutes: number): Promise<boolean> {
  try {
    const r = await adminFetch(`/rest/v1/rpc/check_rate_limit`, {
      method: 'POST',
      body: JSON.stringify({
        p_identifier: identifier,
        p_endpoint: 'cleanup-orphan-signup',
        p_max_requests: max,
        p_window_minutes: minutes,
      }),
    })
    if (!r.ok) return true
    const j = await r.json().catch(() => ({}))
    return !!j?.allowed
  } catch {
    return true
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405)

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon'

  try {
    const payload = await req.json().catch(() => null)
    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      logErr('invalid_email', { ip })
      return json({ success: false, error: 'Email inválido' }, 400)
    }
    log('request_received', { ip, email: maskEmail(email) })

    const [ipOk, emailOk] = await Promise.all([
      checkRateLimit(`ip:${ip}`, 30, 60),
      checkRateLimit(`email:${email}`, 5, 60),
    ])
    if (!ipOk || !emailOk) {
      logErr('rate_limited', { ip, email: maskEmail(email), ipOk, emailOk })
      return json({ success: false, error: 'Muitas tentativas' }, 429)
    }

    // Lookup user
    const lookup = await adminFetch(`/auth/v1/admin/users?email=${encodeURIComponent(email)}`)
    if (!lookup.ok) {
      logErr('lookup_failed', { status: lookup.status, email: maskEmail(email) })
      return json({ success: true, cleaned: false })
    }
    const lj = await lookup.json().catch(() => ({}))
    const users = Array.isArray(lj?.users) ? lj.users : []
    const user = users.find((u: any) => (u?.email || '').toLowerCase() === email)
    if (!user?.id) {
      log('no_user_found', { email: maskEmail(email) })
      return json({ success: true, cleaned: false, reason: 'not_found' })
    }

    if (user.email_confirmed_at) {
      log('skip_confirmed', { user_id: user.id, email: maskEmail(email) })
      return json({ success: true, cleaned: false, reason: 'confirmed' })
    }

    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0
    if (createdAt && Date.now() - createdAt > 30 * 60 * 1000) {
      log('skip_too_old', { user_id: user.id, age_min: Math.round((Date.now() - createdAt) / 60000) })
      return json({ success: true, cleaned: false, reason: 'too_old' })
    }

    const s = await adminFetch(`/rest/v1/stores?select=id&created_by=eq.${user.id}&limit=1`)
    if (s.ok) {
      const sj = await s.json().catch(() => [])
      if (Array.isArray(sj) && sj.length > 0) {
        log('skip_has_store', { user_id: user.id })
        return json({ success: true, cleaned: false, reason: 'has_store' })
      }
    }

    const del = await adminFetch(`/auth/v1/admin/users/${user.id}`, { method: 'DELETE' })
    if (del.ok) {
      log('orphan_deleted', { user_id: user.id, email: maskEmail(email) })
      return json({ success: true, cleaned: true })
    } else {
      const txt = await del.text().catch(() => '')
      logErr('delete_failed', { user_id: user.id, status: del.status, body: txt.slice(0, 200) })
      return json({ success: false, cleaned: false, error: 'Falha ao deletar' }, 500)
    }
  } catch (err) {
    logErr('crashed', { error: (err as Error).message })
    return json({ success: false, error: 'Erro interno' }, 500)
  }
})
