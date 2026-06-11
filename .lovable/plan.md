# Alinhar o layout do /auth com a landing page

## Objetivo
Fazer a página `/auth` usar o mesmo sistema de espaçamento, grid e estilo de cards da landing page, garantindo alinhamento consistente nas três telas do arquivo (loading, confirmação de email e o formulário principal de login/cadastro).

## Padrões de referência da landing (`src/pages/Landing.tsx`)
- Container central: `max-w-6xl mx-auto px-6` (gutter horizontal de 6).
- Ritmo de seção: `py-24` com `scroll-mt-20`.
- Cards: `rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6`.
- Grids com `gap-5` / `gap-6`.
- Tipografia: `font-display`, kicker em `text-sm uppercase tracking-wider text-purple-300`, títulos com gradiente roxo.

## Mudanças em `src/pages/Auth.tsx`

### 1. Container e gutters consistentes
- Trocar o padding lateral assimétrico do lado esquerdo (`px-16`) por um gutter alinhado ao da landing (`px-6` com um container interno `max-w-xl`), de modo que branding e formulário compartilhem o mesmo eixo de alinhamento.
- Padronizar o padding vertical das telas para o mesmo ritmo (`py-12 md:py-16`), igual nas três telas.

### 2. Grid do split-screen
- Manter o split `lg:w-1/2 / lg:w-1/2`, mas garantir que ambos os lados centralizem o conteúdo no mesmo container de largura máxima e alinhem verticalmente (mesmo `justify-center` e mesma `max-w`).
- A lista de features no lado esquerdo passa a usar o mesmo espaçamento vertical do grid da landing (`gap`/`space-y` equivalente a `gap-5/6`).

### 3. Estilo dos cards
- Uniformizar o raio dos cards: usar `rounded-2xl` (igual à landing) em vez de `rounded-3xl`, nas três telas (form, confirmação e branding boxes).
- Padronizar o fundo dos cards para `border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent` (mesmo token dos cards da landing), mantendo o `backdrop-blur` e a sombra roxa.
- Padding interno do card padronizado em `p-8` (alinhado ao espaçamento da landing).

### 4. Tipografia e kickers
- Aplicar `font-display` aos títulos das telas para casar com a landing.
- Manter o título do hero com gradiente roxo já existente; alinhar os subtítulos ao tom `text-white/60`.

### 5. Consistência entre as três telas
- Tela de loading: fundo `#0a0418` (já ajustado), centralização idêntica.
- Tela de confirmação de email: aplicar mesmo container (`max-w-md`/`max-w-xl`), mesmo card (`rounded-2xl`, gradiente, `p-8`) e mesmo padding vertical das demais.
- Tela principal: aplicar todos os pontos acima.

## Fora de escopo
- Nenhuma mudança de lógica de autenticação, validação, i18n ou backend.
- Sem alteração nos textos/traduções.

## Verificação
- Conferir o preview do `/auth` em desktop, tablet e mobile, validando que gutters, alinhamento vertical, raios de card e espaçamento batem visualmente com a landing.
