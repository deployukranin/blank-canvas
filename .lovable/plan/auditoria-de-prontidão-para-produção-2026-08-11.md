# Auditoria de Prontidão para Produção

## Resumo executivo

O projeto **compila e já está publicado** na URL da Lovable (`https://cozy-corner-seed.lovable.app`), mas ainda não está operando no domínio oficial `mytinglebox.com`. Existem bloqueadores técnicos e de processo que precisam ser resolvidos antes de declarar o ambiente como "produção estável".

## Estado atual verificado

| Área | Status | Evidência |
|---|---|---|
| Build da aplicação | Passa | `vite build` conclui com sucesso |
| Publicação Lovable | Pública | `cozy-corner-seed.lovable.app` está ativo e público |
| Backend / Lovable Cloud | Saudável | `ACTIVE_HEALTHY`, DB respondendo, 20 MB de dados |
| Migrations do banco | Sincronizadas | Últimas 5 migrations locais já estão aplicadas |
| Secrets essenciais | Configurados | STRIPE_SECRET_KEY, STRIPE_CONNECT_CLIENT_ID, STRIPE_PLATFORM_WEBHOOK_SECRET, VERCEL_TOKEN, VERCEL_PROJECT_ID, YOUTUBE_API_KEY, GOOGLE_DRIVE_API_KEY, RESEND_API_KEY, DRIVE_MEDIA_SIGNING_SECRET |
| .env local | Completo | VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID presentes |

## Bloqueadores para produção real

### 1. Domínio customizado não configurado
- O app responde em `cozy-corner-seed.lovable.app`, mas todo o código (SEO, links compartilhados, CORS, Stripe redirect, og:url) aponta para `mytinglebox.com`.
- Sem o domínio customizado, links de "Copiar link", "Visualizar plataforma", Stripe OAuth e emails vão quebrar na produção real.
- Ação: conectar `mytinglebox.com` (e `www.mytinglebox.com`) em **Project Settings → Domains**.

### 2. Qualidade do código (Lint)
- `bun run lint` retorna **229 erros e 45 warnings**.
- A maioria está em `supabase/functions/` (`no-explicit-any`, `prefer-const`).
- Embora o build passe, erros de lint em Edge Functions são risco de runtime e impedem gates de CI/CD limpos.
- Ação: corrigir os erros de lint ou, no mínimo, configurar override de lint para Edge Functions com regras de Deno apropriadas.

### 3. Testes automatizados quebrados
- `bun test` reporta **2 falhas e 2 erros**.
- `tenant-routes.test.tsx` falha porque `localStorage` não existe no ambiente de teste (jsdom/node).
- `supabase/functions/_security_tests/policies_test.ts` falha porque importa `deno.land/std` e não está em ambiente Deno.
- Ação: isolar config de testes para usar `memoryStorage` no lugar de `localStorage` e separar suites de Deno das de Vite.

### 4. Security scans desatualizados
- Todos os scanners (`agent_security`, `supabase`, `supabase_lov`, `supply_chain`, etc.) estão com `up_to_date: false`.
- O último scan teve zero findings, mas por desatualização não podemos garantir que o estado atual esteja limpo.
- Ação: rodar novo scan de segurança completo e corrigir eventuais novos findings.

### 5. Linter do Supabase com 49 warnings de segurança
- Warnings de `SECURITY DEFINER` functions executáveis por `anon` ou `authenticated` e extensões no schema `public`.
- Podem ser intencionais (ex: `has_active_vip_for_store`), mas precisam ser revisados e documentados.
- Ação: auditar as warnings, revogar EXECUTE onde não for necessário e atualizar a security memory.

### 6. Branches de deploy não estão em uso
- O repositório está em branches `edit/*`. Não existem `develop` e `release` ativas no estado local verificado.
- Os workflows de `cut-release.yml` e `promote-to-production.yml` dependem dessas branches.
- Ação: reorganizar o GitHub para usar `develop` como branch de sync da Lovable e `release` como candidata a produção, ou ajustar os workflows para o fluxo real.

## Riscos médios (não bloqueadores, mas devem ser tratados)

### 7. Bundle grande
- O chunk principal `index-*.js` tem **3,17 MB** (808 KB gzip).
- Ação: adicionar code-splitting por rota para reduzir o tempo inicial de carregamento.

### 8. Hardcoded `www.mytinglebox.com` no index.html
- `canonical`, `og:url`, `twitter:image` e favicons usam `www.mytinglebox.com`.
- Isso é problemático até o domínio customizado estar realmente apontando para o app.
- Ação: após conectar o domínio, confirmar que `www` está redirecionando corretamente para o primário.

### 9. Verificação de email
- Foi reabilitada a confirmação de email para admins. Ainda precisa ser testada end-to-end com o domínio de email configurado (custom domain é necessário para envio de emails via Resend).
- Ação: configurar custom domain de email e testar signup/re-send.

## Plano de ação recomendado

### Fase 1 — Fundação de infraestrutura (obrigatória)
1. Conectar domínio `mytinglebox.com` + `www.mytinglebox.com` no Lovable.
2. Configurar email custom domain para envio de autenticação (Resend).
3. Validar se o DNS de `mytinglebox.com` aponta para o IP da Lovable e SSL provisionado.
4. Rodar novo security scan completo e tratar findings.

### Fase 2 — Qualidade e confiabilidade (obrigatória)
5. Corrigir erros de lint (`bun run lint` deve passar sem erros).
6. Corrigir suites de teste (`bun test` deve passar sem falhas/erros).
7. Revisar as 49 warnings do linter do Supabase e aplicar ajustes de segurança.

### Fase 3 — Processo de deploy (obrigatória)
8. Criar/ativar branches `develop` e `release` no GitHub.
9. Configurar Vercel para usar `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
10. Testar o fluxo completo: Lovable → `develop` → `release` → `main` → Vercel produção.
11. Desabilitar deploy automático nativo da Vercel para evitar conflitos com GitHub Actions.

### Fase 4 — Otimização e monitoramento (recomendada)
12. Implementar code-splitting para reduzir o bundle inicial.
13. Configurar monitoramento de erros (ex: Sentry ou logs da Vercel).
14. Criar runbook de rollback e testar restore de banco.

## Checklist final de "pronto para produção"

- [ ] Domínio `mytinglebox.com` e `www.mytinglebox.com` conectados e ativos.
- [ ] SSL provisionado e redirecionamento de `www` configurado.
- [ ] Email custom domain configurado para envio de autenticação.
- [ ] `bun run build` passa sem erros.
- [ ] `bun run lint` passa sem erros.
- [ ] `bun test` passa sem falhas/erros.
- [ ] Security scan atualizado sem findings críticos.
- [ ] Linter do Supabase revisado e warnings documentadas/corrigidas.
- [ ] Branches `develop` e `release` criadas e workflows testados.
- [ ] Vercel configurada com os secrets de deploy.
- [ ] Stripe OAuth redirect validado no domínio real.
- [ ] Fluxo de signup/login testado em `mytinglebox.com`.
- [ ] Upload de arquivos (Google Drive) testado em produção.
- [ ] Rollback documentado.

## Observação importante

Este plano é uma **auditoria de prontidão**, não uma implementação. Cada fase pode ser aprovada separadamente. A Fase 1 é a mais urgente, porque sem o domínio customizado a produção real não é possível.