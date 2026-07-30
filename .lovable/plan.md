# Bloqueio de trial expirado no backend + contador de trial ao vivo

## Objetivo

1. Depois dos 3 dias de trial, a loja não consegue mais executar ações pagas — a regra passa a valer no servidor, não só na interface.
2. O aviso de "trial restante" no painel do criador mostra corretamente 3 dias no início e vai diminuindo sozinho, sem precisar recarregar a página.

## Parte 1 — Regra de expiração no backend

Hoje nenhuma função de pagamento verifica se o trial da loja expirou; só o painel esconde/avisa. Vamos centralizar a regra.

- Novo módulo compartilhado `supabase/functions/_shared/store-plan.ts` com `assertStoreActive(storeId)`:
  - lê `plan_type` e `plan_expires_at` da loja com a chave de serviço;
  - se `plan_type = 'trial'` e `plan_expires_at < now()`, devolve bloqueio;
  - lojas pagas/ativas passam normalmente; loja inexistente é rejeitada.
- Aplicar essa verificação no início de:
  - `create-pix-charge` (cobrança de pedidos custom);
  - `create-vip-charge` (assinatura VIP dos fãs);
  - `stripe-connect-onboarding` e `stripe-connect-status` (conectar conta de recebimento).
  - Resposta padronizada: HTTP 403 com `{ error: "trial_expired", message: "O período de teste desta loja expirou." }`.
- **Não** bloquear `platform-subscription-checkout` / `platform-subscription-webhook`: é justamente por onde o criador contrata o plano e sai do trial.
- Reforço no banco (defesa em profundidade): trigger `BEFORE INSERT` em `custom_orders` e `vip_subscriptions` que rejeita a inserção quando a loja está em trial expirado, para que nem a API direta consiga criar cobrança/assinatura.
- Frontend: tratar o código `trial_expired` nas chamadas de pagamento mostrando um toast com link para a página de planos, em vez de erro genérico.

## Parte 2 — Contador de trial ao vivo

- Novo componente `src/components/tenant/TrialCountdown.tsx`:
  - recebe `plan_type` e `plan_expires_at` do `TenantContext`;
  - calcula o tempo restante arredondando **para cima** (`Math.ceil` em dias), então uma loja recém-criada mostra "3 dias restantes" e não "2";
  - quando falta menos de 24h, exibe horas ("expira em 5 horas");
  - atualiza sozinho com um `setInterval` de 1 minuto (limpo no unmount), então o valor cai de 3 → 2 → 1 → expirado sem recarregar;
  - estado de urgência (destaque vermelho) quando falta 1 dia ou menos, e estado "expirado" com botão para planos.
- Usar esse componente em:
  - `src/pages/admin/AdminDashboard.tsx` (substitui o bloco atual, que usa `differenceInDays` e arredonda para baixo);
  - `src/pages/admin/AdminLayout.tsx` (a faixa de aviso passa a usar o mesmo cálculo);
  - `src/pages/admin/AdminPlanos.tsx` (mostra o mesmo texto junto da data de expiração).
- Traduções em PT/EN/ES para as variações de dias, horas e expirado (`admin.trial.*`).

## Detalhes técnicos

- Helper backend usa `SUPABASE_SERVICE_ROLE_KEY` via Fetch API (sem SDK externo), seguindo o padrão das outras funções.
- Trigger em SQL: função `public.enforce_store_plan_active()` `SECURITY DEFINER` com `search_path = public`, comparando `plan_expires_at < now()` apenas quando `plan_type = 'trial'`.
- O contador usa um único `useEffect` com `setInterval(60_000)` e recalcula a partir de `plan_expires_at`, sem consultar o banco repetidamente.
- Prazo de exclusão pós-expiração continua em 7 dias (`cleanup-expired-stores`), sem alteração.
