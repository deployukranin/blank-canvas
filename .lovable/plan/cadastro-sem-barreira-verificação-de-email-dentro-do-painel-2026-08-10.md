# Cadastro sem barreira: verificação de email dentro do painel

Hoje o cadastro cria a conta mas não devolve sessão: o usuário fica preso na tela `/auth` esperando o email. A mudança inverte o fluxo — a conta entra direto no painel e a verificação vira uma etapa interna, com aviso fixo e bloqueio leve de ações sensíveis até confirmar.

## Novo fluxo

```text
/auth (cadastro) → sessão criada na hora → /:slug/admin
                                            ├─ banner "Verifique seu email" (fixo, com botão Reenviar)
                                            └─ ações sensíveis bloqueadas até verificar
Email recebido → link → /verify → marca verificado → banner some, bloqueios liberados
```

## O que muda

1. **Signup entra direto**
   - Cadastro passa a devolver sessão imediatamente e redireciona para o painel.
   - A tela `/auth` deixa de exibir o estado "confira seu email"; nada de espera.

2. **Verificação como estado próprio**
   - O status de verificação passa a ser guardado no perfil do usuário (campo próprio), não mais dependente do estado interno de confirmação do provedor de auth.
   - Novo envio do email de verificação usa a função de email já existente do projeto.
   - Nova rota `/verify`: valida o link, marca o perfil como verificado e redireciona ao painel com confirmação visual.

3. **Banner no painel admin**
   - O banner atual (`EmailVerificationBanner`) passa a ler o novo estado do perfil.
   - Reenvio **apenas manual** pelo botão, mantendo o cooldown de 60s.
   - Some assim que a verificação é concluída.

4. **Bloqueio leve enquanto não verificado**
   - Bloqueadas: publicar/ativar a loja (deixar online), iniciar onboarding de pagamentos (Stripe) e conectar domínio personalizado.
   - Cada ação bloqueada mostra a mesma mensagem curta com atalho para reenviar o email.
   - O bloqueio também é aplicado no backend (funções de servidor correspondentes), não só na interface.

5. **Traduções** em EN, PT-BR e ES para banner, mensagens de bloqueio e página `/verify`.

## Detalhes técnicos

- Auth: ativar confirmação automática no provedor para que `signUp` retorne sessão; a verificação real passa a ser controlada pela aplicação.
- Banco: adicionar `email_verified_at` e `email_verification_sent_at` em `public.profiles`; RPC `security definer` para marcar verificação a partir do token do link (usuário não escreve o campo diretamente — política de update do próprio perfil precisa impedir alteração desses campos).
- Envio: reaproveitar a edge function `send-auth-email` com um tipo de link de verificação apontando para `${getPublicOrigin()}/verify`.
- Frontend: `AuthContext` deixa de tratar `needsConfirmation`; novo hook `use-email-verification` alimenta banner e guardas.
- Backend guards: checagem de `email_verified_at` em `manage-domain`, `stripe-connect-onboarding` e na ação de ativar a loja.
- Rate limit: reenvio limitado por usuário (cooldown de 60s no cliente + limite por hora no servidor).
