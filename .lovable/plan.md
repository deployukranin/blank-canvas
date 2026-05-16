## Objetivo

Cada loja ganha seu próprio programa de afiliados. **Clientes** da loja ativam modo afiliado (opt-in livre), recebem link único, e ganham comissão sobre **customs pagos** e **assinaturas VIP** originadas pelo link. O **dono da loja** define todas as regras (% comissão, duração do cookie, valor mínimo de saque, carência) e paga manualmente cada solicitação fora da plataforma (PIX/transferência).

Importante: é **independente** do referral loja→loja (`referral_commissions`), que continua existindo só para indicação entre criadores.

## Modelo

- **Quem indica:** qualquer cliente cadastrado na loja (`store_users`). Opt-in pelo próprio cliente em `/:slug/affiliate`.
- **O que gera comissão:** pedidos customs pagos (PIX + Stripe) e **primeira** mensalidade VIP. Recorrência VIP fica fora desta fase.
- **Atribuição:** link `?aff=CODE` → grava cookie `aff_<storeId>` com TTL definido pelo dono (default 30 dias). Última atribuição vence (last-click).
- **Comissão:** % configurado pelo dono por loja, aplicado sobre valor bruto pago.
- **Carência:** dias após pagamento para virar `available` (default 14d, dono ajusta). Refund/chargeback cancela.
- **Saque:** afiliado solicita quando saldo `available ≥ min_payout_cents`. Dono vê pedido em `/:slug/admin/affiliates`, paga fora da plataforma, marca como pago com observação.

## Banco

1. **`stores`**: nada novo (config fica em `app_configurations`).
2. **`app_configurations`** novo `config_key = 'affiliate_config'` por `store_id`:
   ```
   { enabled: bool, commission_percent: int, cookie_days: int,
     holding_days: int, min_payout_cents: int, rules_md: string }
   ```
3. **`store_affiliates`** (cliente afiliado em uma loja):
   - `store_id`, `user_id`, `code` (6 chars único por loja), `status` (`active`|`banned`), timestamps.
   - Unique `(store_id, user_id)` e `(store_id, code)`.
4. **`affiliate_attributions`** (clique/atribuição):
   - `store_id`, `affiliate_id`, `visitor_id` (cookie anon) opcional, `user_id` opcional (preenchido no login/signup), `expires_at`.
5. **`affiliate_commissions`**:
   - `store_id`, `affiliate_id`, `source_type` (`custom_order`|`vip_subscription`), `source_id`, `base_amount_cents`, `commission_percent`, `commission_cents`, `status` (`pending`|`available`|`paid`|`cancelled`), `eligible_at`, `paid_at`, `paid_by_user_id`, `payment_note`, `cancel_reason`, `payout_request_id` (nullable).
   - Unique `(source_type, source_id)` — uma comissão por venda.
6. **`affiliate_payouts`** (solicitações de saque):
   - `store_id`, `affiliate_id`, `amount_cents`, `status` (`requested`|`paid`|`rejected`), `requested_at`, `paid_at`, `paid_by_user_id`, `note`, `reject_reason`.
7. **`custom_orders`**: adicionar `affiliate_id uuid null` (gravado no momento da criação a partir do cookie).
8. **`vip_subscriptions`**: adicionar `affiliate_id uuid null` idem.
9. **RLS:**
   - Afiliado vê apenas suas próprias linhas (`affiliate_id` em `store_affiliates` do user).
   - Dono/admin da loja vê tudo da sua loja.
   - Super admin tudo.
   - Service role escreve comissões e atribuições.
10. **Função** `affiliate_mark_eligible()` cron-diária: `pending` → `available` quando `eligible_at <= now()` e venda não foi reembolsada.

## Edge functions

Novas:
- **`affiliate-validate`** (público GET `?store_id&code`) — valida code, retorna nome do afiliado p/ banner.
- **`affiliate-track`** (público POST) — registra clique e retorna cookie (server-side fallback; cliente também grava localmente).
- **`affiliate-request-payout`** (auth, cliente) — cria `affiliate_payouts` se saldo `available ≥ min`.
- **`store-affiliate-admin`** (auth, dono/admin) — actions: `list_affiliates`, `list_commissions`, `list_payouts`, `mark_payout_paid`, `reject_payout`, `cancel_commission`, `ban_affiliate`, `update_config`.

