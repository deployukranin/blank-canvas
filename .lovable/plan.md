
# Plano: Controle de Visibilidade das Abas de Navegacao

## Objetivo

Permitir que o CEO habilite/desabilite (oculte) as abas da barra de navegacao inferior do app diretamente no Painel CEO.

## Estrutura Atual

As 5 abas da navegacao inferior sao:

```text
+--------+----------+-------+------------+--------+
| Inicio | Custom's | Loja  | Comunidade | Perfil |
+--------+----------+-------+------------+--------+
```

Atualmente sao fixas e sempre visiveis. Precisamos adicionar controle de visibilidade.

## Nova Interface no Painel CEO

Adicionar uma nova aba "Navegacao" na pagina de Personalizacao:

```text
+----------+-------+--------+----------+------------+-----------+
| Branding | Cores | Icones | Explorar | Comunidade | Navegacao |
+----------+-------+--------+----------+------------+-----------+
```

Ou, alternativamente, integrar na aba "Icones" existente como uma secao:

```text
Aba Icones
+--------------------------------------------------+
| Icones de Navegacao                              |
|                                                  |
| +----------------------------------------------+ |
| | [Switch] Inicio       [icon picker]          | |
| | [Switch] Custom's     [icon picker]          | |
| | [Switch] Loja         [icon picker]          | |
| | [Switch] Comunidade   [icon picker]          | |
| | [Switch] Perfil       [icon picker]          | |
| +----------------------------------------------+ |
|                                                  |
| Icones de Acoes Rapidas                          |
| ...                                              |
+--------------------------------------------------+
```

## Alteracoes Necessarias

### 1. WhiteLabelContext - Adicionar Configuracao de Abas

Criar nova interface e adicionar ao config:

```typescript
export interface NavTabConfig {
  id: string;
  label: string;
  path: string;
  icon: IconItem;
  enabled: boolean;
  order: number;
}

// Adicionar ao WhiteLabelConfig
navigationTabs: NavTabConfig[];
```

**Valores padrao:**
```typescript
const defaultNavigationTabs: NavTabConfig[] = [
  { id: 'home', label: 'Inicio', path: '/', icon: defaultIcons.navHome, enabled: true, order: 0 },
  { id: 'customs', label: "Custom's", path: '/customs', icon: defaultIcons.navCustoms, enabled: true, order: 1 },
  { id: 'loja', label: 'Loja', path: '/loja', icon: defaultIcons.navLoja, enabled: true, order: 2 },
  { id: 'comunidade', label: 'Comunidade', path: '/comunidade', icon: defaultIcons.navComunidade, enabled: true, order: 3 },
  { id: 'perfil', label: 'Perfil', path: '/perfil', icon: defaultIcons.navPerfil, enabled: true, order: 4 },
];
```

### 2. WhiteLabelContext - Adicionar Funcao de Update

```typescript
updateNavigationTabs: (tabs: NavTabConfig[]) => void;
```

### 3. BottomNav.tsx - Consumir Configuracao

Modificar para ler as abas do contexto e filtrar apenas as habilitadas:

```typescript
const { config } = useWhiteLabel();

// Usar abas do config, ordenadas e filtradas
const navItems = config.navigationTabs
  .filter(tab => tab.enabled)
  .sort((a, b) => a.order - b.order);
```

### 4. CEOPersonalizacao.tsx - Adicionar Aba de Navegacao

Nova aba com controles:

```text
+--------------------------------------------------+
| Abas de Navegacao                                |
|                                                  |
| Configure quais abas aparecem na barra inferior  |
|                                                  |
| +----------------------------------------------+ |
| | [=] Inicio                                   | |
| |     Path: /                                  | |
| |     [Switch: Visivel]  [Icone: Home]         | |
| +----------------------------------------------+ |
| | [=] Custom's                                 | |
| |     Path: /customs                           | |
| |     [Switch: Visivel]  [Icone: Video]        | |
| +----------------------------------------------+ |
| | [=] Loja                                     | |
| |     Path: /loja                              | |
| |     [Switch: Visivel]  [Icone: ShoppingBag]  | |
| +----------------------------------------------+ |
| ...                                              |
|                                                  |
| [Resetar para padrao]         [Salvar Navegacao] |
+--------------------------------------------------+
```

**Funcionalidades:**
- Switch para habilitar/desabilitar cada aba
- Alterar icone de cada aba (reutilizar icon picker existente)
- Arrastar para reordenar (opcional, usando drag-and-drop)
- Editar label de cada aba

---

## Arquivos a Modificar

| Acao   | Arquivo                                    |
|--------|--------------------------------------------|
| Editar | `src/contexts/WhiteLabelContext.tsx`       |
| Editar | `src/components/layout/BottomNav.tsx`      |
| Editar | `src/pages/ceo/CEOPersonalizacao.tsx`      |

---

## Detalhes Tecnicos

### Interface NavTabConfig

```typescript
export interface NavTabConfig {
  id: string;           // Identificador unico (home, customs, loja, etc)
  label: string;        // Texto exibido (Inicio, Custom's, etc)
  path: string;         // Rota de navegacao (/, /customs, etc)
  icon: IconItem;       // Icone (Lucide ou emoji)
  enabled: boolean;     // Se esta visivel
  order: number;        // Ordem de exibicao
}
```

### Migracao de Dados

O codigo deve manter compatibilidade com configs antigas que nao tem `navigationTabs`. Ao carregar:

```typescript
// No WhiteLabelProvider
const mergedConfig = {
  ...defaultConfig,
  ...parsed,
  navigationTabs: parsed.navigationTabs || defaultNavigationTabs,
};
```

### Validacao

- Sempre manter pelo menos 2 abas visiveis
- A aba "Perfil" nao pode ser desabilitada (ou mostrar aviso)
- Mostrar preview em tempo real da barra inferior

---

## Fluxo do Usuario

```text
1. CEO acessa /ceo/personalizacao
2. Clica na aba "Navegacao"
3. Ve lista de todas as abas com switches
4. Desativa as abas que quer ocultar
5. Opcionalmente muda icones e labels
6. Clica em "Salvar Navegacao"
7. App atualiza imediatamente a barra inferior
```

---

## Resumo

Esta implementacao adiciona controle granular sobre a barra de navegacao, permitindo:

- Ocultar abas desnecessarias (ex: se nao usa Loja, pode esconder)
- Personalizar labels (ex: mudar "Custom's" para "Pedidos")
- Personalizar icones individualmente
- Reordenar a posicao das abas
- Tudo sem precisar de codigo, diretamente no painel CEO
