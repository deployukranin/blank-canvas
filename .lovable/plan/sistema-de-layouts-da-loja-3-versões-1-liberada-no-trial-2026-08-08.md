# Sistema de Layouts da Loja (3 versões, 1 liberada no trial)

Cada criador poderá escolher entre 3 layouts diferentes para a página pública da loja (ex.: `mytinglebox.com/februxry`), com preview dentro do painel admin. No trial, apenas 1 layout fica liberado; os outros aparecem bloqueados com selo de upgrade.

## Os 3 layouts

1. **Classic** (liberado no trial) — o layout atual: banner hero, atalhos em grid 3 colunas, carrosséis de vídeos, novidades.
2. **Spotlight** — hero em tela cheia com vídeo/banner em destaque, título grande sobreposto, atalhos em linha horizontal com scroll, vídeos em grid de 2 colunas com destaque para o primeiro.
3. **Magazine** — sem hero gigante: cabeçalho compacto com avatar + nome + bio, atalhos como lista de cartões largos, seções de vídeos em blocos alternados (esquerda/direita) e novidades em destaque no topo.

Todos os layouts usam as mesmas cores, ícone, banners e conteúdos já configurados — muda apenas a composição visual.

## Seleção e bloqueio por plano

- Nova aba **Layout** em `/:slug/admin/customize`, antes da aba Preview.
- Três cartões com miniatura de cada layout. Trial: só Classic é selecionável; Spotlight e Magazine ficam com cadeado e botão "Fazer upgrade" apontando para `/:slug/admin/plans`.
- Planos pagos (basic/pro/premium): todos os 3 liberados.
- A escolha é salva na configuração da loja e aplicada imediatamente na loja pública.

## Preview no painel

- Painel de preview ao lado dos cartões, em moldura de celular/desktop, renderizando o layout selecionado com os dados reais da loja (banner, cores, atalhos, vídeos).
- Botões para alternar entre mobile e desktop, além de "Ver loja" abrindo a URL pública.
- Layouts bloqueados podem ser pré-visualizados (com marca d'água de bloqueio), mas não salvos.

## Checklist de configuração

O passo de layout entra no checklist de onboarding do dashboard apenas como concluído automaticamente (Classic é o padrão), sem adicionar um passo novo que trave o progresso.

## Detalhes técnicos

- `WhiteLabelConfig` ganha `layout?: { variant: 'classic' | 'spotlight' | 'magazine' }`, default `classic`, persistido em `app_configurations.white_label_config` por `store_id` (mesmo caminho de save já usado pelas cores).
- Novos componentes em `src/components/storefront/layouts/`: `ClassicLayout.tsx` (extraído do conteúdo atual de `src/pages/Index.tsx`), `SpotlightLayout.tsx`, `MagazineLayout.tsx`, com props idênticas (config, vídeos, favoritos, posts, ações rápidas).
- `src/pages/Index.tsx` passa a ser um seletor: carrega dados uma vez (YouTube, favoritos, feed) e renderiza a variante conforme `config.layout.variant`, com fallback para `classic` se a variante for inválida ou bloqueada pelo plano.
- Gating no cliente por `store.plan_type` (via `TenantContext`) mais validação no servidor: `save-app-config` rejeita variante paga quando a loja está em trial, evitando burlar pelo front.
- Nova aba em `src/pages/admin/AdminPersonalizacao.tsx` reutilizando os componentes de layout dentro de um wrapper com escala reduzida para o preview.
- Textos das três opções e mensagens de bloqueio adicionados em `en.json`, `pt-BR.json` e `es.json`.
