# Isolamento real entre lojas + remoção dos dados de demonstração

## 1. Remover os dados mockup da februxry

O painel `/februxry/admin` hoje troca as métricas reais por um bloco fixo de demonstração (KPIs, pedidos pendentes, métricas do YouTube, ideias e o gráfico de atividade semanal). Esse bloco e todas as suas referências saem, e o painel volta a mostrar apenas dados reais do banco — inclusive zerados quando não houver movimento.

## 2. Cada usuário pertence só à loja onde se cadastrou

Regra escolhida: mesmo email pode existir em várias lojas, mas o vínculo (membro, VIP, pontos, pedidos) vale apenas na loja em que foi criado. Em qualquer outra loja a pessoa é somente visitante.

O que muda:

- **Fim do vínculo automático ao visitar**: hoje, abrir qualquer loja logado cria o registro de membro e o papel de cliente naquela loja. Isso passa a acontecer apenas quando a pessoa realmente entra ou se cadastra pela página de login daquela loja.
- **Visitante em loja alheia**: quem está logado por outra loja continua vendo a vitrine pública (home, vídeos, galeria), mas as áreas de membro (perfil, pedidos, comunidade, ideias, VIP, notificações) mostram um aviso "você não é membro desta loja" com o botão para entrar/cadastrar naquela loja.
- **Admin/creator nunca vira membro nem VIP de outra loja**: dono de loja abrindo outra loja é sempre visitante — sem membro, sem VIP, sem pontos, sem acesso ao painel dela.
- **VIP passa a ser por loja**: hoje a assinatura VIP é buscada só pelo usuário, sem filtrar a loja, então um VIP comprado numa loja libera conteúdo premium em todas. Passa a ser sempre filtrado pela loja atual (inclusive no cache local, que hoje é só por usuário).
- **Perfil premium e pontos**: continuam por loja, exibidos apenas dentro da loja de origem.

## 3. Limpeza dos vínculos cruzados já existentes

Remoção dos registros de membro e papéis de cliente criados apenas por visita — ou seja, aqueles sem nenhum sinal de relação real com a loja (sem pedido, sem assinatura VIP, sem pontos, sem mensagem). Vínculos com histórico real são preservados. A limpeza é apresentada como migração para você aprovar, e antes disso eu mostro a contagem exata do que seria removido.

## Detalhes técnicos

- `src/pages/admin/AdminDashboard.tsx`: remover `DEMO_SLUG`, a constante `DEMO`, `isDemo` e os `display*` derivados.
- `src/hooks/use-store-membership.ts`: deixa de inserir em `store_users`/`assign_client_role`; passa a apenas ler a membership da loja atual e expor `isMember`.
- Novo hook/contexto `useStoreMembershipStatus` consumido pelo `TenantGate` e por um novo guard `StoreMemberRoute` aplicado em `/:slug/profile`, `/:slug/orders`, `/:slug/notifications`, `/:slug/community`, `/:slug/ideas`, `/:slug/vip` (área logada).
- `src/pages/ClientAuth.tsx` continua sendo o único ponto que cria `store_users` + `assign_client_role` (upsert já existente), agora também no fluxo de cadastro após confirmação.
- `src/components/auth/AdminRoute.tsx` já checa dono/`store_admins`; complemento no `TenantGate` para que creator/admin de outra loja não receba membership implícita.
- `src/hooks/use-vip-subscription.ts`: adicionar `store_id` ao filtro da consulta, às chaves de cache em memória e em `localStorage`, e à criação de cobrança.
- Verificação por RLS: confirmar que `vip_subscriptions`, `reputation_events`, `custom_orders` e `profile_customizations` exigem `store_id` compatível com a membership; ajustar políticas onde faltar.
- Migração de limpeza: apagar `store_users` e `user_roles` de papel `client` sem atividade correlata na loja.
- Textos novos em pt-BR, EN e ES.
