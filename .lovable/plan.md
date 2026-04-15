

# Plano: Hardening de Segurança Completo

Auditoria revelou **5 vulnerabilidades críticas (ERROR)** e **6 avisos (WARN)**. O plano está organizado por prioridade.

---

## Fase 1 — Vulnerabilidades Críticas (RLS)

### 1.1 VIP Subscriptions: Remover INSERT/UPDATE do cliente
Usuários podem criar assinaturas VIP sem pagamento e alterar status/expiração livremente.
- **Remover** as policies "Users can create their own VIP subscriptions" e "Users can update their own VIP subscriptions"
- Criar uma function `SECURITY DEFINER` `create_vip_subscription(p_store_id, p_plan_type, p_price_cents, p_payment_ref)` que valida pagamento antes de inserir
- Somente Edge Functions (via service role) ou essa function poderão criar/atualizar assinaturas

### 1.2 Self-assign client role
Qualquer autenticado pode se dar a role `client` sem restrição.
- **Remover** a policy "Users can assign own client role"
- Mover a atribuição de role `client` para dentro do fluxo de login da loja (`/:slug/login`), via RPC `SECURITY DEFINER` que valida se o usuário está registrado na `store_users`

### 1.3 app_configurations: SELECT muito aberto
A policy `Authenticated users can read configurations` com `USING (true)` expõe configs de todas as lojas.
- **Substituir** por: `USING (store_id IS NULL OR store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid()) OR store_id IN (SELECT store_id FROM store_admins WHERE user_id = auth.uid()))`
- Isso limita configs de loja apenas aos membros/admins daquela loja

### 1.4 Realtime Channel Authorization
Tabelas `vip_content`, `support_messages`, `order_messages` publicadas em Realtime sem controle de canal.
- Adicionar policies na tabela `realtime.messages` para restringir canais por `auth.uid()` e tópico
- Nota: isso requer verificação se o projeto usa Realtime Broadcast ou só postgres_changes (que já respeitam RLS de tabela)

### 1.5 Stripe Account ID exposto publicamente
A tabela `stores` expõe `stripe_account_id` para anon/public.
- Criar uma VIEW `public.stores_public` sem a coluna `stripe_account_id`
- Ou criar uma policy mais restritiva que exclua essa coluna (via view)
- Atualizar o frontend para usar a view nas queries públicas

---

## Fase 2 — Edge Functions: Migrar getUser → getClaims

7 de 8 Edge Functions usam `auth.getUser()` (roundtrip ao servidor) em vez de `auth.getClaims(token)` (validação local). Migrar:
- `create-vip-charge`
- `create-pix-charge`
- `export-metrics`
- `stripe-connect-status`
- `stripe-connect-onboarding`
- `manage-domain`
- `super-admin-metrics`
- `super-admin-manage-store`

Padrão correto:
```typescript
const token = authHeader.replace('Bearer ', '');
const { data, error } = await supabase.auth.getClaims(token);
const userId = data.claims.sub;
```

### 2.1 Rate Limiting em Edge Functions críticas
O banco já tem `check_rate_limit()` mas nenhuma Edge Function o usa.
- Adicionar chamada a `check_rate_limit` em: `create-pix-charge` (10 req/h), `create-vip-charge` (10 req/h), `save-app-config` (30 req/h)

### 2.2 cleanup-expired-stores sem autenticação
A Edge Function `cleanup-expired-stores` não valida nenhum header — qualquer pessoa pode chamá-la.
- Adicionar validação de um secret fixo (`CRON_SECRET`) no header, ou validar que o caller é super_admin

---

## Fase 3 — Leaked Password Protection + Storage

### 3.1 Habilitar HIBP (Have I Been Pwned)
- Usar `configure_auth` com `password_hibp_enabled: true`

### 3.2 Public Buckets: Restringir listagem
- Buckets `media-previews` e `banners` permitem listagem de todos os arquivos
- Adicionar policies de SELECT em `storage.objects` que limitem a listagem (ou aceitar o risco, já que são públicos por design)

---

## Fase 4 — Frontend Hardening

### 4.1 Sanitizar dangerouslySetInnerHTML
- `SocialLinksBar.tsx`: SVGs vêm do DB (config admin) — sanitizar com DOMPurify antes de injetar
- `Ajuda.tsx`: Strings i18n são seguras (hardcoded), risco baixo — manter mas documentar

### 4.2 Erro genérico para usuário final
- Auditar `toast.error()` calls que possam expor mensagens técnicas do Supabase
- Substituir por mensagens amigáveis, logando o detalhe técnico apenas no console

---

## Fase 5 — Tabela de Audit Log

Criar tabela `audit_logs` para registrar ações críticas:
- Colunas: `id`, `user_id`, `action`, `target_table`, `target_id`, `metadata (jsonb)`, `created_at`
- RLS: somente super_admin pode ler; INSERT via SECURITY DEFINER function
- Registrar: mudanças de role, exclusão de lojas, alterações de plano, ban/unban de usuários

---

## Resumo de Migrações SQL

1. DROP policies VIP subscriptions INSERT/UPDATE para public
2. DROP policy "Users can assign own client role"
3. CREATE function `create_vip_subscription` (SECURITY DEFINER)
4. CREATE function `assign_client_role` (SECURITY DEFINER)
5. ALTER policy app_configurations authenticated SELECT
6. CREATE VIEW `stores_public` (sem stripe_account_id)
7. CREATE TABLE `audit_logs` + policies
8. Habilitar HIBP via configure_auth

## Arquivos a Editar

- 8 Edge Functions (getClaims migration + rate limiting)
- `src/components/social/SocialLinksBar.tsx` (DOMPurify)
- `src/hooks/use-vip-subscription.ts` (usar RPC em vez de insert direto)
- `src/contexts/TenantContext.tsx` (usar view stores_public)
- Frontend: audit de toast.error para mensagens genéricas

