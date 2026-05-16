## Objetivo

Permitir que o admin-master crie sub-contas com cargo **Parceiro**. Cada parceiro:
- Vê apenas as lojas atribuídas a ele.
- Vê receita/comissão estimada dessas lojas.
- Não vê outras lojas nem dados do restante da plataforma.

O admin-master pode criar parceiros, atribuir lojas e desatribuir.

## Banco de dados (migration)

1. Adicionar valor `partner` ao enum `app_role`.
2. Adicionar coluna `partner_id uuid` em `stores` (nullable, índice).
3. RLS em `stores`:
   - Nova policy SELECT: parceiro vê linhas onde `partner_id = auth.uid()`.
4. RLS em `vip_subscriptions`:
   - Nova policy SELECT: parceiro vê assinaturas das lojas atribuídas (subselect em `stores`).
5. Função RPC `assign_store_partner(store_id, partner_user_id)` — só super_admin.

## Edge Functions

**`super-admin-manage-partners`** (POST, super_admin):
- `action: "list"` → parceiros com email, criado_em, contagem de lojas, receita_total_cents.
- `action: "create"` → cria user via `auth.admin.createUser` (email_confirm: true) + insere role `partner`.
- `action: "delete"` → desatribui lojas + remove role + apaga user.
- `action: "assign"` / `"unassign"` → atualiza `stores.partner_id`.

**`partner-dashboard`** (GET, role `partner`):
- Retorna lojas atribuídas (id, name, slug, plan_type, status, vip_active_count, revenue_cents_30d).
- Validação via `auth.getClaims(token)` + checa role `partner`.

## Frontend

**Nova página `/admin-master/partners`** (`SuperAdminPartners.tsx`):
- Lista de parceiros (card com email, nº lojas, receita).
- Botão "Criar parceiro" → modal com email + senha temporária.
- Expandir parceiro → lista lojas atribuídas + botão remover.
- Botão "Atribuir loja" → dropdown com lojas sem parceiro.

**Nova página `/partner`** (`PartnerDashboard.tsx`):
- Acessível a usuários com role `partner`.
- Mostra resumo (lojas, receita 30d, total clientes pagantes).
- Lista de lojas atribuídas com métricas.
- Header com logout.

**Roteamento e guards**:
- `App.tsx`: rotas `/admin-master/partners` e `/partner`.
- Novo `PartnerRoute.tsx` (similar a `SuperAdminRoute`).
- `SuperAdminLogin`: ao logar, se role = `partner`, redirecionar para `/partner` em vez de `/admin-master`.
- `SuperAdminLayout`: novo item de menu "Parceiros".

## Arquivos

Criar:
- `supabase/functions/super-admin-manage-partners/index.ts`
- `supabase/functions/partner-dashboard/index.ts`
- `src/pages/super-admin/SuperAdminPartners.tsx`
- `src/pages/partner/PartnerDashboard.tsx`
- `src/components/auth/PartnerRoute.tsx`

Editar:
- `src/App.tsx` (rotas)
- `src/pages/super-admin/SuperAdminLayout.tsx` (menu)
- `src/pages/super-admin/SuperAdminLogin.tsx` (redirect por role)

## Fora de escopo

- Cadastro de comissão personalizada por parceiro (usa preço bruto da assinatura).
- Convite por email / reset de senha por email (parceiro troca senha no perfil depois).
- Acesso a emails dos clientes finais (parceiro só vê agregados).
