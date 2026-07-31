# Redesign da página /auth

Refinar o layout, a hierarquia visual e o polimento da tela de login/cadastro, mantendo o split-screen e a identidade roxa da marca. Nenhuma lógica de autenticação muda.

## Decisões travadas (escolhas do usuário)

- Paleta: roxo atual refinado — `#0a0a0f` (fundo), `#1a1030` (superfície), `#8b5cf6` (primária), `#c4b5fd` (destaque claro)
- Tipografia: Space Grotesk (títulos) + DM Sans (corpo)
- Layout: split-screen (marca à esquerda, formulário à direita)
- Logo: tamanho médio (~200px de largura), hoje está grande demais

## O que muda

**Logo**
- Desktop: reduzir de `h-24` para altura média equivalente a ~200px de largura (aprox. `h-14`), alinhada ao topo do bloco de marca.
- Mobile: logo compacta e centralizada acima do card.
- Tela de "confirme seu email": mesmo tamanho médio, sem destoar.

**Coluna esquerda (marca)**
- Bloco de conteúdo com largura máxima controlada, respiro vertical consistente e alinhamento óptico com o card do formulário (mesma linha de base no topo).
- Título em Space Grotesk com escala fluida (`clamp`), evitando quebra estranha em telas médias.
- Badge de trial e lista de benefícios com espaçamento mais uniforme; ícones em containers menores e mais discretos.
- Fundo: gradiente e glows suavizados, ruído/starfield com opacidade menor para não competir com o texto.

**Coluna direita (formulário)**
- Card de vidro com borda e sombra mais sutis, cantos e padding padronizados; largura máxima fixa para não esticar em telas largas.
- Abas Entrar / Criar Conta com indicador deslizante e estados hover/focus claros.
- Campos: altura uniforme, ícones alinhados, rótulos mais legíveis, mensagens de ajuda e erro com espaço reservado (sem "pulo" de layout).
- Botão primário com gradiente roxo, estado de carregamento e foco visível acessível.
- Rodapé do card (termos/links) com contraste adequado.

**Responsivo**
- Abaixo de `lg`: coluna única com logo média, título reduzido, badge de trial visível e card ocupando a largura útil com margens seguras.
- Revisão de overflow de texto em 360–430px de largura.

**Polimento e movimento**
- Transições curtas e discretas: fade/slide sutil no bloco de marca, transição suave entre abas, hover em campos e botões. Sem animações longas ou chamativas.
- Respeito a `prefers-reduced-motion`.

## Detalhes técnicos

- Arquivo principal: `src/pages/Auth.tsx` (usa os primitivos `Container`/`Section` de `src/components/layout/primitives.tsx` — manter).
- Tokens: substituir valores roxos hardcoded na página por tokens semânticos; se necessário, adicionar tokens específicos de auth em `src/index.css` e `tailwind.config.ts` em vez de classes de cor cruas.
- Fontes: garantir que `font-display` mapeie para Space Grotesk e o corpo para DM Sans no Tailwind; carregar as famílias no `index.html` se ainda não estiverem.
- Textos continuam vindo do i18n (`auth.*`) em pt-BR, en e es — nenhuma string nova hardcoded.
- Sem alteração em `AuthContext`, edge functions ou fluxo de cadastro/confirmação.

## Verificação

- Conferir /auth nas abas Entrar e Criar Conta, em desktop e mobile, nos três idiomas, e comparar o tamanho da logo antes/depois.
