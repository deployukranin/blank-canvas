## Problema

Quando o usuário tenta criar a conta e algo falha **depois** do Supabase criar o usuário em `auth.users` (senha rejeitada pelo HIBP, slug tomado numa corrida, erro ao criar `stores`, Resend fora do ar, usuário fecha a aba antes de confirmar o email, etc.), o registro fica **órfão**: o email já existe em `auth.users` mas o cadastro nunca foi concluído. Na próxima tentativa, o Edge Function retorna `alreadyRegistered: true` e o usuário fica travado sem poder recadastrar nem entrar (pois nunca confirmou o email nem definiu senha válida).

Causa raiz: `admin/generate_link` com `type=signup` já cria o usuário imediatamente com a senha fornecida — qualquer falha posterior deixa o registro pendurado, e não há limpeza.

## Correção

### 1. `supabase/functions/send-auth-email/index.ts`
- Se o `sendViaResend` falhar após `generateLink` ter sucesso, **deletar o usuário recém-criado** via `DELETE /auth/v1/admin/users/{id}` antes de retornar o erro, para que a próxima tentativa não colida.
- Detectar usuário órfão no início do fluxo signup: antes de chamar `generate_link`, buscar o usuário por email (`GET /auth/v1/admin/users?email=...`). Se existir E `email_confirmed_at` for `null` E não estiver associado a nenhum `stores` (via `created_by`), deletar e prosseguir com signup limpo.
- Retornar o `user.id` no response de sucesso para o frontend poder chamar cleanup em falhas posteriores.

### 2. Novo Edge Function `cleanup-orphan-signup`
- Recebe `{ email }`, valida rate-limit por IP.
- Só deleta o usuário se: `email_confirmed_at IS NULL` **e** não há linha em `stores` com `created_by = user.id` **e** o usuário foi criado nos últimos 30 minutos.
- Usado pelo frontend quando algo dá errado após o `signUp` retornar sucesso.

### 3. `src/pages/Auth.tsx` (`handleSignup`)
- Envolver o bloco pós-`signUp` (criação do store, associação `store_admins`, etc.) em try/catch. Em qualquer erro após `needsConfirmation`, chamar `cleanup-orphan-signup` para o email antes de mostrar o toast, para que o usuário possa tentar de novo.
- Já hoje `signUp` retorna `needsConfirmation: true` imediatamente após o email — a criação do store só acontece depois da confirmação (no callback do `/auth`). Para esse caminho, adicionar cleanup automático no Edge Function: agendar (ou fazer on-demand no próximo `send-auth-email` para o mesmo email) a limpeza de contas não confirmadas > 30min sem store.

### 4. Job de limpeza recorrente (opcional mas recomendado)
- Migration criando função SQL `cleanup_unconfirmed_orphans()` que deleta de `auth.users` (via `security definer` chamando admin API? não dá) — alternativa: adicionar ao `cleanup-expired-stores` cron existente uma passada para deletar users não confirmados > 24h sem store associado. Usa `SUPABASE_SERVICE_ROLE_KEY` que já está disponível nessa função.

## Comportamento esperado após o fix

- Falha em qualquer etapa do cadastro → email fica livre para nova tentativa em segundos.
- Usuário que fecha aba sem confirmar email → limpo automaticamente em até 24h pelo cron, ou imediatamente se ele mesmo tentar recadastrar com o mesmo email.
- "Já cadastrado" só aparece quando existe conta **confirmada** ou com store criado.

## Detalhes técnicos

- Endpoints Supabase Admin usados: `GET /auth/v1/admin/users?email={email}` (listar), `DELETE /auth/v1/admin/users/{id}` (deletar).
- Verificação de "tem store" via `SELECT id FROM stores WHERE created_by = $1 LIMIT 1` usando REST com service role.
- Não altera schema; apenas Edge Functions e frontend.
- Mantém a política de "não vazar existência de email" no fluxo de recovery.
