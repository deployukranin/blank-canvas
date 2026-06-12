## Objetivo

Trackers (usuários com a role `tracker`, que não são o CEO/super_admin) passam a ter, dentro de `/admin-master`, as mesmas páginas do CEO — **tenants, clients, partners, referrals, ranking, support** — porém com **dados 100% isolados**: só aparece o que veio do cadastro atribuído àquele tracker. A criação de links de trackeamento ("Meus links de trackeamento") deixa de ficar com o tracker e passa a ser administrada **somente pela página do CEO**.

## Regra de atribuição (isolamento)

O que define o vínculo é o **cadastro**: quando alguém acessa via um link de tracking do tracker e se cadastra, isso gera um registro em `tracker_conversions`:
- `type = 'store_signup'` → grava `store_id` (loja atribuída ao tracker)
- `type = 'client_signup'` → grava `subject_id`/`email` (cliente atribuído ao tracker)

A partir disso, o "universo" de um tracker é o **conjunto de `store_id`** atribuídos a ele. Todas as páginas filtram por esse conjunto:

```text
tracker (owner_user_id)
   └── tracker_conversions (store_signup) ── store_id ──┐
                                                        ├─► conjunto de lojas do tracker
   └── tracker_conversions (client_signup) ── store_id ┘
        ↓
  tenants    = essas lojas
  clients    = store_users dessas lojas
  partners   = partners vinculados a essas lojas
  referrals  = referral_commissions dessas lojas
  ranking    = ranking só dessas lojas
  support    = support_tickets dessas lojas
```

## Mudanças

### 1. Backend — Edge Function de portal isolado do tracker
Criar uma edge function `tracker-portal` (service role, Fetch API, valida sessão via `auth.getClaims`/endpoint `/auth/v1/user` como nas demais) com um parâmetro `section`:
- Resolve o tracker pelo usuário logado (`trackers.owner_user_id = uid`).
- Calcula o conjunto de `store_id` atribuídos (via `tracker_conversions`).
- Retorna, conforme `section`:
  - `tenants` → as lojas (de `stores`) desse conjunto.
  - `clients` → `store_users` (com perfis/emails) dessas lojas.
  - `partners` → partners (`stores.partner_id` + dados do parceiro) dessas lojas.
  - `referrals` → `referral_commissions` dessas lojas.
  - `ranking` → ranking (clientes + receita) só dessas lojas.
  - `support` → `support_tickets` (+ contagem de mensagens) dessas lojas.
- Se o conjunto de lojas for vazio, retorna listas vazias.

### 2. Frontend — páginas que se adaptam à role
Para cada rota abaixo, exibir a versão do CEO quando `super_admin`, e a versão isolada (consumindo `tracker-portal`) quando `tracker`:
- `/admin-master/tenants`
- `/admin-master/clients`
- `/admin-master/partners`
- `/admin-master/referrals`
- `/admin-master/ranking`
- `/admin-master/support`

Implementação: trocar o guard dessas rotas de `SuperAdminRoute` para `AdminMasterRoute` (que aceita `super_admin` ou `tracker`) e, dentro de cada página, ramificar por role — o CEO mantém o componente atual; o tracker recebe uma versão somente-leitura alimentada pela edge function. As páginas reusam o `SuperAdminLayout` e o visual existente (GlassCard, tabelas).

### 3. Menu lateral do tracker (`SuperAdminLayout`)
Hoje o tracker só vê "Tracking". Passar a mostrar para o tracker:
- Dashboard (`/admin-master`), Tenants, Clients, Partners, Referrals, Ranking, Support.
- **Não** mostrar para o tracker: Tracking (gestão de links), Plans, Settings — essas continuam exclusivas do CEO.

### 4. Links de trackeamento → somente CEO
- No `TrackerDashboard` (dashboard do tracker em `/admin-master`): remover o criador de links e o botão de excluir; a seção "Meus links de trackeamento" fica **somente leitura** (lista + copiar URL), pois quem cria/edita/exclui é o CEO.
- A criação/edição de links permanece (e é reforçada) na página do CEO `/admin-master/tracking` (`SuperAdminTracking`), por tracker.
- RLS: ajustar a policy de `tracker_links` para que a role `tracker` tenha **apenas SELECT** dos próprios links (remover INSERT/UPDATE/DELETE do tracker); o `super_admin` mantém gestão total.

## Detalhes técnicos

- **Atribuição via cadastro já existe**: a captura de first-touch e a gravação em `tracker_conversions` já acontecem no fluxo atual (`tracker-convert`), então nenhuma mudança no momento do cadastro é necessária — apenas consumimos esses dados.
- **Isolamento**: feito no servidor (edge function com service role filtrando pelo conjunto de `store_id` do tracker). As páginas do tracker nunca consultam tabelas globais diretamente.
- **Migration**: apenas ajuste de RLS em `tracker_links` (tracker = SELECT-only). Sem novas tabelas.
- **i18n**: textos novos adicionados em EN/PT-BR/ES.
- **Sem novos segredos**; reutiliza `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

## Fora de escopo
- Não muda o fluxo de login (já feito anteriormente).
- Não cria marketplace nem múltiplos influenciadores.
</content>
<summary>Trackers ganham as páginas tenants/clients/partners/referrals/ranking/support em /admin-master com dados isolados pelo cadastro atribuído (via tracker_conversions → store_ids), servidos por uma edge function com service role; a criação de links de tracking passa a ser exclusiva do CEO.</summary>
</invoke>
