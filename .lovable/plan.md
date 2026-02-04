

# Plano de Correção de Erros de Build e Funcionamento

## Resumo do Problema
Após suas atualizações de segurança, foram identificados **3 erros críticos de build** e alguns problemas de funcionamento relacionados a referências incorretas de tabelas e localização de arquivos.

---

## Problemas Identificados

### Erro 1: MetricsExportManager no Local Errado
**Arquivo:** `src/components/ceo/MetricsExportManager.tsx`

O arquivo contém código de **Edge Function** (Deno) mas está localizado na pasta de componentes React do frontend. Isso causa múltiplos erros de compilação porque o frontend não suporta imports de Deno.

**Erros gerados:**
- Cannot find module 'https://deno.land/std@0.168.0/http/server.ts'
- Cannot find module 'https://esm.sh/@supabase/supabase-js@2'
- Cannot find name 'Deno'

**Solução:** Deletar o arquivo `src/components/ceo/MetricsExportManager.tsx`. A Edge Function correta já existe em `supabase/functions/export-metrics/index.ts`.

---

### Erro 2: AdminRoute Buscando Coluna Inexistente
**Arquivo:** `src/components/auth/AdminRoute.tsx`

O componente busca `profiles.role`, mas a tabela `profiles` não possui essa coluna. O sistema RBAC do projeto usa a tabela separada `user_roles`.

**Erro gerado:**
- Property 'role' does not exist on type 'profiles'

**Solução:** Alterar o `AdminRoute` para consultar a tabela `user_roles` ao invés de `profiles.role`, usando a função `has_role()` já existente no banco ou fazendo a query correta.

---

### Erro 3: VIPAreaContent Referencia Tabela Inexistente
**Arquivo:** `src/components/vip/VIPAreaContent.tsx`

O componente tenta buscar dados da tabela `videos`, que não existe. O sistema de vídeos usa `youtube_videos_cache` para cache do YouTube e `vip_content` para conteúdo VIP exclusivo.

**Erros gerados:**
- Type instantiation is excessively deep
- Argument of type 'videos' is not assignable

**Solução:** Alterar a query para usar a tabela `vip_content` que já existe no banco e possui RLS configurado para usuários VIP.

---

## Detalhes Técnicos da Implementação

### Alteração 1: Deletar Arquivo Duplicado

```text
Deletar: src/components/ceo/MetricsExportManager.tsx
```

Este arquivo é uma duplicata incorreta da Edge Function que já existe em `supabase/functions/export-metrics/index.ts`.

---

### Alteração 2: Corrigir AdminRoute.tsx

Substituir a lógica de verificação de role:

**Antes (incorreto):**
```typescript
const { data: profile, error } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', session.user.id)
  .single();

const userRole = profile.role || 'user';
```

**Depois (correto):**
```typescript
const { data: roles, error } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', session.user.id);

if (error) {
  console.error("Erro ao verificar roles:", error);
  setLoading(false);
  return;
}

const userRoles = roles?.map(r => r.role) || [];
let hasAccess = false;

if (requiredRole === 'ceo') {
  hasAccess = userRoles.includes('ceo');
} else {
  hasAccess = userRoles.some(r => ['admin', 'ceo'].includes(r));
}
```

---

### Alteração 3: Corrigir VIPAreaContent.tsx

Substituir a query de vídeos:

**Antes (incorreto):**
```typescript
const { data: videos, error } = await supabase
  .from('videos')
  .select('*')
  .eq('is_vip_exclusive', true);
```

**Depois (correto):**
```typescript
const { data: vipContent, error } = await supabase
  .from('vip_content')
  .select('*');

if (error) {
  console.error("Erro ao carregar conteúdo VIP:", error);
  toast({
    variant: "destructive",
    title: "Erro de Acesso",
    description: "Não foi possível carregar o conteúdo exclusivo."
  });
} else {
  // Mapear para o formato esperado pelo componente
  const mappedContent = (vipContent || []).map(item => ({
    id: item.id,
    title: item.title,
    description: item.content,
    video_url: item.media_url || '',
    thumbnail_url: undefined,
    is_vip_exclusive: true
  }));
  setContent(mappedContent);
}
```

Também atualizar a interface `VipContent` para corresponder à estrutura da tabela real.

---

## Resumo das Alterações

| Arquivo | Ação | Motivo |
|---------|------|--------|
| `src/components/ceo/MetricsExportManager.tsx` | Deletar | Código Deno no frontend (duplicado) |
| `src/components/auth/AdminRoute.tsx` | Corrigir | Usar `user_roles` ao invés de `profiles.role` |
| `src/components/vip/VIPAreaContent.tsx` | Corrigir | Usar `vip_content` ao invés de `videos` |

---

## Resultado Esperado
Após as correções:
- Build compilando sem erros
- Rotas administrativas validando corretamente os roles
- Área VIP carregando conteúdo da tabela correta