Editar:
- **`create-pix-charge`** + **`stripe-create-checkout`** + **`create-vip-charge`**: aceitar `affiliate_code` (lido do cookie no front), resolver `affiliate_id` e gravar no pedido/assinatura.
- **`stripe-webhook`** + **`platform-subscription-webhook`** (e PIX webhook): no `paid`, se `affiliate_id` presente e `affiliate_config.enabled`, inserir `affiliate_commissions` com `eligible_at = paid_at + holding_days`. No `refund`/`chargeback`, marcar comissão como `cancelled`.

Cron: chamar `affiliate_mark_eligible()` 1×/dia.

## Frontend

### Cliente
- **`/:slug/affiliate`** — página única:
  - Se não-afiliado: card "Vire afiliado", botão Ativar (cria `store_affiliates`).
  - Se afiliado: link `https://<domínio>/<slug>?aff=CODE` + copiar/QR, regras da loja (`rules_md`), saldo (pending/available/paid), histórico de comissões, botão **Solicitar saque** (desabilitado abaixo do mínimo), histórico de saques.
- **Captura do cookie:** hook `use-affiliate-capture` (espelho do `use-referral-code`) que lê `?aff` em qualquer rota `/:slug/*`, valida e grava em `localStorage` com TTL.
- **Checkout (Customs/VIP):** ler cookie e enviar `affiliate_code` ao criar charge.
- Item "Afiliados" no menu cliente (`/:slug` layout).

### Dono da loja
- **`/:slug/admin/affiliates`** com abas:
  1. **Configuração** — switch enabled, % comissão, cookie days, holding days, mínimo de saque, texto livre de regras.
  2. **Afiliados** — lista de clientes afiliados, total vendido, comissões, ações banir/reativar.
  3. **Comissões** — filtros por status, ver venda origem.
  4. **Saques** — solicitações pendentes com **Marcar como pago** (modal com observação/comprovante) e **Rejeitar** (motivo).
- Item "Afiliados" no `AdminLayout`.

### Super admin
- Adicionar contador "Afiliados ativos" no dashboard da loja (opcional, fase 2).

## Antifraude

- Carência configurável antes de virar pagável.
- Cancelamento automático no refund/chargeback Stripe.
- Unique `(source_type, source_id)` em comissões — 1 por venda.
- Auto-compra bloqueada: se `auth.uid()` do comprador == `user_id` do afiliado, não cria comissão.
- Pagamento sempre manual pelo dono — ele revisa antes de pagar.

## Arquivos

**Criar**
- `supabase/functions/affiliate-validate/index.ts`
- `supabase/functions/affiliate-track/index.ts`
- `supabase/functions/affiliate-request-payout/index.ts`
- `supabase/functions/store-affiliate-admin/index.ts`
- `src/pages/ClientAffiliate.tsx` (rota `/:slug/affiliate`)
- `src/pages/admin/AdminAffiliates.tsx` (rota `/:slug/admin/affiliates`)
- `src/hooks/use-affiliate-capture.ts`
- `src/hooks/use-affiliate-config.ts`

**Editar**
- `supabase/functions/create-pix-charge/index.ts`
- `supabase/functions/stripe-create-checkout/index.ts`
- `supabase/functions/create-vip-charge/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `src/App.tsx` (rotas)
- `src/pages/admin/AdminLayout.tsx` (menu)
- Layout cliente da loja (menu)
- `src/pages/Customs.tsx` + fluxo VIP (passar `affiliate_code`)

## Fora de escopo (fase 2)

- Comissão recorrente em renovações VIP.
- Multi-níveis / sub-afiliados.
- Saque automático via Stripe Connect Transfers.
- Notificação por email/push ao afiliado quando comissão libera.
- Dashboard público top-afiliados da loja.
