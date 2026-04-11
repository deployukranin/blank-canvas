# Guia de Deploy - Projeto White Label Influencer

Este guia explica como fazer o deploy do projeto em um ambiente externo (fora do Lovable Cloud).

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

### 6.2 Deploy no Vercel

1. Conecte o repositório ao [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
3. Deploy automático em cada push

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
