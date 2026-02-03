
# Plano: Login Unificado (Admin + Usuário)

## Objetivo
Permitir que admins e usuários comuns façam login pelo mesmo formulário, sem precisar selecionar uma aba separada. O sistema detecta automaticamente o tipo de conta.

---

## Como vai funcionar

1. **Formulário único de login** - Apenas duas abas: "Entrar" e "Criar Conta"
2. **Detecção automática** - Ao fazer login:
   - Primeiro verifica se são credenciais de admin/CEO (configuradas no painel CEO)
   - Se não forem, tenta autenticar normalmente via backend
3. **Redirecionamento inteligente**:
   - Admin → vai para `/admin`
   - CEO → vai para `/ceo`
   - Usuário comum → vai para `/` (home)

---

## Fluxo visual

```text
┌─────────────────────────────────┐
│         Bem-vindo!              │
│   Entre ou crie sua conta       │
│                                 │
│  ┌─────────┐ ┌─────────────┐    │
│  │ Entrar  │ │ Criar Conta │    │
│  └─────────┘ └─────────────┘    │
│                                 │
│  Email: [________________]      │
│  Senha: [________________]      │
│                                 │
│  [        Entrar        ]       │
└─────────────────────────────────┘
```

---

## Mudanças Técnicas

### 1. Arquivo: `src/pages/Auth.tsx`

- **Remover** a terceira aba "Admin" do componente `Tabs`
- **Modificar** `handleLogin` para:
  1. Verificar se email/senha correspondem às credenciais admin ou CEO
  2. Se sim, usar `loginAsAdmin()` e redirecionar para painel apropriado
  3. Se não, fazer login normal via Supabase
  4. Após login normal, consultar `user_roles` para verificar se tem papel admin/CEO e redirecionar

### 2. Lógica de detecção no `handleLogin`:

```text
1. Usuário digita email + senha
2. Verificar contra adminCredentials (WhiteLabel)
   ├─ Match como CEO → loginAsAdmin(ceo) → /ceo
   ├─ Match como Admin → loginAsAdmin(admin) → /admin
   └─ Sem match → continuar com Supabase Auth
3. Se Supabase Auth sucesso:
   ├─ Buscar roles do user_roles
   ├─ Se isCEO → /ceo
   ├─ Se isAdmin → /admin
   └─ Senão → /
4. Se falhar → mostrar erro
```

### 3. Remoção de código não utilizado
- Estados `adminEmail` e `adminPassword` 
- Função `handleAdminLogin`
- Import do ícone `Shield`

---

## Benefícios

- **Experiência simplificada** - Um único formulário para todos
- **Menos confusão** - Usuários não precisam saber que existe área admin
- **Segurança mantida** - Credenciais admin continuam funcionando igual
- **Detecção automática de roles** - Usuários com papel no banco são redirecionados corretamente

---

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Auth.tsx` | Remover aba Admin, unificar lógica de login |
