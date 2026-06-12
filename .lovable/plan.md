# Trackers com login próprio acessando /admin-master

## Objetivo
Transformar os "trackers" (admins de tráfego) em **contas com login email/senha** que acessam o **mesmo painel `/admin-master`**, mas onde o dashboard é a **página de trackeamento** mostrando apenas os **links e métricas do próprio usuário**. O Super Admin continua com o painel completo.

## Como vai funcionar

```text
Super Admin  → login /admin-master/login → /admin-master (painel completo: tenants, clientes, tracking, etc.)
Tracker      → login /admin-master/login → /admin-master (dashboard = SUA página de trackeamento)
```

- Mesma URL `/admin-master`. A única diferença é quem fez login.
- Tracker vê: criar/copiar seus links por canal (ads, email, dm…) + métricas isoladas (cliques únicos, conversões, taxa de conversão, quebra por canal, série de 30 dias, lista de cadastros).
- Tracker **não** vê os menus de plataforma (tenants, clientes, parceiros, planos…), pois não é Super Admin.

## Mudanças

### 1. Banco de dados
- Adicionar valor `tracker` ao enum `app_role`.
- Adicionar coluna `owner_user_id uuid` em `public.trackers` (referência ao usuário dono). Cada conta de tracker = 1 linha em `trackers`.
- Atualizar RLS para que um tracker leia/gerencie **somente** seus próprios `trackers`, `tracker_links`, `tracker_clicks`, `tracker_conversions` (filtrando por `owner_user_id = auth.uid()`), mantendo o acesso total do Super Admin.

### 2. Login dos trackers
- Reutilizar `/admin-master/login` (email/senha já existente). Ajustar o redirect: se o usuário tem role `tracker`, vai para `/admin-master`; se `super_admin`, idem; senão, acesso negado.

### 3. Criação de contas de tracker (Super Admin)
- Na tela `/admin-master/tracking` do Super Admin, ao criar um tracker passar a pedir **nome, email e senha**.
- A edge function `super-admin-trackers` cria o usuário (auth admin), atribui a role `tracker` em `user_roles`, e cria a linha `trackers` com `owner_user_id`.

### 4. Guard de rota
- Trocar `SuperAdminRoute` em `/admin-master` por um guard que aceita `super_admin` **ou** `tracker`. As demais rotas `/admin-master/*` continuam restritas a `super_admin`.

### 5. Dashboard / Layout
- `/admin-master` (componente de dashboard): se o usuário for `tracker`, renderiza a **página de trackeamento do próprio usuário** (criar links + métricas). Se for `super_admin`, mantém o dashboard atual.
- `SuperAdminLayout`: quando o usuário for `tracker`, o menu lateral mostra apenas "Tracking"/Dashboard; para `super_admin` mostra tudo como hoje.

### 6. Métricas do próprio tracker
- Reaproveitar a agregação já existente (`tracker-dashboard`), porém escopada pelo usuário logado (via sessão), em vez de token público. As métricas aparecem embutidas no `/admin-master` do tracker.

## Detalhes técnicos
- Edge functions usam Fetch API, `auth.getClaims(token)` para validar e descobrir o `user_id` do tracker.
- A criação de usuário usa o `SUPABASE_SERVICE_ROLE_KEY` dentro de `super-admin-trackers` (somente Super Admin pode chamar a ação de criar).
- Links continuam públicos em `/t/:code`; conversões seguem ligadas via atribuição (cookie/localStorage `tb_track`) como já implementado.
- i18n (EN/PT-BR/ES) para os textos novos.

## Pontos definidos
- Trackers entram com email/senha e caem em `/admin-master`.
- O dashboard deles é a própria página de trackeamento, isolada por usuário.
- Sem acesso aos menus administrativos da plataforma.