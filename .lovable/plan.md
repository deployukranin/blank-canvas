# Remover redes sociais e transformar /help, /terms e /privacy em páginas públicas

## 1. Remover atalhos de redes sociais

- Rodapé da landing page (`src/pages/Landing.tsx`): remover o bloco com os três ícones (Instagram, YouTube, X) e os imports não usados.
- `src/components/layout/Footer.tsx`: remover o mesmo bloco de ícones sociais (links vazios `href="#"`).

Os links sociais reais configuráveis pelo criador (usados dentro da loja) continuam intactos.

## 2. Redesenhar /help, /terms e /privacy

Hoje essas três páginas usam o layout da loja, o que faz aparecer a barra inferior com Início, Customs, VIP, Comunidade e Perfil — como se o visitante estivesse dentro da plataforma.

Mudança: transformá-las em páginas públicas independentes, com a mesma estética da landing e do /auth.

Cada página passa a ter:
- Fundo escuro com o mesmo tratamento visual da landing (starfield/glow sutil, vidro).
- Topo simples: logo My Tingle Box (link para `/`), seletor de idioma e botão "Voltar ao início".
- Conteúdo em cartão de vidro, com tipografia Space Grotesk nos títulos e DM Sans no corpo, espaçamento mais respirado e largura máxima confortável para leitura.
- Rodapé enxuto com links entre as três páginas (Ajuda, Termos, Privacidade) e o aviso de copyright.
- Nenhuma barra de navegação inferior e nenhum item da loja.

Melhorias de conteúdo:
- `/help`: FAQ em accordion mantido, com as perguntas existentes agrupadas e o cartão de contato por e-mail em destaque.
- `/terms` e `/privacy`: seções numeradas mantidas, com índice de seções no topo em telas maiores e data de atualização visível.

Todo o texto continua vindo do i18n (PT-BR, EN, ES); nenhuma chave nova de tradução é necessária além de rótulos simples de navegação, que serão adicionados aos três idiomas.

## Detalhes técnicos

- Criar `src/components/layout/PublicPageLayout.tsx` com header, fundo e footer compartilhados; as três páginas passam a usá-lo no lugar de `MobileLayout`.
- Nenhuma mudança de rota em `src/App.tsx` — `/help`, `/terms` e `/privacy` continuam nos mesmos caminhos.
- Nenhuma alteração de backend, dados ou lógica de negócio.
