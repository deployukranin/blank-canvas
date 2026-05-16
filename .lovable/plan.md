## Objetivo

Sistema de indicação loja → loja. Toda loja recebe automaticamente um link único. Quando a loja indicada paga a **primeira mensalidade da plataforma** e completa **30 dias pagante** (carência anti-fraude), o indicador ganha **50% do valor da primeira mensalidade** como comissão.

Pagamento da comissão é **manual** pelo admin-master (PIX/transferência fora do sistema), com registro de status `pending` → `available` → `paid`.

## Modelo (resumo)

- **Quem indica:** toda loja, automaticamente (código gerado no signup).
- **Comissão:** 50% da primeira mensalidade da plataforma paga pela loja indicada.
- **Carência:** 30 dias pagante após o pagamento (proteção contra chargeback/cancelamento).
- **Pagamento ao indicador:** manual, marcado no admin-master.

## Banco de dados (migration)

1. `stores.referral_code text unique` — gerado no signup (6 chars, ex: `A3K9PQ`). Backfill para lojas existentes.
2. `stores.referred_by_store_id uuid` — preenchido no onboarding se houver `?ref=` válido. Trigger impede auto-indicação (`referred_by_store_id != id`).
3. Nova tabela `referral_commissions`:
   - `referrer_store_id` (quem indicou)
   - `referred_store_id` (indicada — unique, 1 comissão por loja)
   - `base_amount_cents` (valor da 1ª mensalidade)
   - `commission_cents` (50% do base)
   - `commission_percent` (snapshot do %)
   - `status` enum: `pending` (aguardando 30d), `available` (pronta para pagar), `paid`, `cancelled` (chargeback/refund)
   - `eligible_at` (paid_at + 30d)
   - `paid_at`, `paid_by_user_id`, `payment_note` (texto livre — comprovante/observação)
   - `triggered_by_payment_ref` (id do evento Stripe que gerou)
4. **RLS:**
   - Dono da loja vê comissões onde `referrer_store_id` está em suas lojas.
   - Super admin vê tudo.
   - Apenas service role escreve.
5. Função `mark_eligible_commissions()` (SQL): muda `pending` → `available` quando `eligible_at <= now()` e a loja indicada ainda está ativa/pagante. Roda via `pg_cron` 1×/dia.
6. Função `generate_referral_code()` para gerar código único (loop até não colidir).

## Edge Functions

### Modificar `platform-subscription-webhook`
Ao confirmar pagamento de mensalidade da plataforma:
- Se é a **primeira** mensalidade paga pela loja (sem comissão prévia) E `referred_by_store_id` está preenchido → inserir `referral_commissions` com `status='pending'`, `eligible_at = now() + 30 days`, `commission_cents = round(amount * 0.5)`.

### Nova `super-admin-referrals` (POST, super_admin)
- `action: "list"` → comissões agrupadas por status, com filtros.
- `action: "mark_paid"` → muda `available` → `paid`, grava `paid_at`, `paid_by_user_id`, `payment_note`.
- `action: "cancel"` → muda para `cancelled` com motivo (uso: chargeback, fraude detectada).
- `action: "summary"` → totais (pendente, disponível, paga no mês).

### Nova `referral-validate` (GET, público)
- Recebe `?code=ABC123` → retorna `{ valid, referrer_store_name }` para mostrar "Você foi indicado por X" no signup.

### Modificar onboarding de criador
- No fluxo de criação de loja: ler `?ref=` da URL (persistido em localStorage até o signup completar), validar via `referral-validate`, gravar `referred_by_store_id` no insert da `stores`.

### Cron job
- `pg_cron` 1×/dia chamando `mark_eligible_commissions()`.

## Frontend

### `/:slug/admin/referrals` (nova página, dono da loja)
- Banner com link de indicação: `https://<domínio>/signup?ref=ABC123` + botão copiar + QR opcional.
- Cards de resumo: total indicados, virou pagante, comissão acumulada, a receber, paga.
- Tabela de indicações: loja indicada (slug ofuscado por privacidade ou só primeira letra + ID), status, valor, data prevista de liberação.
- Item de menu "Indicações" no `AdminLayout`.

### `/admin-master/referrals` (nova página, super admin)
- Abas: **Disponíveis para pagar** | Pendentes (em carência) | Pagas | Canceladas.
- Linha: indicador (loja + email), indicada (loja + email), valor base, comissão, eligible_at, ações.
- Botão **"Marcar como paga"** → modal com campo de observação/comprovante PIX → confirma.
- Botão **"Cancelar"** → modal com motivo.
- Item de menu "Indicações" no `SuperAdminLayout`.

### `/signup?ref=ABC123`
- Componente lê `ref` da URL → valida → mostra banner "🎁 Você foi indicado por **X**" → persiste em `sessionStorage` até completar o onboarding.

## Anti-fraude (implementado)

1. **Carência de 30 dias** antes de virar pagável.
2. **Trigger DB** impede auto-indicação.
3. **Unique constraint** em `referred_store_id` (1 comissão por loja indicada).
4. **Cancelamento automático** se loja indicada faz refund/chargeback no webhook do Stripe.
5. **Pagamento manual** pelo admin-master — você revisa cada caso antes de pagar.
6. **Reaproveitar `invite_codes`?** Não nesta fase — referral é um sistema paralelo. Reavaliar depois.

## Arquivos

Criar:
- `supabase/functions/super-admin-referrals/index.ts`
- `supabase/functions/referral-validate/index.ts`
- `src/pages/admin/AdminReferrals.tsx`
- `src/pages/super-admin/SuperAdminReferrals.tsx`
- `src/hooks/use-referral-code.ts` (lê `?ref` e persiste)

Editar:
- `supabase/functions/platform-subscription-webhook/index.ts` (criar comissão)
- Onboarding do criador (gravar `referred_by_store_id`)
- `src/App.tsx` (rotas)
- `src/pages/admin/AdminLayout.tsx` e `SuperAdminLayout.tsx` (menu)

## Fora de escopo (fase 2)

- Pagamento automático via Stripe Connect Transfers.
- Comissão recorrente / multi-níveis (MLM).
- Notificação por email ao indicador quando a comissão fica disponível.
- Dashboard público de top indicadores.
- Saque solicitado pelo indicador (por ora, super admin decide quando pagar).
