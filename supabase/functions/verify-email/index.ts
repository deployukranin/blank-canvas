// Public endpoint hit by the verification link sent in auth emails.
// The link is served from the platform domain (/api/verify-email) so the
// backend host is never exposed to the user. Tokens are single-use, hashed at
// rest and expire after 24h.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_ORIGIN = 'https://mytinglebox.com'

async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function adminFetch(path: string, init: RequestInit = {}) {
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

function redirect(status: 'success' | 'invalid' | 'expired') {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${APP_ORIGIN}/verify?status=${status}`,
      'Cache-Control': 'no-store',
    },
  })
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || ''

  if (!/^[a-f0-9]{32,128}$/i.test(token)) return redirect('invalid')

  try {
    const hash = await sha256(token)
    const res = await adminFetch(
      `/rest/v1/email_verification_tokens?select=id,user_id,expires_at,used_at&token_hash=eq.${hash}&limit=1`,
    )
    const rows = res.ok ? await res.json().catch(() => []) : []
    const row = Array.isArray(rows) ? rows[0] : null
    if (!row) return redirect('invalid')

    // Already used: treat as success so a second click (or an email scanner
    // pre-fetch) does not show a scary error to a verified user.
    if (row.used_at) return redirect('success')
    if (new Date(row.expires_at).getTime() < Date.now()) return redirect('expired')

    await adminFetch(`/rest/v1/profiles?user_id=eq.${row.user_id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ email_verified_at: new Date().toISOString() }),
    })

    await adminFetch(`/rest/v1/email_verification_tokens?id=eq.${row.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ used_at: new Date().toISOString() }),
    })

    return redirect('success')
  } catch {
    return redirect('invalid')
  }
})
