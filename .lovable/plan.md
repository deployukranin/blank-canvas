# Correções: páginas legais, perfil e mídia VIP

## 1. /help, /terms, /privacy dando 404
Hoje essas páginas só existem nas rotas raiz (`/help`, `/terms`, `/privacy`). Dentro de uma loja, os links do perfil apontam para `/februxry/help`, que não existe no roteador — daí o 404.

- Adicionar as rotas equivalentes com slug (`/:slug/help`, `/:slug/terms`, `/:slug/privacy`) e as versões de domínio personalizado, reutilizando as mesmas páginas.

## 2. Aviso "Seu @ é permanente e não pode ser alterado."
- Mostrar esse aviso apenas uma vez, logo após o usuário definir o @ (confirmação temporária, dispensável).
- Nas visitas seguintes, o cartão exibe somente o `@usuario`, sem o texto de permanência.
- A marcação de "já visto" fica salva por usuário no próprio navegador.

## 3. "Sua jornada" ocultável
- Adicionar um botão discreto de fechar/ocultar no cartão da jornada em /profile.
- A escolha fica lembrada por usuário; quando todas as etapas estiverem concluídas, o cartão some sozinho.
- Um link pequeno "mostrar jornada" permite reexibir.

## 4. "Report a bug" mais discreto
- Remover o botão de reportar bug do menu lateral (desktop e mobile cinematográfico).
- Passar a exibi-lo em /profile, na mesma lista de Ajuda / Termos / Privacidade, como um item discreto que abre o diálogo já existente.

## 5. Mídia VIP abrindo no Google Drive
Atualmente o botão gera um link assinado e chama `window.open`, levando o usuário para fora.

- Trocar por reprodução embutida: ao clicar, a mídia abre num visualizador dentro da própria página (overlay/modal), usando a URL assinada do proxy interno (`drive-media`), sem expor nem abrir o Google Drive.
- Vídeo toca em player nativo, imagem aparece inline, áudio em player de áudio; o tipo vem do `mimeType` já retornado pela assinatura.
- Aplicar tanto na página /vip quanto no componente de conteúdo VIP.

## Detalhes técnicos
- `src/App.tsx`: novas rotas de páginas públicas com `TenantGate` e `CustomDomainGate`.
- `src/components/profile/HandleSelector.tsx`: estado "aviso já visto" em localStorage por `user.id`.
- `src/pages/Perfil.tsx`: cartão de jornada com dismiss persistido; item de bug report na lista de menu.
- `src/components/layout/DesktopShell.tsx` e `CinematicMobileShell.tsx`: remover `<BugReportDialog />`.
- Novo componente `src/components/vip/VipMediaViewer.tsx` (overlay) consumindo `getDriveMedia()` de `src/lib/external-storage.ts`; usado em `src/pages/VIP.tsx` e `src/components/vip/VIPAreaContent.tsx`.
- Textos novos traduzidos em EN, PT-BR e ES.
