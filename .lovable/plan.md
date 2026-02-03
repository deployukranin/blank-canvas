
# Plano: Consolidar Abas do Painel Admin (Vídeos e Áudios)

## Situação Atual

O painel admin possui **4 abas separadas** relacionadas a vídeos:
- **Vídeo** (`/admin/videos-config`) - Vídeo explicativo e prazo de entrega
- **Duração** (`/admin/videos-duracao`) - Preços por tempo de vídeo
- **Categorias** (`/admin/videos-categorias`) - Categorias de vídeos E áudios juntas
- **Regras** (`/admin/videos-regras`) - O que pode/não pode nos vídeos

## Nova Estrutura Proposta

Consolidar em **2 abas principais**:

```text
+------------------------------------------+
|  Painel Admin - Menu Lateral             |
+------------------------------------------+
| - Dashboard                              |
| - Ideias                                 |
| - Pedidos                                |
| - Pagamentos PIX                         |
| - Preços VIP                             |
| - Vídeos         <- CONSOLIDADO          |
| - Áudios         <- NOVA ABA             |
| - Usuários                               |
| - Conteúdo                               |
| - Configurações                          |
+------------------------------------------+
```

---

## Aba "Vídeos" (`/admin/videos`)

Uma página única com abas internas contendo:

| Aba Interna | Conteúdo |
|-------------|----------|
| **Geral** | Vídeo explicativo, título, descrição, prazo de entrega |
| **Categorias** | Categorias de vídeos (Roleplay, Tapping, etc.) |
| **Preços** | Durações e preços (5min, 10min, 15min...) |
| **Regras** | O que pode/não pode |

---

## Aba "Áudios" (`/admin/audios`)

Uma página dedicada para áudios com:

| Seção | Conteúdo |
|-------|----------|
| **Categorias** | Categorias de áudios (Sussurros, Afirmações, etc.) |
| **Preços** | Preço base por categoria |

---

## Alterações Necessárias

### 1. Criar Nova Página Consolidada de Vídeos
**Arquivo:** `src/pages/admin/AdminVideos.tsx` (NOVO)

Esta página terá abas internas usando o componente `Tabs`:
- Importa e combina a lógica de `AdminVideosConfig`, `AdminVideosDuracao`, `AdminVideosCategorias` (parte de vídeos) e `AdminVideosRegras`
- Interface unificada com botão "Salvar" global

### 2. Criar Nova Página de Áudios
**Arquivo:** `src/pages/admin/AdminAudios.tsx` (NOVO)

Página dedicada para gerenciar:
- Categorias de áudios com ícone, nome, descrição e preço
- Funcionalidade similar à seção de áudios do atual `AdminVideosCategorias`

### 3. Atualizar Rotas
**Arquivo:** `src/App.tsx`

```text
Remover:
- /admin/videos-config
- /admin/videos-duracao
- /admin/videos-categorias
- /admin/videos-regras

Adicionar:
- /admin/videos → AdminVideos
- /admin/audios → AdminAudios
```

### 4. Atualizar Menu Lateral
**Arquivo:** `src/pages/admin/AdminLayout.tsx`

```text
Substituir no menuItems:
- 4 itens (Vídeo, Duração, Categorias, Regras)
Por:
- 2 itens (Vídeos, Áudios)
```

### 5. Remover Páginas Antigas
**Arquivos a excluir:**
- `src/pages/admin/AdminVideosConfig.tsx`
- `src/pages/admin/AdminVideosDuracao.tsx`
- `src/pages/admin/AdminVideosCategorias.tsx`
- `src/pages/admin/AdminVideosRegras.tsx`

---

## Interface Visual das Novas Páginas

### Página de Vídeos (com abas internas)

```text
+--------------------------------------------------+
|  Vídeos                               [Salvar]   |
+--------------------------------------------------+
|  [Geral] [Categorias] [Preços] [Regras]          |
+--------------------------------------------------+
|                                                  |
|  (Conteúdo da aba selecionada)                   |
|                                                  |
+--------------------------------------------------+
```

### Página de Áudios

```text
+--------------------------------------------------+
|  Áudios                               [Salvar]   |
+--------------------------------------------------+
|                                                  |
|  Categorias de Áudios              [Adicionar]   |
|  +--------------------------------------------+  |
|  | 🤫 Sussurros      R$ 29,90              [X] |  |
|  | 💝 Afirmações     R$ 34,90              [X] |  |
|  | 🌙 Para Dormir    R$ 39,90              [X] |  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/admin/AdminVideos.tsx` |
| Criar | `src/pages/admin/AdminAudios.tsx` |
| Editar | `src/pages/admin/AdminLayout.tsx` |
| Editar | `src/App.tsx` |
| Excluir | `src/pages/admin/AdminVideosConfig.tsx` |
| Excluir | `src/pages/admin/AdminVideosDuracao.tsx` |
| Excluir | `src/pages/admin/AdminVideosCategorias.tsx` |
| Excluir | `src/pages/admin/AdminVideosRegras.tsx` |
