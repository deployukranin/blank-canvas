# Auditoria de Segurança & Hardening para Produção

Objetivo: elevar o projeto a nível de produção SaaS (OWASP ASVS L2+) sem alterar UX, UI ou funcionalidades. Trabalho feito em **fases sequenciais**, cada uma com diagnóstico → correção → verificação → documentação.

## Fase 0 — Descoberta (read-only)

Levantamento completo antes de qualquer alteração:

- **Backend:** ler todas as edge functions (`supabase/functions/*`), mapear autenticação, validação de input, CORS, tratamento de erro, uso de service role.
- **DB:** rodar `supabase--linter`, revisar RLS/GRANTs em todas as tabelas, funções `SECURITY DEFINER`, triggers, views.
- **Frontend:** procurar `console.log`, secrets, `dangerouslySetInnerHTML`, uso de `window.location`/redirects, storage de tokens.
- **Infra:** `index.html`, `vercel.json`, `public/sw.js`, `manifest.json`, `vite.config.ts`, `.env`.
- **Deps:** `code--dependency_scan` + `bun audit` para CVEs.
- **Storage:** listar buckets, policies, MIME/size limits.
- **Scans:** `security--get_scan_results` + `security--run_security_scan`.

Entregável: inventário de findings classificados **CRÍTICA / ALTA / MÉDIA / BAIXA / INFO**.

## Fase 1 — Autenticação & Sessão

- Revisar `AuthContext`, `send-auth-email`, `ClientAuth`, `SuperAdminLogin`, reset de senha.
- Validar: expiração de token de recuperação, replay, enumeração de usuário (mensagens genéricas), rate-limit em login/signup/reset (usar `check_rate_limit` já existente), lockout progressivo.
- Garantir `getClaims`/`getUser` server-side em todas edge functions (não confiar em `user_id` do body).
- Verificar que logout limpa sessão e SW cache sensível.

## Fase 2 — Autorização, RBAC & Multi-tenant

- Varredura de **todos** os endpoints (edge functions + RPC): cada um deve validar `has_role`/ownership antes de ler/escrever.
- Auditar isolamento por `store_id`/`tracker_id`/`user_id` nas RLS de: `stores`, `custom_orders`, `vip_subscriptions`, `store_users`, `tracker_*`, `affiliate_*`, `support_*`, `video_*`, `feed_posts`, `app_configurations`.
- Testar IDOR: cliente A não pode ler/alterar recursos de cliente B; tracker A não vê dados de tracker B; store admin não vê outra store.
- Confirmar que rotas frontend protegidas (`AdminRoute`, `SuperAdminRoute`, `PartnerRoute`) têm equivalente backend — frontend nunca é fonte de verdade.

## Fase 3 — Banco de dados & Supabase

- Rodar linter, corrigir findings acionáveis.
- Todas as tabelas em `public` com RLS ligada + policies + GRANTs corretos (sem `anon` onde não é intencional).
- Revisar `SECURITY DEFINER` funcs: `search_path` fixo, sem SQL dinâmico, validação de `auth.uid()`.
- Constraints/checks para invariantes (preços ≥ mínimo, status em enum válido).
- Verificar que nenhuma view exponha colunas sensíveis (`stripe_account_id`, `password_hash`, emails).

## Fase 4 — Pagamentos (Stripe)

- `stripe-webhook`: assinatura HMAC obrigatória (falhar se secret ausente em prod), tolerância de timestamp, idempotência via `event.id`.
- `stripe-create-checkout` e `create-pix-charge` / `create-vip-charge`: preço/plano **sempre** do servidor a partir de `product_id` autoritativo, nunca do body.
- Validar `store_id` pertence a criador legítimo; validar `success_url`/`cancel_url` contra allowlist de origens.
- `platform-subscription-webhook`: idempotência + signature.

## Fase 5 — Edge Functions Hardening

Para cada função em `supabase/functions/*`:
- CORS restrito a allowlist de origens (preview + prod + custom domains) — remover `*`.
- Validação Zod de body/query/headers, limites de tamanho.
- Rate-limit via `check_rate_limit` nos endpoints críticos (login, signup, reset, checkout, upload, webhooks públicos, tracker-click).
- Erros genéricos ao cliente + log estruturado sem PII/secret.
- Nunca retornar `SUPABASE_SERVICE_ROLE_KEY` ou stack trace.
- Confirmar uso de `verify_jwt = false` só onde intencional (webhooks/públicos).

