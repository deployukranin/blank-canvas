

## Diagnóstico: Problemas na Página de Pagamentos Stripe

### Problemas Encontrados

1. **Store ID nunca é encontrado (bug principal)** — A página tenta buscar o `store_id` via `store_admins` e `stores.created_by`, mas ambas retornam vazio para o usuário logado. O **TenantContext** já tem o `store` carregado (via slug da URL `/teste321`), mas a página não o utiliza. Resultado: fica eternamente em "Verificando status...".

2. **Warning de ref no GlassCard** — O componente `GlassCard` é um function component sem `forwardRef`, mas o Radix `TabsContent` tenta passar ref para ele. Precisa usar `React.forwardRef`.

3. **CORS headers incompletos** — As edge functions usam headers CORS antigos sem os headers extras do Supabase SDK (`x-supabase-client-platform`, etc.), o que pode causar falhas silenciosas em certos browsers.

### Plano de Correção

#### 1. Usar TenantContext para resolver store_id
- **Arquivo**: `src/pages/admin/AdminPagamentosPix.tsx`
- Importar `useTenant` e usar `store?.id` do contexto em vez de fazer queries separadas
- Remover o `useEffect` que busca `store_id` manualmente
- Se `store` do tenant for `null`, mostrar mensagem de erro em vez de loading infinito

#### 2. Corrigir GlassCard com forwardRef
- **Arquivo**: `src/components/ui/GlassCard.tsx`
- Envolver com `React.forwardRef` para eliminar o warning

#### 3. Atualizar CORS headers nas Edge Functions
- **Arquivos**: `stripe-connect-status`, `stripe-connect-onboarding`, `stripe-create-checkout`, `stripe-webhook`
- Adicionar headers completos do Supabase SDK

#### 4. Re-deploy das Edge Functions
- Deploy de todas as funções Stripe após as correções

### Detalhes Técnicos

**Store ID resolution (antes → depois)**:
```text
ANTES: useEffect → query store_admins → query stores → setStoreId
DEPOIS: const { store } = useTenant(); // store.id já disponível
```

**GlassCard forwardRef**:
```text
ANTES: export const GlassCard = ({ ... }: GlassCardProps) => { ... }
DEPOIS: export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(...)
```

