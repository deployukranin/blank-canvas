
# Plano: Limpeza de Dados Mock para Produção

## Objetivo
Remover todos os dados falsos/mock do aplicativo para deixá-lo limpo e pronto para produção. As páginas que usam esses dados ficarão vazias até que dados reais sejam adicionados.

---

## Arquivos de Dados Mock a Remover

| Arquivo | Conteúdo |
|---------|----------|
| `src/lib/mock-data.ts` | Ideias de vídeo, assinaturas, posts do feed, benefícios VIP |
| `src/lib/admin-mock-data.ts` | Usuários fake, pedidos fake, denúncias fake, estatísticas fake |

---

## Páginas Afetadas e Mudanças

### 1. Página Inicial (`src/pages/Index.tsx`)
- **Atual**: Mostra 2 posts de novidades do `mockFeedPosts`
- **Mudança**: Remover seção "Novidades" ou mostrar mensagem "Nenhuma novidade"

### 2. Página de Ideias (`src/pages/Ideias.tsx`)
- **Atual**: Lista ideias do `mockVideoIdeas`
- **Mudança**: Iniciar com lista vazia, só mostrar ideias criadas por usuários reais

### 3. Comunidade (`src/pages/Comunidade.tsx`)
- **Atual**: Mostra posts e ideias do `mockFeedPosts` e `mockForumIdeas`
- **Mudança**: Iniciar com listas vazias

### 4. Loja (`src/pages/Loja.tsx`)
- **Atual**: Lista assinaturas do `mockSubscriptions`
- **Mudança**: Mostrar mensagem "Em breve" ou lista vazia

### 5. Produto Assinatura (`src/pages/ProdutoAssinatura.tsx`)
- **Atual**: Busca produto do `mockSubscriptions`
- **Mudança**: Mostrar "Produto não encontrado" se não existir

### 6. Admin Dashboard (`src/pages/admin/AdminDashboard.tsx`)
- **Atual**: Mostra estatísticas fake (1.234 usuários, R$ 4.890, etc.)
- **Mudança**: Mostrar zeros ou buscar dados reais do banco

### 7. Admin Usuários (`src/pages/admin/AdminUsuarios.tsx`)
- **Atual**: Lista usuários fake do `mockAdminUsers`
- **Mudança**: Buscar usuários reais da tabela `profiles`

### 8. Admin Pedidos (`src/pages/admin/AdminPedidos.tsx`)
- **Atual**: Lista pedidos fake do `mockAdminOrders`
- **Mudança**: Buscar pedidos reais da tabela `custom_orders`

### 9. Admin Conteúdo (`src/pages/admin/AdminConteudo.tsx`)
- **Atual**: Lista posts do `mockFeedPosts`
- **Mudança**: Iniciar vazio (sem tabela de posts no banco ainda)

### 10. Admin Denúncias (`src/pages/admin/AdminDenuncias.tsx`)
- **Atual**: Lista denúncias fake do `mockAdminReports`
- **Mudança**: Iniciar vazio

---

## Mudanças Técnicas Detalhadas

### Fase 1: Atualizar Páginas Públicas

**`src/pages/Index.tsx`**
```typescript
// REMOVER: import { mockFeedPosts } from '@/lib/mock-data';
// REMOVER: seção "Novidades" com mockFeedPosts
// OU: mostrar "Nenhuma novidade ainda"
```

**`src/pages/Ideias.tsx`**
```typescript
// ANTES: const [ideas, setIdeas] = useState<VideoIdea[]>(mockVideoIdeas);
// DEPOIS: const [ideas, setIdeas] = useState<VideoIdea[]>([]);
```

**`src/pages/Comunidade.tsx`**
```typescript
// ANTES: useState com mockFeedPosts e mockForumIdeas
// DEPOIS: useState com arrays vazios []
```

**`src/pages/Loja.tsx`**
```typescript
// ANTES: lista mockSubscriptions
// DEPOIS: lista vazia ou mensagem "Em breve"
```

