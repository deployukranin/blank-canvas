import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'
const FROM = 'TingleBox <verified@mytinglebox.com>'
// Logo shown at the top of every auth email. Configurable via the EMAIL_LOGO_URL
// secret/env var. When it is not set, we fall back to a text wordmark instead of
// a broken image (the storage bucket is private, so its URL would not load).
const LOGO_URL = Deno.env.get('EMAIL_LOGO_URL')?.trim() || ''

// Renders either the configured logo image or a text wordmark fallback.
function renderLogo(): string {
  if (LOGO_URL) {
    return `<img src="${LOGO_URL}" alt="TingleBox" width="140" style="display:block;margin:0 auto 24px;max-width:140px;height:auto;" />`
  }
  return `<div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;margin:0 auto 24px;">Tingle<span style="color:#a78bfa;">Box</span></div>`
}

type AuthEmailType = 'signup' | 'recovery'

const FN = 'send-auth-email'
function maskEmail(e: string) {
  const [u, d] = e.split('@')
  if (!u || !d) return '***'
  return `${u.slice(0, 2)}***@${d}`
}
function slog(event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ fn: FN, ts: new Date().toISOString(), event, ...data }))
}
function slogErr(event: string, data: Record<string, unknown> = {}) {
  console.error(JSON.stringify({ fn: FN, ts: new Date().toISOString(), event, level: 'error', ...data }))
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

// ---------- Email templates (PT-BR, dark/purple identity) ----------
function baseTemplate(opts: { title: string; intro: string; cta: string; link: string; footer: string }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
      <div style="background-color:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 32px;text-align:center;">
        ${renderLogo()}
        <h1 style="font-size:20px;font-weight:700;color:#ffffff;margin:0 0 12px;">${opts.title}</h1>
        <p style="font-size:14px;line-height:22px;color:#a1a1aa;margin:0 0 28px;">${opts.intro}</p>
        <a href="${opts.link}" style="display:inline-block;background-color:#7c3aed;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:10px;">${opts.cta}</a>
        <p style="font-size:12px;line-height:20px;color:#71717a;margin:28px 0 0;">${opts.footer}</p>
        <p style="font-size:11px;line-height:18px;color:#52525b;margin:20px 0 0;word-break:break-all;">${opts.link}</p>
      </div>
      <p style="font-size:11px;color:#a1a1aa;text-align:center;margin:24px 0 0;">© TingleBox</p>
    </div>
  </body>
</html>`
}

function buildEmail(type: AuthEmailType, link: string): { subject: string; html: string } {
  if (type === 'recovery') {
    return {
      subject: 'Redefinir sua senha — TingleBox',
      html: baseTemplate({
        title: 'Redefinir senha',
        intro: 'Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.',
        cta: 'Redefinir senha',
        link,
        footer: 'Se você não solicitou isso, pode ignorar este email com segurança. O link expira em 1 hora.',
      }),
    }
  }
  return {
    subject: 'Confirme seu email — TingleBox',
    html: baseTemplate({
      title: 'Confirme seu email',
      intro: 'Falta pouco! Confirme seu endereço de email para ativar sua conta e continuar.',
      cta: 'Confirmar email',
      link,
      footer: 'Se você não criou esta conta, pode ignorar este email com segurança.',
    }),
  }
}

// ---------- Supabase admin helpers ----------
async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
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

// Find an existing auth user by email. Returns { id, confirmed, createdAt } or null.
async function findUserByEmail(email: string): Promise<{ id: string; confirmed: boolean; createdAt: string } | null> {
  try {
    const r = await adminFetch(`/auth/v1/admin/users?email=${encodeURIComponent(email)}`)
    if (!r.ok) return null
    const j = await r.json().catch(() => ({}))
    const users = Array.isArray(j?.users) ? j.users : []
    const u = users.find((x: any) => (x?.email || '').toLowerCase() === email.toLowerCase())
    if (!u?.id) return null
    return {
      id: u.id as string,
      confirmed: !!u.email_confirmed_at,
      createdAt: u.created_at as string,
    }
  } catch {
    return null
  }
}

async function userHasStore(userId: string): Promise<boolean> {
  try {
    const r = await adminFetch(`/rest/v1/stores?select=id&created_by=eq.${userId}&limit=1`)
    if (!r.ok) return false
    const j = await r.json().catch(() => [])
    return Array.isArray(j) && j.length > 0
  } catch {
    return false
  }
}

async function deleteUser(userId: string, context: string): Promise<boolean> {
  try {
    const r = await adminFetch(`/auth/v1/admin/users/${userId}`, { method: 'DELETE' })
    if (r.ok) slog('user_deleted', { user_id: userId, context })
    else slogErr('user_delete_failed', { user_id: userId, context, status: r.status })
    return r.ok
  } catch (err) {
    slogErr('user_delete_error', { user_id: userId, context, error: (err as Error).message })
    return false
  }
}

// If an unconfirmed user with this email exists and has no store, delete it so
// the signup can proceed cleanly. Returns true if we cleared an orphan.
async function clearOrphanIfAny(email: string): Promise<boolean> {
  const existing = await findUserByEmail(email)
  if (!existing) return false
  if (existing.confirmed) return false
  const hasStore = await userHasStore(existing.id)
  if (hasStore) return false
  slog('orphan_detected', { user_id: existing.id, email: maskEmail(email) })
  return await deleteUser(existing.id, 'preflight_orphan')
}

// ---------- Supabase admin: generate auth action link ----------
async function generateLink(params: {
  type: AuthEmailType
  email: string
  password?: string
  redirectTo?: string
  metadata?: Record<string, unknown>
}): Promise<{ actionLink?: string; userId?: string; error?: string; alreadyRegistered?: boolean }> {
  const body: Record<string, unknown> = {
    type: params.type,
    email: params.email,
  }
  if (params.type === 'signup') {
    body.password = params.password
    if (params.metadata) body.data = params.metadata
  }
  if (params.redirectTo) {
    body.options = { redirect_to: params.redirectTo }
  }

  const res = await adminFetch(`/auth/v1/admin/generate_link`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = (data?.msg || data?.error_description || data?.error || '').toString().toLowerCase()
    if (msg.includes('already') && msg.includes('registered')) {
      return { alreadyRegistered: true, error: 'Este email já está cadastrado' }
    }
    return { error: data?.msg || data?.error_description || data?.error || 'Falha ao gerar link' }
  }

  const actionLink = data?.action_link || data?.properties?.action_link
  const userId = data?.user?.id || data?.id
  if (!actionLink) return { error: 'Link de ação não retornado' }
  return { actionLink, userId }
}


// ---------- Resend send ----------
async function sendViaResend(to: string, subject: string, html: string): Promise<{ error?: string }> {
  if (!LOVABLE_API_KEY) return { error: 'LOVABLE_API_KEY não configurada' }
  if (!RESEND_API_KEY) return { error: 'RESEND_API_KEY não configurada' }

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': RESEND_API_KEY,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return { error: `Resend falhou (${res.status}): ${text}` }
  }
  return {}
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  try {
    const payload = await req.json().catch(() => null)
    if (!payload) return jsonResponse({ success: false, error: 'Corpo inválido' }, 400)

    const type = payload.type as AuthEmailType
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
    const password = typeof payload.password === 'string' ? payload.password : undefined
    const redirectTo = typeof payload.redirect_to === 'string' ? payload.redirect_to : undefined
    const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : undefined

    // Validation
    if (type !== 'signup' && type !== 'recovery') {
      return jsonResponse({ success: false, error: 'Tipo inválido' }, 400)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ success: false, error: 'Email inválido' }, 400)
    }
    if (type === 'signup' && (!password || password.length < 6)) {
      return jsonResponse({ success: false, error: 'Senha deve ter pelo menos 6 caracteres' }, 400)
    }

    // Rate limit: prevent signup spam, email flooding and pre-registration abuse.
    // Two windows: per-IP (broad) and per-email (targeted). Both must pass.
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon'
    const rlEndpoint = `send-auth-email:${type}`
    async function rl(id: string, max: number, minutes: number): Promise<boolean> {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_rate_limit`, {
          method: 'POST',
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            p_identifier: id,
            p_endpoint: rlEndpoint,
            p_max_requests: max,
            p_window_minutes: minutes,
          }),
        })
        if (!r.ok) return true
        const j = await r.json()
        return !!j?.allowed
      } catch {
        return true
      }
    }
    // 20/hour per IP, 3/hour per email address
    const [ipOk, emailOk] = await Promise.all([
      rl(`ip:${ip}`, 20, 60),
      rl(`email:${email}`, 3, 60),
    ])
    if (!ipOk || !emailOk) {
      slogErr('rate_limited', { ip, email: maskEmail(email), type, ipOk, emailOk })
      return jsonResponse(
        { success: false, error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
        429,
      )
    }

    slog('request_received', { type, email: maskEmail(email), ip })

    // For signup, proactively clear an orphan (unconfirmed + no store) so the
    // user isn't blocked by a previous failed attempt with the same email.
    if (type === 'signup') {
      const cleared = await clearOrphanIfAny(email)
      if (cleared) slog('preflight_orphan_cleared', { email: maskEmail(email) })
    }

    const linkResult = await generateLink({ type, email, password, redirectTo, metadata })

    if (linkResult.alreadyRegistered) {
      slog('already_registered', { type, email: maskEmail(email) })
      // This is a user-facing validation state, not an operational function error.
      // Return 200 so the app can render the inline/toast message without the
      // preview/runtime treating the invocation as a crashing Edge Function error.
      return jsonResponse({ success: false, alreadyRegistered: true, error: linkResult.error })
    }
    if (linkResult.error || !linkResult.actionLink) {
      slogErr('generate_link_failed', { type, email: maskEmail(email), error: linkResult.error, had_user_id: !!linkResult.userId })
      // If the user was created but link generation partially failed, clean up
      // so the email isn't left in a limbo state for the next attempt.
      if (type === 'signup' && linkResult.userId) {
        await deleteUser(linkResult.userId, 'rollback_generate_link')
      }
      // For recovery, do not leak whether the email exists
      if (type === 'recovery') return jsonResponse({ success: true })
      return jsonResponse({ success: false, error: linkResult.error || 'Falha ao gerar link' }, 400)
    }

    if (type === 'signup' && linkResult.userId) {
      slog('user_created', { user_id: linkResult.userId, email: maskEmail(email) })
    }

    const { subject, html } = buildEmail(type, linkResult.actionLink)
    const sendResult = await sendViaResend(email, subject, html)

    if (sendResult.error) {
      slogErr('resend_failed', { type, email: maskEmail(email), error: sendResult.error })
      // Rollback the just-created user so a retry doesn't hit "already registered".
      if (type === 'signup' && linkResult.userId) {
        await deleteUser(linkResult.userId, 'rollback_resend_failure')
      }
      return jsonResponse({ success: false, error: 'Falha ao enviar o email. Tente novamente.' }, 502)
    }

    slog('email_sent', { type, email: maskEmail(email), user_id: linkResult.userId })
    return jsonResponse({ success: true, userId: linkResult.userId })

  } catch (err) {
    slogErr('crashed', { error: (err as Error).message })
    return jsonResponse({ success: false, error: 'Erro interno' }, 500)
  }
})
