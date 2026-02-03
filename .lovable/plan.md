
# Plano: Separar Configuração YouTube entre CEO e Admin

## Situacao Atual

A pagina `AdminYoutube.tsx` atualmente:
- Permite configurar o Channel ID (campo de input)
- Mostra o Channel ID configurado
- Lista os videos e gerencia categorias

O problema: o Channel ID nao deve ser visivel/editavel no painel Admin.

## Nova Estrutura

```text
Painel CEO (Integracoes)          Painel Admin (YouTube)
+------------------------+        +------------------------+
| Channel ID: UC...      |        | Galeria de Videos      |
| [Campo editavel]       |        | 150 videos encontrados |
| Limite por categoria   |        |                        |
| Badge "Novo" dias      |   -->  | [Gerenciar Categorias] |
| etc...                 |        | - Roleplay (32)        |
|                        |        | - Tapping (28)         |
| [Salvar]               |        | - Eating (45)          |
+------------------------+        +------------------------+

CEO configura o canal       Admin apenas gerencia
e parametros gerais         videos e categorias
```

---

## Alteracoes Necessarias

### 1. Refatorar AdminYoutube.tsx

**Remover:**
- Secao de configuracao do Channel ID
- Input do Channel ID
- Exibicao do Channel ID configurado
- Estado local `channelId` e `tempChannelId`
- localStorage para channel ID

**Adicionar:**
- Consumir `useWhiteLabel()` para obter o `channelId` da config do CEO
- Estado vazio quando canal nao configurado (com instrucao para ir ao painel CEO)

### 2. Manter no AdminYoutube

- Botao "Atualizar Videos"
- Lista de videos com thumbnails
- Gerenciador de categorias (`YouTubeCategoryManager`)
- Salvar categorias (no contexto WhiteLabel, nao localStorage)

### 3. Atualizar Integracao de Categorias

Atualmente as categorias sao salvas em `localStorage` separado. Devemos:
- Usar o mesmo contexto WhiteLabel que o CEO usa
- As categorias ficam em `config.youtube.categories` e `config.youtube.videoCategoryMap`

---

## Interface Visual Proposta

### Admin YouTube (sem canal configurado)

```text
+--------------------------------------------------+
|  YouTube                                         |
+--------------------------------------------------+
|                                                  |
|      [icone YouTube grande cinza]                |
|                                                  |
|      Canal nao configurado                       |
|                                                  |
|      O ID do canal do YouTube deve ser           |
|      configurado no Painel CEO em Integracoes.   |
|                                                  |
+--------------------------------------------------+
```

### Admin YouTube (com canal configurado)

```text
+--------------------------------------------------+
|  YouTube                          [Atualizar]    |
+--------------------------------------------------+
|                                                  |
|  Videos do Canal                                 |
|  150 videos encontrados                          |
|                                                  |
|  +------+ +------+ +------+ +------+ +------+    |
|  |thumb1| |thumb2| |thumb3| |thumb4| |thumb5|    |
|  +------+ +------+ +------+ +------+ +------+    |
|  titulo.. titulo.. titulo.. titulo.. titulo..    |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  Gerenciar Categorias               [Salvar]     |
|  +--------------------------------------------+  |
|  | Roleplay     | 32 videos      [Editar]     |  |
|  | Tapping      | 28 videos      [Editar]     |  |
|  | Eating       | 45 videos      [Editar]     |  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

---

## Codigo - Alteracoes

### AdminYoutube.tsx

```typescript
// ANTES
const [channelId, setChannelId] = useState(() => {
  return localStorage.getItem(STORAGE_KEY_CHANNEL) || "";
});

// DEPOIS
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';

const { config, updateYouTube } = useWhiteLabel();
const channelId = config.youtube?.channelId?.trim() || "";
```

**Remover completamente:**
- STORAGE_KEY_CHANNEL
- tempChannelId state
- handleSaveChannel function
- Secao "Canal do YouTube" com input

**Ajustar salvar categorias:**
```typescript
// ANTES - localStorage
localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(...));

// DEPOIS - WhiteLabel context
updateYouTube({
  ...config.youtube,
  categories: categorizationDraft.categories,
  videoCategoryMap: categorizationDraft.videoCategoryMap,
});
```

---

## Resumo de Arquivos

| Acao | Arquivo |
|------|---------|
| Editar | `src/pages/admin/AdminYoutube.tsx` |

Nenhum arquivo novo sera criado. A configuracao do Channel ID ja existe no CEOIntegracoes.

---

## Beneficios

1. **Separacao de responsabilidades**: CEO configura, Admin gerencia
2. **Seguranca**: Channel ID nao fica visivel para admins comuns
3. **Dados centralizados**: Categorias ficam no mesmo contexto WhiteLabel
4. **Menos duplicacao**: Remove localStorage redundante
