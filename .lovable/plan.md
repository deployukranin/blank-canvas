

## Adicionar espaços de anúncio nas abas Avisos, Ideias e Vídeos

Inserir `AdPlaceholder` de forma discreta nas seções que ficaram sem anúncios.

### Mudanças

1. **`src/pages/Comunidade.tsx`**
   - **Aba Avisos** (linha ~866): Inserir um `AdPlaceholder` horizontal após o 2º aviso (intercalado entre os cards)
   - **Aba Ideias** (linha ~977): Inserir um `AdPlaceholder` horizontal após o ranking/filtros, antes da lista de ideias
   - **Aba Vídeos** (linha ~862): Inserir um `AdPlaceholder` horizontal abaixo do `VideoGalleryPanel`
   - Importar `AdPlaceholder` de `@/components/ads/AdBanner`

2. **`src/pages/Ideias.tsx`**
   - Inserir um `AdPlaceholder` horizontal entre o formulário de envio e a lista de ideias (após linha ~146)
   - Importar `AdPlaceholder`

3. **`src/pages/Videos.tsx`**
   - Inserir um `AdPlaceholder` horizontal entre a seção de regras e a seção de categorias (após linha ~281)
   - Importar `AdPlaceholder`

### Posicionamento UX
- Anúncios aparecem em pausas naturais de conteúdo (entre seções), nunca interrompendo listas ou formulários
- Formato horizontal (`90px`) para manter discreto
- Classe `my-4` para espaçamento adequado

