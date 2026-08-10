# Bug reports + denúncias rápidas + filtro anti-dados pessoais

## 1. Aviso de bug (novo)

- Usuários logados de qualquer loja podem enviar um relato de bug por um botão "Reportar bug" (item no menu/rodapé da sidebar da loja e do painel do cliente).
- Formulário curto: categoria rápida (Página não carrega, Erro ao pagar, Vídeo/áudio, Login/conta, Layout quebrado, Outro), gravidade (baixa/média/alta) e descrição opcional.
- Envio grava automaticamente a rota atual, o navegador e a loja de origem — o usuário não precisa escrever isso.
- Os relatos aparecem **somente** em `/admin-master/bugs` (painel CEO). Nada é exibido no painel admin do cliente.
- Tela do admin master: lista com filtros (aberto / em análise / resolvido / descartado), contadores no topo e ações para mudar status e escrever nota interna.

## 2. Denúncias com opções rápidas

- Substituir o campo de texto livre do modal de denúncia (ideias e comentários) por uma lista de motivos pré-definidos, em botões/rádio:
  spam ou propaganda, conteúdo impróprio/sexual, assédio ou discurso de ódio, divulgação de dados pessoais, conteúdo enganoso, outro.
- Um único campo de detalhe opcional, curto (máx. 200 caracteres), só quando "outro" for escolhido — também sujeito ao filtro do item 3.
- Denúncias passam a ser gravadas no banco (hoje ficam em `localStorage`) e continuam visíveis no painel do cliente em `/admin/reports`, agora com o motivo traduzido.
- Traduções PT-BR, EN e ES para todos os motivos.

## 3. Filtro anti-dados pessoais

- Bloqueio no envio (não só aviso) de: links/URLs e domínios, e-mails, telefones (incl. formatos com espaços, pontos, traços e "zero um um"), @ de redes sociais, e menções a WhatsApp/Telegram com número.
- Aplicado em todos os campos livres do usuário: ideias (título e descrição), chat de vídeos, chat da comunidade, chat de pedidos, tickets/mensagens de suporte, campo de detalhe da denúncia e descrição do bug.
- Mensagem clara ao usuário indicando o tipo de dado bloqueado, traduzida nos 3 idiomas.
- Mesma validação repetida no banco (trigger) para as tabelas de ideias, mensagens de chat e denúncias, para que não seja possível burlar pelo cliente.

## Detalhes técnicos

- Novas tabelas: `bug_reports` (store_id, user_id, category, severity, description, route, user_agent, status, admin_note) e `content_reports` (store_id, reporter_id, target_type, target_id, reason_code, detail, status). Ambas com GRANTs, RLS (usuário insere o seu; leitura de `bug_reports` só para `super_admin`; `content_reports` legível pelo gestor da loja e super admin).
- Novo utilitário `src/lib/content-filter.ts` com os regex e a função `validateUserText()`; hook/reuso nos formulários existentes.
- Função SQL `public.text_has_personal_data(text)` + triggers `BEFORE INSERT` nas tabelas de texto do usuário.
- Novo componente `src/components/reports/ReportDialog.tsx` (motivos rápidos) usado por `Ideias.tsx`, `IdeasBoardDesktop.tsx` e `Comunidade.tsx`.
- Novo componente `src/components/bugs/BugReportDialog.tsx` + entrada na sidebar (`DesktopShell`, `CinematicMobileShell`, `MobileLayout`).
- Nova página `src/pages/super-admin/SuperAdminBugs.tsx` e rota `/admin-master/bugs` protegida por `SuperAdminRoute`, com item no menu do layout do admin master.
- `AdminDenuncias.tsx` migra de `localStorage` para `content_reports`; `use-video-ideas.ts` passa a gravar a denúncia de verdade.
