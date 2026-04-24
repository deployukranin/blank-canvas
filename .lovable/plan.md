

## Problema

Quando você está dentro de uma loja (`/vanila/...` ou em domínio personalizado) e clica em certos botões/links, o app navega para rotas **sem o slug** (ex: `/plans`, `/orders`, `/community`, `/admin`). Como essas rotas não existem no contexto do tenant, o `TenantGate` cai no `*` e mostra **"A loja '' não foi encontrada"** (foi exatamente o que apareceu no replay em `/plans`).

A causa raiz é navegação **hardcoded** sem usar o `basePath` do `useTenant()`.

## Arquivos com o bug

| Arquivo | Linha | Navegação errada | Correção |
|---|---|---|---|
| `src/components/vip/VIPAreaContent.tsx` | 100 | `navigate("/plans")` | `navigate(\`${basePath}/plans\`)` — **na verdade não existe rota `/plans`**, deve ser `${basePath}/vip` ou `${basePath}/admin/plans` (a rota correta de planos VIP do cliente é a página VIP) |
| `src/pages/ProdutoAssinatura.tsx` | 101 | `navigate('/orders')` | `navigate(\`${basePath}/orders\`)` |
| `src/pages/Notificacoes.tsx` | 139 | `navigate('/community')` | `navigate(\`${basePath}/community\`)` |
| `src/pages/admin/AdminLogin.tsx` | 9 | `navigate("/admin")` | redirecionar para `${basePath}/admin` (esta página é legada, melhor remover ou redirecionar via `useTenant`) |

## Plano de correção

### 1. `VIPAreaContent.tsx`
- Importar `useTenant`
- Trocar `navigate("/plans")` por `navigate(\`${basePath}/vip\`)` (a rota real para assinar VIP dentro de uma loja é `/:slug/vip`, não existe `/plans` para clientes finais)

### 2. `ProdutoAssinatura.tsx`
- Importar `useTenant`
- Trocar `navigate('/orders')` por `navigate(\`${basePath}/orders\`)`

### 3. `Notificacoes.tsx`
- Importar `useTenant`
- Trocar `navigate('/community')` por `navigate(\`${basePath}/community\`)`

### 4. `AdminLogin.tsx` (legado)
- Importar `useTenant` e redirecionar para `${basePath}/admin`

### 5. Auditoria preventiva
Após as correções, fazer um grep final por `navigate("/` e `<Link to="/` para garantir que nenhuma navegação interna do tenant esteja ignorando o `basePath`. Se encontrar mais casos em componentes que rodam dentro do contexto `/:slug/...`, aplicar o mesmo padrão.

## Resultado esperado

- Logar como criador → continua redirecionando corretamente para `/:slug/admin` (esse fluxo já estava OK no `Auth.tsx`)
- Dentro da loja, clicar em "Quero ser VIP", abrir notificações, finalizar assinatura, etc. → navega para `/:slug/<rota>` em vez de cair em rota órfã
- Acabam os 404s de "A loja '' não foi encontrada" causados por navegação interna

