# Auditoria de Secrets (Gitleaks) — classificação e correções

## O que a verificação atual mostra

Cheguei a estes fatos lendo o repositório agora:

- `.env` (versionado) contém apenas `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_URL`. Nenhum service role, nenhum secret privado.
- Nenhum `SUPABASE_SERVICE_ROLE_KEY` aparece em código de frontend. As únicas ocorrências fora das Edge Functions são menções textuais em `docs/SECRETS.md` e `docs/DEPLOY.md` (nomes de variável, sem valor).
- Nenhum valor `sk_live_`, `sk_test_` ou `whsec_` existe no repositório. Stripe é lido apenas via `Deno.env.get("STRIPE_SECRET_KEY")` dentro das Edge Functions.
- `src/lib/external-storage.ts` **não contém mais** `EXTERNAL_SUPABASE_ANON_KEY` nem cliente externo — usa o client padrão do projeto e Google Drive via Edge Functions. Não há nenhuma referência a `EXTERNAL_SUPABASE` em todo o repositório.
- `middleware.ts` tem `SUPABASE_URL` e a anon key em literais (linhas 24-26), usados para buscar o tema do tenant no Edge Runtime da Vercel.
- Docs contêm apenas prefixos truncados (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`), não chaves completas.
- `.gitignore` **não** possui nenhuma entrada `.env`. `.env` está versionado (necessário para o build da Lovable, e contém só valores públicos), mas variantes locais/privadas também ficariam desprotegidas hoje.

## Classificação dos achados do Gitleaks

| Achado | Classificação |
|---|---|
| JWT/publishable Supabase em `.env` | Chave pública intencional (protegida por RLS) |
| Anon key hardcoded em `middleware.ts` | Chave pública intencional, mas hardcode desnecessário |
| `EXTERNAL_SUPABASE_ANON_KEY` em `src/lib/external-storage.ts` | Configuração antiga/não utilizada (já removida do código atual) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` em documentação | Falso positivo (valor truncado, é chave pública) |

Nenhum secret privado real foi encontrado versionado. **Não há credencial que precise ser rotacionada** com base no estado atual do repositório. Ressalva: o Gitleaks olha o histórico; se em algum commit antigo existiu um valor completo de `EXTERNAL_SUPABASE_ANON_KEY` de outro projeto Supabase, ela é pública por natureza — a ação correta é verificar RLS naquele projeto, não rotacionar. Se você tiver o commit exato, me passe o hash que eu confiro.

## Mudanças propostas

1. **`.gitignore`** — acrescentar variantes privadas sem quebrar o build:
   ```
   .env.local
   .env.*.local
   .env.production
   ```
   (`.env` permanece versionado; contém só chave publishable exigida no build.)

2. **`middleware.ts`** — mover URL e anon key para leitura de ambiente com fallback aos literais atuais, evitando quebra caso as env vars não estejam definidas na Vercel:
   ```ts
   const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://...';
   const SUPABASE_ANON = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '...';
   ```
   Comentário explicando que é chave publishable protegida por RLS.

3. **`docs/SECRETS.md` e `docs/DEPLOY.md`** — substituir todos os exemplos de valor por placeholders `<your-publishable-key>` / `<your-service-role-key>`, e deixar explícito que service role nunca vai em `.env` nem em variável `VITE_*`.

4. **Nada muda** em Edge Functions, Stripe, Drive ou fluxo de auth. Nenhum secret é movido para `VITE_*`.

## Verificação final

- Rodar typecheck e conferir que o preview e as rotas de tenant continuam carregando o tema (caminho do `middleware.ts`).
- Re-grep para confirmar zero valores de secret privado no código versionado.
