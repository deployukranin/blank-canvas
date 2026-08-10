# Guia de Deploy - Projeto White Label Influencer

Este guia explica como fazer o deploy do projeto em um ambiente externo (fora do Lovable Cloud) e como manter um fluxo seguro de atualizações sem publicar mudanças na URL principal acidentalmente.

## Resumo do fluxo de deploy (Staging + Produção)

- **Branch `develop`**: ambiente de homologação/staging. Recebe alterações vindas do Lovable automaticamente.
- **Branch `main`**: ambiente de produção. Apenas quando `develop` é promovida manualmente para cá, o site principal é atualizado.
- **Deploys na Vercel**: controlados por workflows do GitHub Actions, não mais pelo sync automático nativo da Vercel.
- **Backend (Lovable Cloud/Supabase)**: é compartilhado entre staging e produção. Mudanças destrutivas no banco devem ser testadas primeiro no preview da Lovable.

## Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com)
- Chave de API do YouTube Data API v3 (para galeria de vídeos)

---

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha um nome e senha para o banco de dados
4. Aguarde a criação (~2 minutos)
5. Anote as seguintes informações (Settings > API):
   - **Project URL**: `https://xxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJI...`
   - **Service Role Key**: `eyJhbGciOiJI...` (mantenha esta em segredo!)

---

## 2. Executar Migrations do Banco de Dados

1. Acesse **SQL Editor** no painel do Supabase
2. Copie o conteúdo de `docs/database-schema.sql`
3. Execute o SQL

---

## 3. Deploy das Edge Functions

```bash
supabase functions deploy youtube-videos
supabase functions deploy create-pix-charge
supabase functions deploy create-vip-charge
supabase functions deploy save-app-config
supabase functions deploy export-metrics
supabase functions deploy super-admin-metrics
supabase functions deploy youtube-channel-metrics
```

### Configurar Secrets das Functions

```bash
# YouTube
supabase secrets set YOUTUBE_API_KEY=SUA_CHAVE_YOUTUBE

# Stripe (se usar pagamentos via Stripe Connect)
supabase secrets set STRIPE_SECRET_KEY=SUA_CHAVE_STRIPE

# As variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são definidas automaticamente
```

---

## 4. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=SEU_PROJECT_ID
```

---

## 5. Configurar YouTube API

### 5.1 Criar Projeto no Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto
3. Ative a **YouTube Data API v3**
4. Crie uma **API Key**
5. Adicione a chave como secret no Supabase:
   ```bash
   supabase secrets set YOUTUBE_API_KEY=SUA_CHAVE
   ```

### 5.2 Obter Channel ID

1. Acesse o canal do YouTube
2. O Channel ID está na URL ou em **About > Share Channel**
3. Formato: `UCxxxxxxxxxxxxxxxxxxxxxx`

---

## 6. Build e Deploy da Aplicação

### 6.1 Build Local

```bash
npm install
npm run build
```

### 6.2 Deploy no Vercel com controle de versões

Este projeto usa dois workflows do GitHub Actions para separar staging e produção:

| Branch | Ambiente | Quando atualiza | URL principal |
|---|---|---|---|
| `develop` | Staging/Homologação | A cada push (vindo do Lovable) | Preview da Vercel |
| `main` | Produção | Apenas promoção manual de `develop` | URL principal (`mytinglebox.com`) |

#### 6.2.1 Configurar a Vercel

1. Acesse o projeto na Vercel e desabilite o deploy automático nativo do GitHub: **Settings > Git > Ignored Build Step** ou desabilite o deploy automático para evitar conflitos com o workflow.
2. Anote na Vercel:
   - **Organization ID** (Settings > General)
   - **Project ID** (Settings > General)
3. No GitHub, adicione os seguintes **Secrets** no repositório (`Settings > Secrets and variables > Actions`):
   - `VERCEL_TOKEN` — crie em [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID` — ID da organização na Vercel
   - `VERCEL_PROJECT_ID` — ID do projeto na Vercel

