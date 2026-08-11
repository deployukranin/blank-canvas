# Auditoria de segurança das Edge Functions (OpenGrep)

Objetivo: confirmar quais findings do OpenGrep são vulnerabilidades reais e corrigir apenas essas, sem alterações em massa e sem enfraquecer RLS, webhooks ou funcionalidades.

## Estado já verificado agora (leituras feitas neste turno)

- 35 funções em `supabase/functions`. 33 usam `SUPABASE_SERVICE_ROLE_KEY`; `drive-media` não usa.
- Funções privilegiadas de usuário verificadas com identidade real do token (`getClaims` ou `/auth/v1/user`) e checagem de posse por loja (`created_by` / `store_admins` / `user_roles`): `save-app-config`, `manage-domain`, `drive-sign`, `drive-upload`, `store-affiliate-admin`, `youtube-channel-metrics`, `platform-subscription-checkout`, `super-admin-manage-store`.
- `super-admin-*` verificadas até aqui (`metrics`, `list-clients`, `referrals`, `trackers`) consultam `user_roles` com role `super_admin` no banco após identificar o usuário pelo token; nenhuma aceita role vinda do body.
- `affiliate-request-payout` resolve o afiliado por `user_id = token.sub` + `store_id` e calcula o valor somando comissões no servidor — o cliente não envia valor.
- `create-pix-charge` resolve o preço apenas da configuração da loja no servidor, com teto máximo; ignora valor do cliente.
- Rotinas internas: `cleanup-expired-stores` e `cleanup-orphan-users` exigem `x-cron-secret` igual ao `CRON_SECRET` e recusam execução se o segredo não estiver configurado. `cleanup-orphan-signup` é anônima por design, com rate limit por IP, e só apaga contas não confirmadas sem loja.
- `tracker-convert` é endpoint público de atribuição, com rate limit por IP+código e, quando há JWT, ignora dados enviados pelo cliente.

Isso é ponto de partida. O diagnóstico definitivo de cada item faz parte do trabalho abaixo — nada será alterado sem antes ser confirmado no código.

## O que será feito

### 1. Service role e autorização (Prioridades 1, 4)
- Ler integralmente as funções ainda não auditadas em profundidade: `export-metrics`, `super-admin-manage-partners`, `create-vip-charge`, `stripe-connect-onboarding`, `stripe-connect-status`, `partner-dashboard`, `tracker-portal`, `tracker-dashboard`, `tracker-click`, `youtube-videos`, `referral-validate`, `affiliate-validate`, `csp-report`, `drive-media`, `send-auth-email`.
- Para cada uma: valida o token de fato? extrai o usuário do token? consulta role em fonte confiável? exige `super_admin` onde precisa? devolve 401 sem sessão e 403 sem permissão?
- Corrigir apenas onde faltar etapa real.

### 2. IDOR / isolamento entre lojas (Prioridade 2)
- Rastrear todo id vindo do cliente (`store_id`, `order_id`, `ticket_id`, `subscription_id`, `file_id`, `tracker_id`, `payout_id`) até a operação que o usa e confirmar cruzamento com a identidade do chamador antes da operação privilegiada.
- Onde faltar, adicionar a checagem de posse antes da query — sem depender de UUID imprevisível.

### 3. Operações destrutivas (Prioridades 3, 6)
- Revisar cada cascata de DELETE sobre `stores` e tabelas associadas: exige autenticação, identidade, autorização e posse da loja específica antes de qualquer exclusão.
- Confirmar que o segredo de cron é comparado server-side e que a rotina aborta antes do primeiro DELETE quando ausente.

### 4. Campos sensíveis do cliente (Prioridade 5)
- Conferir cada uso de `price`, `amount`, `plan_type`, `status`, `role`, `paid` recebido no body e garantir resolução server-side a partir de configuração confiável ou rejeição.
- Foco em `create-vip-charge`, `platform-subscription-checkout`, `super-admin-manage-store` (`plan_type`), webhooks de assinatura.

### 5. Webhooks (Prioridades 1, 8)
- Confirmar verificação de assinatura e proteção contra replay em `stripe-webhook` e `platform-subscription-webhook`. Não alterar autenticação de webhook legítimo.

### 6. RLS (Prioridade 7)
- Extrair policies das tabelas usadas por essas funções e revisar por comando e por role. Policies `true` restritas a service role ou contexto legítimo permanecem; policies amplas para `anon`/`authenticated` sobre dados privados são corrigidas com escopo. RLS não será desabilitada.

### 7. CORS (Prioridade 8)
- Classificar cada função (frontend, webhook, público, cron, administrativo) e restringir `Access-Control-Allow-Origin` aos domínios oficiais apenas onde for compatível — endpoints administrativos e de painel primeiro. CORS não é tratado como autenticação.

### 8. Verificação
- Percorrer os cenários A–F (sem auth, usuário comum em função admin, usuário A vs B, loja A vs loja B, manipulação de preço/plano/status, rotina destrutiva sem credencial) contra o código final.
- Rodar build, typecheck e os testes existentes, incluindo `supabase/functions/_security_tests/policies_test.ts`.

## Relatório final

Tabela por função: `Usa service_role | Auth validada | Autorização validada | Ownership validado | Operação privilegiada | Vulnerabilidade | Correção`, seguida das seções CRÍTICO / ALTO / MÉDIO / FALSO POSITIVO e do número de vulnerabilidades confirmadas (não o número bruto de findings).

## Restrições respeitadas

Sem remover service role por causa do scanner, sem mover lógica privilegiada para o frontend, sem desabilitar RLS, sem policies universais, sem confiar em id ou role do cliente, sem tocar em webhooks legítimos. Correções incrementais, funcionalidades preservadas.
