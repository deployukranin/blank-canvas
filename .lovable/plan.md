# Sincronizar traduções do Greeting, Subtítulo e labels das caixas de texto (PT/EN/ES)

## O que foi verificado

- `admin.banners.defaultGreeting` e `defaultSubtitle` existem e estão traduzidos nos três idiomas.
- Faltam chaves usadas na tela de personalização: `admin.banners.subtitleLabel` e `admin.preview.description` — hoje caem no texto em inglês embutido no código, em qualquer idioma.
- Os placeholders dos campos "Título / Saudação" e "Subtítulo" estão fixos em inglês (`Welcome! 🤍`, `Relax with quality content`), assim como o fallback do preview.
- O switch de cada banner usa `common.active` ("Ativas"/"Activas" — plural feminino, errado para um banner) e o estado desligado é o texto fixo `Off`.
- `src/pages/admin/AdminBanners.tsx` é uma página antiga sem rota, com textos em português fixos e os mesmos campos de greeting/subtítulo.

## O que será feito

1. Adicionar as chaves faltantes em PT/EN/ES: `admin.banners.subtitleLabel`, `admin.preview.description`, `admin.banners.enabled` / `admin.banners.disabled`.
2. Trocar no `AdminPersonalizacao.tsx` os textos fixos por `t(...)`: label do subtítulo, descrição do preview, estados do switch do banner.
3. Usar os defaults traduzidos como placeholder dos inputs e como fallback do texto no preview (mesmo helper de `src/lib/hero-defaults.ts`), em vez das strings em inglês.
4. Remover a página órfã `AdminBanners.tsx` (sem rota, duplicada e não traduzida) para não haver segunda fonte de textos dessorincronizada.
5. Validar: script de checagem comparando as três locales (mesmas chaves, sem valores vazios) e conferência visual da aba Banners/Preview em PT, EN e ES.

## Detalhes técnicos

- Arquivos: `src/i18n/locales/{en,pt-BR,es}.json`, `src/pages/admin/AdminPersonalizacao.tsx`, exclusão de `src/pages/admin/AdminBanners.tsx`.
- A home (`src/pages/Index.tsx`) já usa `isLegacyGreeting`/`isLegacySubtitle` com as chaves traduzidas — sem mudança de lógica, apenas garantia de paridade das chaves.
- Nenhuma alteração em banco ou nos valores já salvos por lojas que personalizaram os textos.