#### 6.2.2 Configurar o sync do Lovable

1. No Lovable, conecte o projeto ao GitHub normalmente.
2. Altere a branch padrão do sync para `develop` (em vez de `main`). Dessa forma, todas as alterações feitas no editor vão primeiro para staging.
3. Caso precise fazer um hotfix direto em produção, use um PR isolado para `main`.

#### 6.2.3 Como publicar uma atualização em produção

1. Teste tudo na branch `develop` (URL de preview da Vercel).
2. No GitHub, vá em **Actions > Promote to Production**.
3. Clique em **Run workflow**.
4. O workflow fará merge de `develop` em `main` automaticamente e a Vercel fará deploy da produção.

#### 6.2.4 Deploy manual de emergência

Caso precise forçar um deploy sem merge, use o workflow **Vercel Deploy** com `workflow_dispatch` e escolha o ambiente `production` ou `preview`.

#### 6.2.5 Variáveis de ambiente no Vercel

Configure no dashboard da Vercel (`Project > Settings > Environment Variables`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

As mesmas variáveis devem existir tanto para **Production** quanto para **Preview**.

---

## 7. Configuração Inicial

Após o deploy:

1. Acesse o painel admin no seu site
2. Configure:
   - **Branding**: Nome, descrição, logos
   - **Cores**: Tema visual
   - **Integrações**: YouTube

---

## 8. Configurar Autenticação

### 8.1 Email/Senha

1. No Supabase, acesse **Authentication > Settings**
2. Desabilite **Confirm email** para testes rápidos
3. Configure o **Site URL** com a URL do seu deploy

---

## 9. Checklist Final

- [ ] Banco de dados criado com todas as tabelas
- [ ] Edge Functions deployadas
- [ ] Secrets configurados no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] YouTube API funcionando
- [ ] Autenticação testada
- [ ] Painel Admin configurado

---

## Troubleshooting

### Edge Function não responde

```bash
# Ver logs das funções
supabase functions logs youtube-videos --tail
```

### Erro de CORS

As Edge Functions já incluem headers CORS. Se ainda houver erro:

1. Verifique se a origem está permitida
2. Confirme que o preflight (OPTIONS) está funcionando

---

## Suporte

Para problemas ou dúvidas:
- Consulte a documentação do [Supabase](https://supabase.com/docs)
- Abra uma issue no repositório

## Fluxo com branch `release` (publicação controlada)

Objetivo: as edições feitas na Lovable ficam numa branch de trabalho; só entram em produção
depois de passarem pela branch `release` e por um merge explícito em `main`.

```
Lovable (Publish) ──► develop  ──[Cut Release]──► release ──[Promote to Production]──► main ──► Vercel prod
```

### 1. Branches
- `develop` — branch de sync da Lovable (Project Settings > GitHub > branch de trabalho).
- `release` — candidata a produção; gera preview na Vercel.
- `main` — produção (`mytinglebox.com`).

Proteja `main` em Settings > Branches (exigir PR e status checks).

### 2. Publicar
1. Edite na Lovable e clique em **Publish** (isso comita em `develop`).
2. No GitHub: **Actions > Cut Release > Run workflow** (origem `develop`).
   - Atualiza/cria a branch `release` e abre um PR `release -> main`.
   - A Vercel gera um preview da `release` para validação.
3. Validado o preview: **Actions > Promote to Production > Run workflow** (origem `release`)
   ou faça o merge do PR. Isso publica em `main` e cria a tag `release-<timestamp>`.

### 3. Observações
- Conflitos no Cut Release interrompem o workflow — resolva manualmente e rode de novo.
- Backend (Lovable Cloud/Supabase) é compartilhado entre as branches: migrações e edge
  functions passam a valer imediatamente, independentemente do merge em `main`.
- Mantenha **Auto-assign Custom Production Domains** desativado na Vercel para que previews
  não assumam o domínio de produção.
