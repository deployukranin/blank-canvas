# Remover YouTube preview de /customs

## Objetivo
Eliminar a opção de video preview associada ao YouTube na seção "Como Funciona" de `/customs`, deixando apenas a imagem como preview possível. Isso remove UI e dados legados.

## Mudanças

### 1. Configuração padrão (`src/lib/video-config.ts`)
- Remover o default `previewVideoUrl` apontando para YouTube embed (`https://www.youtube.com/embed/dQw4w9WgXcQ`).
- Inicializar `previewVideoUrl` como string vazia.
- Garantir que `previewType` default continue `'image'`.
- Remover comentários que mencionem YouTube na seção de preview.

### 2. Admin de customs (`src/pages/admin/AdminCustoms.tsx`)
- Remover o toggle "Imagem / Vídeo" (Tipo de Mídia) que exibe "YouTube" como opção.
- Deixar a seção de preview configurando apenas imagem.
- Manter o botão de upload de imagem, título e descrição.
- Remover o campo/upload de preview de vídeo (já que não deve mais existir a opção).
- Remover a lógica que muda `previewType` entre `'video'` e `'image'`.

### 3. Página de customs (`src/pages/Customs.tsx`)
- Remover a renderização condicional de `<VideoPlayer>` para `previewType === 'video'`.
- Mostrar apenas a imagem de preview (quando houver) ou o `<VideoPlaceholder>`.
- Limpar os estados/efeitos que resolvem `previewVideoSrc`, mantendo apenas `previewImageSrc`.

### 4. Traduções
- Revisar chaves em `customsAdmin` em `src/i18n/locales/en.json`, `es.json` e `pt-BR.json`.
- Remover/adicionar chaves: `videoLabel`, `mediaType`, `videoFile`, `uploadVideo`, `currentFile` (vídeo) se ainda existirem.
- Adicionar/ajustar `previewTypeImageOnly` ou usar texto existente focado em imagem.

### 5. Verificação
- Abrir `/customs` de uma loja com preview habilitado: deve exibir apenas a imagem (ou placeholder) e nunca um player de vídeo.
- Abrir `/admin/customs` (ou `/customize` no admin do tenant): deve mostrar apenas upload de imagem, sem opção de vídeo/YouTube.
- Verificar que não existam mais strings "YouTube" no contexto de preview de customs.

## Riscos / Notas
- Configurações antigas salvas com `previewType === 'video'` vão passar a serem ignoradas pelo frontend; o fallback será mostrar placeholder. Se necessário, migrar dados antigos para `previewType === 'image'`, mas não é exigido.
- O upload de vídeo como preview pode ter sido usado por algum tenant; a remoção desativa essa funcionalidade.
