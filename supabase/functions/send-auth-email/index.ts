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

// ---------- Supabase admin: generate auth action link ----------
async function generateLink(params: {
  type: AuthEmailType
  email: string
  password?: string
  redirectTo?: string
  metadata?: Record<string, unknown>
}): Promise<{ actionLink?: string; error?: string; alreadyRegistered?: boolean }> {
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

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
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
  if (!actionLink) return { error: 'Link de ação não retornado' }
  return { actionLink }
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

    const linkResult = await generateLink({ type, email, password, redirectTo, metadata })

    if (linkResult.alreadyRegistered) {
      return jsonResponse({ success: false, alreadyRegistered: true, error: linkResult.error }, 409)
    }
    if (linkResult.error || !linkResult.actionLink) {
      console.error('generateLink error:', linkResult.error)
      // For recovery, do not leak whether the email exists
      if (type === 'recovery') return jsonResponse({ success: true })
      return jsonResponse({ success: false, error: linkResult.error || 'Falha ao gerar link' }, 400)
    }

    const { subject, html } = buildEmail(type, linkResult.actionLink)
    const sendResult = await sendViaResend(email, subject, html)

    if (sendResult.error) {
      console.error('Resend error:', sendResult.error)
      return jsonResponse({ success: false, error: 'Falha ao enviar o email. Tente novamente.' }, 502)
    }

    return jsonResponse({ success: true })
  } catch (err) {
    console.error('send-auth-email error:', err)
    return jsonResponse({ success: false, error: 'Erro interno' }, 500)
  }
})
