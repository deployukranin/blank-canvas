
# Plano: Controle de Visibilidade das Abas de Navegacao

## Status: ✅ IMPLEMENTADO

## Objetivo

Permitir que o CEO habilite/desabilite (oculte) as abas da barra de navegacao inferior do app diretamente no Painel CEO.

## O que foi implementado

### 1. WhiteLabelContext.tsx
- Nova interface `NavTabConfig` com: id, label, path, icon, enabled, order
- Nova constante `defaultNavigationTabs` com as 5 abas padrão
- Campo `navigationTabs` adicionado ao `WhiteLabelConfig`
- Função `updateNavigationTabs()` para atualizar abas
- Função `resetNavigationTabsToDefaults()` para resetar
- Merge de dados para compatibilidade com configs antigas

### 2. BottomNav.tsx
- Agora lê abas do `config.navigationTabs`
- Filtra apenas abas com `enabled: true`
- Ordena por campo `order`

### 3. CEOPersonalizacao.tsx
- Nova aba "Navegação" com ícone de navegação
- Interface para cada aba mostrando:
  - Switch para habilitar/desabilitar
  - Seletor de ícone (Lucide ou emoji)
  - Campo para editar label
  - Indicação da rota
- Preview em tempo real da barra de navegação
- Validação: mínimo 2 abas visíveis
- Botão "Resetar para padrão"
- Botão "Salvar Navegação"

## Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/contexts/WhiteLabelContext.tsx` | +NavTabConfig, +defaultNavigationTabs, +updateNavigationTabs |
| `src/components/layout/BottomNav.tsx` | Usa config.navigationTabs |
| `src/pages/ceo/CEOPersonalizacao.tsx` | +Aba Navegação com UI completa |

