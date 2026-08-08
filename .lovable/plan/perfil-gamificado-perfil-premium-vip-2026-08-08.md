# Perfil gamificado + Perfil Premium (VIP)

Nova lógica do `/profile` em três camadas: personalização premium (só VIP), pontuação/ranking real (banco de dados) e configuração das medalhas/recompensas pelo admin da loja.

## 1. Perfil Premium (exclusivo para quem comprou o VIP da loja)

- Banner personalizado no topo do perfil (imagem ou GIF) + avatar redondo sobreposto (imagem ou GIF), no estilo da referência enviada.
- Campos extras: nome de exibição, @handle, pronomes, "status" curto (o balão de fala da referência) e badges ao lado do nome (ex.: Creator, Premium).
- Uploads limitados: 5 MB por arquivo, formatos jpg/png/webp/gif. Arquivos ficam em bucket público, isolados por loja e usuário.
- Para não-VIP: o bloco aparece bloqueado, com preview borrado e CTA "Desbloquear com o VIP" apontando para `/vip`. Nada de personalização é salvo sem assinatura ativa.
- Se a assinatura VIP expirar, o perfil volta ao visual padrão (banner/avatar customizados ficam guardados e voltam ao renovar).

## 2. Pontuação e ranking reais

Hoje os pontos vivem apenas no navegador (localStorage), então cada pessoa vê um ranking diferente. Passa a ser no banco, por loja:

- Eventos que geram pontos: ideia criada, voto recebido em ideia, voto dado, comentário/mensagem na comunidade, pedido custom pago, participação diária.
- Cada evento vira um registro no histórico de pontos (com anti-duplicidade), e o total por usuário é somado por loja.
- Perfil mostra: nível atual + título, barra de progresso para o próximo nível, total de pontos, contadores (ideias, votos recebidos, comentários) e medalhas conquistadas.
- Ranking da comunidade passa a ler os mesmos dados (top usuários da loja, com destaque para a posição do usuário logado).
- Pontos já acumulados no navegador não são migrados; todos começam do zero no ranking oficial.

## 3. Painel admin: configuração de medalhas e recompensas

Nova página no painel da loja (`/admin/gamification`):

- Ligar/desligar o sistema de gamificação da loja.
- Definir quantos pontos vale cada ação.
- Editar níveis: nome, pontos mínimos, ícone/emoji.
- Editar medalhas: nome, descrição, ícone, condição (ex.: X ideias, X votos recebidos, nível Y) e ativo/inativo.
- Definir o que cada nível/posição do ranking libera para o usuário — lista de benefícios selecionáveis, por exemplo: banner animado (GIF), avatar animado, moldura/destaque no ranking, badge no chat, desconto em customs, acesso a conteúdo VIP específico.
- Preview ao lado mostrando como o nível/medalha aparece no perfil.

Efeito prático: o que o admin liberar em cada nível é o que o usuário passa a ver desbloqueado no `/profile` (sempre respeitando a regra de que banner/avatar personalizados exigem VIP ativo).

## Detalhes técnicos

- Tabelas novas (todas com `store_id`, RLS e GRANTs):
  - `profile_customizations` — `user_id`, `store_id`, `banner_url`, `avatar_url`, `display_name`, `pronouns`, `status_text`. Escrita só pelo dono e apenas com VIP ativo (validado por trigger usando `is_vip`); leitura por membros da loja.
  - `reputation_events` — ledger de pontos (`user_id`, `store_id`, `type`, `points`, `source_id`, `created_at`) com índice único em (`store_id`,`user_id`,`type`,`source_id`) para evitar dupla contagem. Insert apenas via função `security definer` `award_reputation(...)`, nunca direto pelo cliente.
  - `reputation_totals` (ou view materializada equivalente) para leitura rápida do ranking.
- RPCs: `award_reputation(p_store_id, p_type, p_source_id)`, `get_user_reputation(p_store_id, p_user_id)`, `get_store_leaderboard(p_store_id, p_limit)`.
- Triggers para pontuar automaticamente em `video_ideas`, `video_idea_votes`, `video_chat_messages` e `custom_orders` (quando pago).
- Config de gamificação salva em `app_configurations` com `config_key = 'gamification_config'` por loja, gravada pela função `save-app-config` (adicionar a chave à whitelist).
- Uploads de banner/avatar: bucket público `profile-media`, caminho `<store_id>/<user_id>/...`, políticas de storage restringindo escrita ao próprio usuário; validação de tipo/tamanho no cliente e nas policies.
- Frontend: `src/lib/user-reputation.ts` passa a ser cliente do backend (mesma API pública, sem localStorage); `use-user-reputation`, `ReputationCard`, `LeaderboardCard` e `UserLevelBadge` passam a usar níveis/medalhas vindos da config da loja.
- `src/pages/Perfil.tsx` reestruturado: header premium (banner + avatar + nome/handle/badges), card de reputação, medalhas, ranking resumido e os atalhos atuais abaixo.
- i18n completo em EN, PT-BR e ES para todos os textos novos.
