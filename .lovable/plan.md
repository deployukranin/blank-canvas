# Sistema de Tracking Isolado (Admin Masters de Tráfego)

Cria uma entidade nova e independente — "trackers" (admin masters de tráfego) — sem cadastro de email/senha. Cada tracker é gerenciado pelo Super Admin em `/admin-master`, recebe um **dashboard via URL secreta** (token) com dados 100% isolados, e gera **vários links de tracking** (um por canal: email, ads, dm, etc). Cada link rastreia cliques e conversões (cadastro de loja E de cliente final), com métricas de conversão por canal.

## Como funciona (fluxo)

```text
Super Admin (/admin-master/tracking)
   └── cria Tracker "João Tráfego"  ──► gera URL do dashboard: /track/<token>
          └── cria links por canal:
                 /t/<code1>  (canal: ads)
                 /t/<code2>  (canal: email)
                 /t/<code3>  (canal: dm)

Visitante clica /t/<code2>
   1. registra 1 clique (canal email)
   2. salva o code em cookie/localStorage (atribuição, 30 dias)
   3. redireciona para a landing / loja

Visitante se cadastra (loja OU cliente)
   4. lê o code salvo e registra 1 conversão (tipo + email/nome)

Dashboard /track/<token>
   └── mostra métricas isoladas só daquele tracker
```

## Banco de dados (nova migration)

- **trackers**: `name`, `dashboard_token` (secreto, único), `is_active`. Gerenciado só pelo Super Admin.
- **tracker_links**: `tracker_id`, `code` (slug curto único), `label`, `channel` (ex: ads/email/dm/livre), `is_active`.
- **tracker_clicks**: `link_id`, `tracker_id`, `occurred_at`, `referrer`, `user_agent`, `ip_hash`, `visitor_id` (para cliques únicos).
- **tracker_conversions**: `link_id`, `tracker_id`, `type` (`store_signup` | `client_signup`), `subject_id` (id da loja/usuário), `email`, `name`, `store_id`, `occurred_at`.

RLS estrita: nenhum acesso anônimo direto. Toda leitura/escrita passa por Edge Functions com `service_role` (o dashboard é autenticado pelo token, não por login). Super Admin gerencia via função RBAC.

## Edge Functions (todas com Fetch API, sem SDK)

- **tracker-click** (público): recebe `code`, grava clique + retorna destino para redirecionar.
- **tracker-convert** (público): recebe `code` + tipo + dados do cadastro, grava conversão.
- **tracker-dashboard** (token): recebe `token`, valida, retorna métricas isoladas e lista de cadastros.
- **super-admin-trackers** (RBAC super_admin): CRUD de trackers e links, gera tokens/codes.

## Frontend

- **`/t/:code`** — página leve que chama `tracker-click`, salva atribuição (cookie 30d) e redireciona.
- **`/track/:token`** — dashboard público isolado (sem login): cards de métricas + tabela de cadastros + filtro por canal.
- **`/admin-master/tracking`** — nova tela no Super Admin: criar/listar trackers, gerar e copiar URLs (dashboard + links por canal), ver resumo. Item novo no menu do `SuperAdminLayout`.
- **Hook de atribuição** lido no cadastro de criador (`Auth.tsx`) e de cliente (`ClientAuth.tsx`): após criar a loja/cliente, dispara `tracker-convert`. Captura também `?t=<code>` na URL além do cookie.

## Métricas no dashboard

- Total de cliques e **cliques únicos** (por `visitor_id`).
- Conversões totais, separadas por tipo (lojas vs clientes).
- **Taxa de conversão** = conversões ÷ cliques (por tracker e por canal).
- Quebra por canal (tabela: canal · cliques · conversões · taxa).
- Série temporal (cliques/conversões por dia) e lista dos cadastros (nome/email/canal/data).

### Observação sobre CTR
CTR real = cliques ÷ impressões. Como não temos as impressões dos anúncios/emails do admin, o dashboard pode incluir um campo opcional para o admin informar impressões por link e então calcular o CTR; caso contrário a métrica principal de qualidade é a **taxa de conversão** (cliques → cadastros). Confirmo essa abordagem na implementação.

## Detalhes técnicos

- Atribuição: cookie/localStorage `tb_track` (last-click, 30 dias) + suporte a `?t=<code>` no link.
- `visitor_id`: uuid em localStorage para deduplicar cliques únicos.
- `ip_hash`: hash do IP (privacidade) feito na Edge Function.
- Convenção de rotas mantida: `/t/:code` e `/track/:token` (palavras únicas).
- i18n: textos novos em EN/PT-BR/ES.
