
# Plano: Integrar Loja Shopify via Iframe

## Visao Geral

Vamos transformar a aba "Loja" para exibir sua loja Shopify diretamente dentro do app via iframe fullscreen. A loja atual de assinaturas digitais sera substituida completamente.

## Importante: Limitacao de Seguranca

Muitas lojas Shopify bloqueiam carregamento via iframe (header `X-Frame-Options`). Se isso acontecer:
- O iframe ficara em branco
- Implementaremos um botao de fallback "Abrir Loja" que abre em nova aba

**Recomendacao:** Teste sua URL da Shopify para verificar se permite iframe. Se nao funcionar, podemos usar a abordagem de abrir em nova aba ou um WebView nativo (se for app mobile).

---

## Etapas de Implementacao

### 1. Adicionar URL da Shopify nas Configuracoes

**Arquivo:** `src/contexts/WhiteLabelContext.tsx`

Adicionar nova propriedade no `WhiteLabelConfig`:

```text
shopify: {
  enabled: boolean;
  storeUrl: string; // Ex: "https://sualojaexemplo.myshopify.com"
}
```

Isso permitira configurar a URL da loja pelo painel CEO.

---

### 2. Criar Pagina de Loja Shopify Embed

**Arquivo:** `src/pages/LojaShopify.tsx` (novo)

Componente que:
- Exibe um iframe fullscreen com a loja Shopify
- Mostra loading spinner enquanto carrega
- Detecta erro de carregamento e oferece botao "Abrir em Nova Aba"
- Mantem a navegacao inferior (BottomNav) visivel

```text
Estrutura:
+------------------------------------------+
|              Navbar Inferior             |
+------------------------------------------+
|                                          |
|     [iframe fullscreen: Shopify]         |
|                                          |
|     (ou botao fallback se bloqueado)     |
|                                          |
+------------------------------------------+
|   Home | Custom's | Loja | Comunidade    |
+------------------------------------------+
```

---

### 3. Atualizar Roteamento

**Arquivo:** `src/App.tsx`

- Manter rota `/loja` mas renderizar `LojaShopify` quando Shopify estiver habilitado
- Fallback para loja atual se Shopify desabilitado

---

### 4. Adicionar Configuracao no Painel CEO

**Arquivo:** `src/pages/ceo/CEOLoja.tsx`

Adicionar secao no topo:
- Toggle "Usar Loja Shopify Externa"
- Campo para URL da loja Shopify
- Botao para testar se URL funciona em iframe

---

## Arquivos que Serao Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/contexts/WhiteLabelContext.tsx` | Adicionar config `shopify` |
| `src/pages/LojaShopify.tsx` | **Novo** - Componente iframe |
| `src/pages/Loja.tsx` | Condicional para Shopify ou loja atual |
| `src/pages/ceo/CEOLoja.tsx` | Campos de config Shopify |
| `src/App.tsx` | Importar novo componente (se necessario) |

---

## Secao Tecnica

### Deteccao de Erro de Iframe

Como iframes nao disparam erro quando bloqueados por `X-Frame-Options`, usaremos:
1. Timeout de 5 segundos
2. Verificacao via `onLoad` do iframe
3. Se nao carregar, mostrar botao de fallback

### Tratamento de URLs

- Aceitar URLs com ou sem protocolo
- Normalizar para HTTPS
- Validar formato de URL antes de salvar

### Persistencia

A configuracao sera salva no `localStorage` junto com as outras configs do WhiteLabel, permitindo que o CEO configure pelo painel.

---

## Resultado Esperado

Apos implementacao:
1. CEO acessa `/ceo/loja`
2. Ativa "Usar Loja Shopify"
3. Insere URL: `https://sualojaexemplo.myshopify.com`
4. Salva
5. Usuarios ao clicar em "Loja" veem a Shopify integrada

Se o iframe for bloqueado, usuarios verao:
- Mensagem explicativa
- Botao "Abrir Loja" que abre em nova aba