## Fase 6 — Headers HTTP & CSP

Adicionar em `vercel.json` (via `headers`) e `index.html` (meta fallback):

- `Content-Security-Policy` restritiva: `default-src 'self'`; permitir apenas Supabase (`*.supabase.co`), Stripe (`js.stripe.com`, `api.stripe.com`, `hooks.stripe.com`), YouTube (`www.youtube.com`, `i.ytimg.com`), Google Fonts (se usado), self para img/media. Remover `unsafe-inline`/`unsafe-eval` — se conflitar com Vite/inline styles, usar nonces ou `strict-dynamic`.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY` + `frame-ancestors 'none'` no CSP
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` mínima (bloquear camera/mic/geo salvo onde usado)
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-site`
- `Origin-Agent-Cluster: ?1`
- `Cache-Control: no-store` em rotas autenticadas (via SW/response headers)

## Fase 7 — Service Worker & Cache

Revisar `public/sw.js`:
- Nunca cachear respostas de `*.supabase.co`, edge functions, `/admin*`, `/vip`, `/auth*`, `/checkout*`.
- Versionamento por hash de build, `skipWaiting` + limpeza de caches antigos.
- Bypass total para requests com `Authorization` header.

## Fase 8 — Input Validation & Uploads

- Adicionar Zod em toda edge function que recebe body.
- Buckets de upload (`banners`, `vip-media`, `payment-proofs`, `email-assets`, `media-previews`): validar MIME + magic bytes server-side via edge function proxy (não upload direto), renomear com UUID, limite de tamanho.
- Bloquear `text/html`, `image/svg+xml`, `application/javascript` em buckets de imagem.
- URLs assinadas curtas (5-15min) para buckets privados.

## Fase 9 — Frontend Hygiene

- Remover `console.log` de código de produção (manter `console.error`), desativar source maps em prod (`build.sourcemap: false` em `vite.config.ts`).
- Garantir `.env` só contém `VITE_SUPABASE_*` publishable.
- Sem secrets, URLs internas, TODO/FIXME sensíveis no bundle.
- Redirects (`window.location.href`, router) com validação contra open-redirect (allowlist de paths internos).
- Sanitizar qualquer render de HTML do banco (`DOMPurify`).

## Fase 10 — Deps, DNS, Emails

- `code--dependency_scan` → atualizar CVEs críticas/altas para versões estáveis compatíveis.
- Documentar (não executar) checklist DNS: DNSSEC, CAA, SPF, DKIM, DMARC (`p=quarantine` → `reject`) — depende do usuário no registrar/SES.
- `send-auth-email`: header injection check no `to` e `subject`.

## Fase 11 — Verificação & Relatório

Depois de cada fase:
- Rodar `supabase--linter` e `security--run_security_scan`.
- Smoke test via Playwright em fluxos-chave (login CEO, login tracker, signup criador, checkout PIX, webhook Stripe simulado).
- Marcar findings como `mark_as_fixed` ou `ignore` com justificativa.
- Atualizar `security-memory`.

## Entregável final

Relatório único no chat contendo:
- Resumo executivo
- Tabelas de arquivos analisados/modificados
- Findings por severidade (antes → depois)
- Correções aplicadas por fase
- Pendências dependentes de terceiros (Vercel/DNS/Stripe/SES/Supabase/domínio)
- Checklists OWASP Top 10, ASVS L2, produção
- **Nota 0-100** com justificativa e ações restantes para "excelente"

## Regras aplicadas em todo trabalho

- Ler arquivo inteiro antes de editar; nenhuma suposição.
- Zero mudança de UX/UI/comportamento.
- Cada alteração acompanhada de justificativa (risco → mitigação).
- Edits pequenos, focados; rollback fácil.
- Nada de novas features.

## Ordem de execução

Fases 0 → 11 sequenciais. Dentro de cada fase, edits paralelos quando independentes. Aguardo aprovação para iniciar pela Fase 0.
