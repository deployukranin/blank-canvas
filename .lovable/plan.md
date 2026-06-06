# Emails de autenticação via Resend (confirmação de cadastro + recuperação de senha)

## Objetivo
Enviar os emails de **confirmação de cadastro** e **recuperação de senha** diretamente pelo **Resend** (remetente `verified@mytinglebox.com`), de forma confiável — sem depender do remetente padrão limitado do Lovable Cloud e sem usar o Lovable Emails.

## Por que assim
No Lovable Cloud não há acesso ao painel do Supabase para ligar o "Send Email Hook" manualmente. A forma robusta é uma **edge function própria** que:
- gera o link oficial do Supabase (confirmação/recuperação) via API admin (`generate_link`), e
- envia o email pelo gateway do Resend (connector já configurado, `RESEND_API_KEY` disponível).

Assim o link continua sendo o token válido do Supabase, mas a entrega é 100% Resend.

## Mudança de fluxo importante
Hoje o cadastro do criador cria o usuário pelo `signUp` do cliente e depende do email automático do Supabase. Vamos parar de usar o `signUp` automático para esses casos e criar o usuário dentro da edge function com `generate_link` tipo `signup` (cria o usuário não confirmado + devolve o link). Isso evita email duplicado e garante o envio via Resend. O nome/dados ficam em `user_metadata` para serem usados após a confirmação.

## Passos

### 1. Edge function `send-auth-email` (nova)
- `verify_jwt = false` (chamada durante cadastro, sem sessão).
- Entrada validada (Zod): `type` (`signup` | `recovery`), `email`, `password` (para signup), `redirect_to`, `metadata` opcional.
- Usa `SUPABASE_SERVICE_ROLE_KEY` via REST (`POST /auth/v1/admin/generate_link`) — **sem SDK**, conforme convenção do projeto:
  - `signup`: cria usuário não confirmado + retorna `action_link`. Se já existe → resposta amigável "email já cadastrado".
  - `recovery`: gera link de redefinição de senha.
- Envia via gateway Resend (`https://connector-gateway.lovable.dev/resend/emails`) com headers `Authorization: Bearer LOVABLE_API_KEY` e `X-Connection-Api-Key: RESEND_API_KEY`, `from: verified@mytinglebox.com`.
- Templates HTML em PT-BR com a identidade visual (fundo escuro #0a0a0a, roxo do `/auth`, logo TingleBox): um para "Confirme seu email", outro para "Redefinir senha".
- CORS completo em todas as respostas.

### 2. Frontend — cadastro do criador (`Auth.tsx`)
- Substituir `signUp(...)` pela invocação de `send-auth-email` (`type: 'signup'`, `redirect_to: ${origin}/auth`, `metadata` com nome da loja).
- Manter a tela `signupConfirmationSent` e o `sessionStorage` `pending_store_setup` (a finalização da loja após confirmação já existe e continua igual).
- Tratar erro "email já cadastrado".

### 3. Frontend — cadastro do cliente (`ClientAuth.tsx`)
- Substituir `signUp(...)` pela invocação de `send-auth-email` (`type: 'signup'`, `redirect_to: ${origin}${homePath}`, `metadata` com nome).
- Remover o bloco que espera sessão/insere role/profile imediatamente (não há sessão antes da confirmação).
- Mover a criação de `profile`, role `client` e `store_users` para **após o login** (no `handleLogin`, que já faz o upsert de `store_users`): adicionar upsert de `profiles` (nome via metadata) e `assign_client_role`.
- Exibir mensagem "Verifique seu email para confirmar".

### 4. Recuperação de senha
- Em `AuthContext.resetPassword` (e/ou `ForgotPassword.tsx`), trocar `supabase.auth.resetPasswordForEmail` pela invocação de `send-auth-email` (`type: 'recovery'`, `redirect_to: ${origin}/reset-password`).

### 5. Config e deploy
- Adicionar bloco `[functions.send-auth-email] verify_jwt = false` em `supabase/config.toml`.
- Deploy da função e teste do envio real via Resend (cadastro de teste) + verificação de entrega.

## Observações
- O domínio `mytinglebox.com` já está verificado no Resend, então o envio para qualquer destinatário funciona.
- A confirmação de email continua obrigatória; a diferença é que o email agora chega de forma confiável pelo seu domínio.
- O connector Resend já está vinculado; não é preciso adicionar segredo novo.

## Detalhes técnicos
- Endpoint admin: `POST {SUPABASE_URL}/auth/v1/admin/generate_link` com `apikey` + `Authorization: Bearer SERVICE_ROLE_KEY`, body `{ type, email, password, options: { redirect_to, data } }`. Resposta inclui `action_link`.
- Resend: `POST /resend/emails` body `{ from, to, subject, html }`.
- Sem dependência do email automático do Supabase (evita duplicidade e limites).
