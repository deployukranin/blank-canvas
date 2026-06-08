Plano:

1. Ajustar o redirecionamento automático do `/auth`
   - Em `src/pages/Auth.tsx`, remover o `toast.error` disparado em `redirectToAdminWithSlug` quando o usuário autenticado não possui loja.
   - Manter a tentativa de redirecionar `super_admin`/`ceo` para `/admin-master` e `partner` para `/partner`.
   - Se não houver loja nem papel de plataforma, a página apenas permanece em `/auth` sem notificação.

2. Ajustar o login manual no `/auth`
   - Remover também o toast curto `Nenhuma loja encontrada para esta conta.` no `handleLogin` quando não houver loja nem papel de plataforma.
   - O login não mostrará mais essa mensagem indesejada.

3. Preservar os demais erros
   - Manter mensagens reais de erro, como email/senha inválidos, erro ao obter sessão, erro ao criar loja e validações de cadastro.