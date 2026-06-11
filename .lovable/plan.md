# Melhorias na Landing Page

A imagem enviada será usada apenas como **referência de estilo** (dashboard ASMR roxo/dark). Vou gerar um novo mockup do dashboard com a marca **MyTingleBox** nesse mesmo estilo e aplicar as 4 melhorias solicitadas.

## 1. Novo mockup do hero
- Gerar uma imagem de dashboard no mesmo estilo da referência (sidebar escura, cards de métricas, gráfico roxo, badge "Welcome back"), porém com a marca MyTingleBox.
- Salvar como novo asset e substituir `landing-hero-mockup.jpg` no hero.

## 2. Header fixo com navegação
- Barra fixa no topo com efeito blur ao rolar: logo MyTingleBox à esquerda; links âncora (Recursos, Planos) ao centro; seletor de idioma + botão "Começar grátis" à direita.
- Menu responsivo (drawer/colapsado) no mobile.
- Mover o seletor de idioma atual para dentro do header.

## 3. Novas seções
- **Como funciona**: 3 passos (Crie sua loja → Configure conteúdo → Comece a vender), com ícones numerados.
- **Prova social / estatísticas**: faixa com números de destaque (criadores, países, 0% de taxa, etc.).
- **FAQ**: accordion com perguntas comuns (usando o componente `accordion` existente).
- Todas as seções com textos traduzidos (PT/EN/ES), seguindo o padrão do objeto `tr`.

## 4. Mais animações e polish
- Animações de entrada por scroll (`whileInView`) nas novas seções.
- Brilho/gradientes mais ricos e efeito hover nos cards.
- Border/glow sutil no mockup do hero e nos cards de pricing.
- Microinterações nos botões.

## 5. Footer
- Rodapé com logo, breve descrição, colunas de links (Produto, Recursos, Legal), redes sociais e linha de copyright.

## Detalhes técnicos
- Todas as alterações em `src/pages/Landing.tsx` (mais um novo arquivo de header/footer se ficar grande, ex.: `src/components/landing/`).
- Reaproveitar tokens de design existentes (tema roxo, `font-display`, classes utilitárias) e o componente `accordion` do shadcn.
- Manter i18n com o mesmo padrão atual (objeto `tr` com pt/en/es).
- Sem mudanças de backend.