**`src/pages/ProdutoAssinatura.tsx`**
```typescript
// ANTES: busca em mockSubscriptions
// DEPOIS: sempre mostra "Produto não encontrado"
```

### Fase 2: Atualizar Páginas Admin

**`src/pages/admin/AdminDashboard.tsx`**
```typescript
// REMOVER: import { mockAdminStats, mockAdminOrders } from '@/lib/admin-mock-data';
// ANTES: mockAdminStats.totalUsers, mockAdminStats.revenue
// DEPOIS: estatísticas zeradas ou consulta real ao banco
const stats = {
  totalUsers: 0,
  totalVIP: 0,
  totalOrders: 0,
  revenue: 0,
  pendingOrders: 0,
  ideasCount: 0,
  newUsersToday: 0,
};
```

**`src/pages/admin/AdminUsuarios.tsx`**
```typescript
// REMOVER: import { mockAdminUsers } from '@/lib/admin-mock-data';
// ANTES: useState(mockAdminUsers)
// DEPOIS: useState([]) + useEffect para buscar da tabela profiles
```

**`src/pages/admin/AdminPedidos.tsx`**
```typescript
// ANTES: useState(mockAdminOrders)
// DEPOIS: useState([]) + useEffect para buscar da tabela custom_orders
```

**`src/pages/admin/AdminConteudo.tsx`**
```typescript
// ANTES: useState(mockFeedPosts)
// DEPOIS: useState([])
```

**`src/pages/admin/AdminDenuncias.tsx`**
```typescript
// ANTES: useState(mockAdminReports)
// DEPOIS: useState([])
```

### Fase 3: Limpeza Final

**Manter os arquivos de tipos** (interfaces ainda são úteis):
- Manter `VideoIdea`, `FeedPost`, `ForumIdea`, etc. como interfaces
- Remover apenas os arrays de dados mock

**Remover categorias mock não usadas**:
- `mockVIPBenefits` → manter (usado em VIP)
- `mockVideoCategories` → verificar uso
- `mockAudioCategories` → verificar uso
- `mockSubscriptions` → remover dados, manter tipo

---

## Dashboard Admin: Buscar Dados Reais

Para o dashboard mostrar dados reais, vou adicionar consultas simples:

```typescript
// Contar usuários
const { count: totalUsers } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true });

// Contar VIPs ativos
const { count: totalVIP } = await supabase
  .from('vip_subscriptions')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'active')
  .gt('expires_at', new Date().toISOString());

// Contar pedidos e receita
const { data: orders } = await supabase
  .from('custom_orders')
  .select('amount_cents, status');
```

---

## Resultado Final

Após as mudanças:
- Páginas públicas: mostram listas vazias ou mensagens "Em breve"
- Dashboard admin: mostra zeros ou dados reais do banco
- Nenhum dado fake aparece no app
- App pronto para receber dados reais de produção

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/Index.tsx` | Remover seção Novidades com mock |
| `src/pages/Ideias.tsx` | Iniciar com array vazio |
| `src/pages/Comunidade.tsx` | Iniciar com arrays vazios |
| `src/pages/Loja.tsx` | Iniciar vazio ou "Em breve" |
| `src/pages/ProdutoAssinatura.tsx` | Remover busca em mock |
| `src/pages/admin/AdminDashboard.tsx` | Zeros ou dados reais |
| `src/pages/admin/AdminUsuarios.tsx` | Buscar da tabela profiles |
| `src/pages/admin/AdminPedidos.tsx` | Buscar da tabela custom_orders |
| `src/pages/admin/AdminConteudo.tsx` | Array vazio |
| `src/pages/admin/AdminDenuncias.tsx` | Array vazio |
| `src/lib/mock-data.ts` | Manter tipos, remover dados |
| `src/lib/admin-mock-data.ts` | Manter tipos, remover dados |
