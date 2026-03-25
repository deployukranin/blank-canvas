

# Plano: Aplicar Estilo de Banner do LANCY STUDIO + Auto-scroll Suave no Carrossel

## O que muda

### 1. Refatorar o Hero Banner da Index para o estilo LANCY STUDIO

O banner atual e pequeno (h-48) e usa o componente Embla Carousel padrao. O LANCY STUDIO usa um banner fullwidth com altura generosa (65vh), navegacao com botoes transparentes com blur, indicadores de dot animados, e transicao por opacity (fade) com auto-play a cada 6 segundos.

**Alteracoes em `src/pages/Index.tsx`:**
- Substituir o bloco `{/* Hero Card */}` pelo novo componente `HeroBanner`
- Remover imports de Carousel/CarouselContent/CarouselItem/CarouselPrevious/CarouselNext (do banner; manter se usado em outro lugar)
- Manter o restante da pagina intacto

**Criar `src/components/layout/HeroBanner.tsx`:**
- Banner com altura `h-[55vh] min-h-[300px]` (adaptado para mobile, menor que o LANCY que e desktop-first)
- Transicao por fade (opacity) entre slides, nao swipe
- Botoes prev/next transparentes com `bg-background/30 backdrop-blur-sm` sobre o banner
- Indicadores dot na parte inferior: dot ativo = barra larga com cor primary, inativos = pontos pequenos
- Gradiente overlay: `from-background via-background/60 to-transparent` de baixo para cima + gradiente lateral
- Texto de boas-vindas posicionado no canto inferior esquerdo sobre o gradiente
- Auto-play: troca de slide a cada 6 segundos
- Usa as mesmas imagens dinamicas do config (`config.bannerImages` / `config.bannerImage` / fallback `heroImage`)

### 2. Adicionar auto-scroll suave ao carrossel de videos

O carrossel de videos (`VideoGalleryCarousel`) ja usa Embla Carousel. Vou adicionar o plugin `embla-carousel-autoplay` para que ele role sozinho suavemente.

**Instalar:** `embla-carousel-autoplay` (dependencia npm)

**Alterar `src/components/video/VideoGalleryCarousel.tsx`:**
- Importar e configurar o plugin Autoplay com `delay: 4000`, `stopOnInteraction: true`
- Passar o plugin ao componente `<Carousel plugins={[autoplay]}>` 

## Secao Tecnica

### Estrutura do HeroBanner
```text
<div relative overflow-hidden h-[55vh]>
  {slides.map → <div absolute inset-0 opacity fade 700ms>}
  <gradient overlays>
  <text bottom-left>
  <btn prev transparent blur left-4>
  <btn next transparent blur right-4>
  <dots bottom-center>
</div>
```

### Arquivos alterados
1. **Criar** `src/components/layout/HeroBanner.tsx` — novo componente de banner estilo LANCY
2. **Editar** `src/pages/Index.tsx` — trocar bloco do banner pelo novo componente
3. **Editar** `src/components/video/VideoGalleryCarousel.tsx` — adicionar plugin autoplay

