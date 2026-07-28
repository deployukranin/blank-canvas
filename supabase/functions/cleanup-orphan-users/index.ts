// Cron job: sweeps unconfirmed auth users older than N minutes without an
// associated store and deletes them so their emails become reusable.
// Runs as safety net in case per-request cleanup (send-auth-email rollback
// or client-invoked cleanup-orphan-signup) fails.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')

const FN = 'cleanup-orphan-users'
function log(event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ fn: FN, ts: new Date().toISOString(), event, ...data }))
}
function logErr(event: string, data: Record<string, unknown> = {}) {
  console.error(JSON.stringify({ fn: FN, ts: new Date().toISOString(), event, level: 'error', ...data }))
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Auth via CRON_SECRET header
  if (!CRON_SECRET) {
    logErr('missing_cron_secret')
    return json({ success: false, error: 'CRON_SECRET not configured' }, 500)
  }
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    logErr('unauthorized_cron_call')
    return json({ success: false, error: 'Unauthorized' }, 401)
  }

  const started = Date.now()
  const minAgeMinutes = 30
  const cutoffMs = Date.now() - minAgeMinutes * 60 * 1000

  let scanned = 0
  let deleted = 0
  let skippedConfirmed = 0
  let skippedHasStore = 0
  let skippedTooRecent = 0
  const failures: Array<{ id: string; error: string }> = []

  try {
    // Paginate through all users
    let page = 1
    const perPage = 200
    while (true) {
      const r = await adminFetch(`/auth/v1/admin/users?page=${page}&per_page=${perPage}`)
      if (!r.ok) {
        logErr('list_users_failed', { status: r.status, page })
        break
      }
      const j = await r.json().catch(() => ({}))
      const users: any[] = Array.isArray(j?.users) ? j.users : []
      if (users.length === 0) break

      for (const u of users) {
        scanned++
        if (u.email_confirmed_at) { skippedConfirmed++; continue }
        const createdAt = u.created_at ? new Date(u.created_at).getTime() : 0
        if (!createdAt || createdAt > cutoffMs) { skippedTooRecent++; continue }

        // Has store?
        const s = await adminFetch(`/rest/v1/stores?select=id&created_by=eq.${u.id}&limit=1`)
        if (s.ok) {
          const sj = await s.json().catch(() => [])
          if (Array.isArray(sj) && sj.length > 0) { skippedHasStore++; continue }
        }

        const del = await adminFetch(`/auth/v1/admin/users/${u.id}`, { method: 'DELETE' })
        if (del.ok) {
          deleted++
          log('orphan_deleted', { user_id: u.id, email: u.email, age_min: Math.round((Date.now() - createdAt) / 60000) })
        } else {
          const txt = await del.text().catch(() => '')
          failures.push({ id: u.id, error: `HTTP ${del.status}: ${txt.slice(0, 200)}` })
          logErr('delete_failed', { user_id: u.id, status: del.status })
        }
      }

      if (users.length < perPage) break
      page++
      if (page > 50) break // safety cap
    }

    const summary = {
      success: true,
      scanned,
      deleted,
      skipped_confirmed: skippedConfirmed,
      skipped_has_store: skippedHasStore,
      skipped_too_recent: skippedTooRecent,
      failures: failures.length,
      duration_ms: Date.now() - started,
    }
    log('run_complete', summary)
    return json(summary)
  } catch (err) {
    logErr('run_crashed', { error: (err as Error).message })
    return json({ success: false, error: 'Internal error', scanned, deleted }, 500)
  }
})
