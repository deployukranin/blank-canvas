# Player imersivo, reações personalizáveis e limpeza do painel

## 1. Modo de visualização imersivo

Hoje o vídeo abre em um diálogo pequeno com barra lateral apertada. Ele passa a abrir como uma experiência de tela cheia sobreposta:

- Fundo escuro total (cobre 100% da tela), sem cara de popup.
- Player grande e centralizado, ocupando o máximo possível mantendo a proporção 16:9.
- Painel lateral (desktop) / abas deslizantes (mobile) com: descrição, reações, comentários e "Mais do canal".
- Botão de fechar discreto no canto, fechar com tecla Esc, e navegação entre vídeos sem sair do modo imersivo.
- Nada leva o usuário para o YouTube: cliques em sugestões do player continuam trocando o vídeo dentro da plataforma.

Aba de comentários:
- Usuário logado: lista de comentários + campo para enviar (como hoje).
- Visitante sem conta: aba bloqueada — nenhum comentário é exibido, apenas um aviso com botão "Entrar / Criar conta".

Aplica-se em todos os pontos onde o vídeo abre: home, galeria de vídeos, comunidade e área VIP (os vídeos VIP passam a usar o mesmo visualizador).

## 2. Reações personalizáveis pelo admin

Mantidas as 4 posições de reação (dados existentes preservados), mas cada uma passa a ser totalmente editável no painel admin:

- Nome/rótulo próprio (com tradução automática dos textos padrão quando não editados).
- Ícone: emoji **ou** upload de PNG (transparente) próprio da loja.
- Ativar/desativar cada reação individualmente.
- Cores de destaque de cada reação e pré-visualização ao vivo dentro do painel.
- Botão "restaurar padrão".

Onde: nova seção "Reações dos vídeos" dentro de `/:slug/admin/customize`, com upload usando o mesmo fluxo de armazenamento já usado pelos banners/ícone (respeitando a cota do plano).

## 3. Remoção do preview de templates

Na tela de personalização, o bloco de "Preview" com o iframe do site (e os botões desktop/mobile/recarregar) é removido. Ficam apenas os cartões de escolha do layout com a miniatura ilustrativa e o botão "Usar este layout".

## Detalhes técnicos

- Novo componente `src/components/video/ImmersiveVideoView.tsx` (overlay full-screen com foco/Esc/scroll lock), substituindo `VideoWatchModal` em `Index.tsx`, `VideoGalleryPanel.tsx`, `Comunidade` e `VIPAreaContent`. `VideoWatchModal` passa a apenas encaminhar para o novo componente para não quebrar imports.
- `VideoChat`: em modo não autenticado não busca nem renderiza mensagens; exibe estado bloqueado com CTA de login.
- Config das reações em `WhiteLabelConfig.reactions` (array de 4 itens: `type`, `label`, `emoji`, `iconUrl`, `color`, `enabled`), persistida em `app_configurations` pelo fluxo existente de `save-app-config` — sem mudança de schema. `VideoReactions` e `VideoReactionBadge` passam a ler dessa config, com fallback aos padrões atuais.
- Upload de PNG reutiliza o helper de upload já existente em `AdminPersonalizacao` (Google Drive/quota por plano).
- `LayoutPicker.tsx`: remove iframe, estados `device`/`reloadKey` e o `GlassCard` de preview.
- Textos novos adicionados em EN, PT-BR e ES.
