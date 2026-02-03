
# Plano de Alterações no Painel Admin

## Resumo
Este plano aborda três modificações no painel administrativo:
1. Remover a seção "Configurações Gerais" da página de configurações
2. Remover a opção de tornar usuário admin na página de usuários
3. Unificar as categorias de vídeos e áudios na página de categorias

---

## 1. Remover "Configurações Gerais" em /admin/configuracoes

**Arquivo:** `src/pages/admin/AdminConfiguracoes.tsx`

A seção "Configurações Gerais" (linhas 37-82) será removida completamente, incluindo:
- Nome do Site
- Descrição  
- Preço VIP Mensal

As seções restantes permanecerão:
- Notificações
- Configurações de Conteúdo

Também serão removidos os estados não utilizados (`siteName`, `siteDescription`, `vipPrice`) e o ícone `Palette` que não será mais necessário.

---

## 2. Remover opção de Admin em /admin/usuarios

**Arquivo:** `src/pages/admin/AdminUsuarios.tsx`

Alterações:
- Remover o botão "Tornar Admin" de cada card de usuário (linhas 150-158)
- Remover a função `toggleAdmin` que não será mais utilizada
- Remover o filtro "Admin" das opções de filtro (manter apenas "Todos", "VIP" e "Regular")
- Remover o card de estatísticas de "Admins" (linhas 54-58)
- Manter apenas a badge visual indicando se um usuário é admin (exibição apenas, sem ação)

---

## 3. Unificar Categorias de Vídeos e Áudios

**Arquivos:** 
- `src/lib/video-config.ts`
- `src/pages/admin/AdminVideosCategorias.tsx`

### Alterações na Configuração

Adicionar uma nova interface `AudioCategory` e um array `audioCategories` na configuração, espelhando a estrutura das categorias de vídeos:

```text
+-----------------------------------+
|         VideoConfig               |
+-----------------------------------+
| - categories (vídeos)             |
| - audioCategories (áudios) [NOVO] |
| - durations                       |
| - rules                           |
+-----------------------------------+
```

### Alterações na Interface Admin

A página `AdminVideosCategorias.tsx` será reformulada para exibir duas seções:

```text
+------------------------------------------+
|  Categorias                              |
+------------------------------------------+
|                                          |
|  [Categorias de Vídeos]     [Adicionar]  |
|  +---------------------------------+     |
|  | 🎭 Roleplay                     | [X] |
|  | 👆 Tapping                      | [X] |
|  | ...                             |     |
|  +---------------------------------+     |
|                                          |
|  [Categorias de Áudios]     [Adicionar]  |
|  +---------------------------------+     |
|  | 🤫 Sussurros                    | [X] |
|  | 💝 Afirmações                   | [X] |
|  | ...                             |     |
|  +---------------------------------+     |
|                                          |
+------------------------------------------+
```

Cada seção terá:
- Título identificando o tipo (Vídeos/Áudios)
- Ícone distintivo (Video/Headphones)
- Botão de adicionar independente
- Lista de categorias editáveis com campos para ícone, nome e descrição

---

## Detalhes Técnicos

### Novas Interfaces e Tipos

```typescript
// Em video-config.ts
export interface AudioCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
}

export interface VideoConfig {
  // ... campos existentes
  audioCategories: AudioCategory[]; // NOVO
}
```

### Categorias de Áudio Padrão

As categorias de áudio serão importadas do `mock-data.ts` existente como valores padrão:
- Sussurros (🤫) - R$ 29,90
- Afirmações (💝) - R$ 34,90
- Para Dormir (🌙) - R$ 39,90
- Sons Específicos (🎵) - R$ 24,90

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/AdminConfiguracoes.tsx` | Remover seção "Configurações Gerais" |
| `src/pages/admin/AdminUsuarios.tsx` | Remover botão e lógica de admin |
| `src/lib/video-config.ts` | Adicionar `audioCategories` |
| `src/pages/admin/AdminVideosCategorias.tsx` | Exibir ambas as seções |
