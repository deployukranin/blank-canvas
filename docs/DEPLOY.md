# Guia de Deploy - Projeto White Label Influencer

Este guia explica como fazer o deploy do projeto em um ambiente externo (fora do Lovable Cloud).

## Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com)
- Conta na [OpenPix](https://openpix.com.br) (para pagamentos PIX)
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
3. Cole no editor SQL e execute
4. Verifique se as tabelas foram criadas:
   - `profiles`
   - `influencers`
   - `pix_payments`
   - `video_chat_messages`

---

## 3. Configurar Edge Functions

As Edge Functions precisam ser deployadas manualmente no Supabase.

### 3.1 Instalar Supabase CLI

```bash
npm install -g supabase
```

### 3.2 Login e Link do Projeto

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
```

O `project-ref` está na URL do seu projeto: `https://app.supabase.com/project/SEU_PROJECT_REF`

### 3.3 Deploy das Functions

```bash
# Deploy de todas as funções
supabase functions deploy youtube-videos
supabase functions deploy create-pix-charge
supabase functions deploy openpix-webhook
supabase functions deploy mock-pix-webhook
supabase functions deploy sandbox-pix-test
supabase functions deploy send-report
```

### 3.4 Configurar Secrets das Functions

```bash
# YouTube
supabase secrets set YOUTUBE_API_KEY=SUA_CHAVE_YOUTUBE

# OpenPix
supabase secrets set OPENPIX_APP_ID=SEU_APP_ID_OPENPIX
supabase secrets set OPENPIX_WEBHOOK_SECRET=SEU_WEBHOOK_SECRET

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

## 5. Configurar OpenPix (Pagamentos PIX)

### 5.1 Criar Conta na OpenPix

1. Acesse [openpix.com.br](https://openpix.com.br)
2. Crie uma conta e complete a verificação
3. Acesse **Developers > APIs**
4. Crie um **App ID** e anote

### 5.2 Configurar Webhook

1. Acesse **Developers > Webhooks**
2. Adicione um novo webhook com a URL:
   ```
   https://SEU_PROJETO.supabase.co/functions/v1/openpix-webhook
   ```
3. Selecione os eventos:
   - `OPENPIX:CHARGE_COMPLETED`
   - `OPENPIX:CHARGE_EXPIRED`
   - `OPENPIX:TRANSACTION_RECEIVED`
   - `OPENPIX:TRANSACTION_REFUND_RECEIVED`
4. Copie o **Webhook Secret** gerado

### 5.3 Configurar Split (Recebedores)

Se você usa split de pagamentos:

1. Acesse **Recebedores** na OpenPix
2. Cadastre o recebedor (influenciador) com:
   - Nome
   - CPF/CNPJ
   - Chave PIX
3. Anote o **Receiver ID** gerado
4. Adicione na tabela `influencers` do Supabase

---

## 6. Configurar YouTube API

### 6.1 Criar Projeto no Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto
3. Ative a **YouTube Data API v3**
4. Crie uma **API Key**
5. Adicione a chave como secret no Supabase:
   ```bash
   supabase secrets set YOUTUBE_API_KEY=SUA_CHAVE
   ```

### 6.2 Obter Channel ID

1. Acesse o canal do YouTube
2. O Channel ID está na URL ou em **About > Share Channel**
3. Formato: `UCxxxxxxxxxxxxxxxxxxxxxx`

---

## 7. Build e Deploy da Aplicação

### 7.1 Build Local

```bash
npm install
npm run build
```

### 7.2 Deploy no Vercel

1. Conecte o repositório ao [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
3. Deploy automático em cada push

### 7.3 Deploy no Netlify

1. Conecte o repositório ao [Netlify](https://netlify.com)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Configure as variáveis de ambiente

---

## 8. Configuração Inicial (CEO Panel)

Após o deploy:

1. Acesse `/ceo` no seu site
2. Configure:
   - **Branding**: Nome, descrição, logos
   - **Cores**: Tema visual
   - **Integrações**: Credenciais do Supabase, OpenPix, YouTube

As configurações são salvas no `localStorage` e persistem entre sessões.

---

## 9. Configurar Autenticação

### 9.1 Email/Senha

1. No Supabase, acesse **Authentication > Settings**
2. Desabilite **Confirm email** para testes rápidos
3. Configure o **Site URL** com a URL do seu deploy

### 9.2 Google OAuth (Opcional)

1. Configure um projeto no [Google Cloud Console](https://console.cloud.google.com)
2. Crie credenciais OAuth 2.0
3. No Supabase, acesse **Authentication > Providers > Google**
4. Adicione as credenciais

---

## 10. Checklist Final

- [ ] Banco de dados criado com todas as tabelas
- [ ] Edge Functions deployadas
- [ ] Secrets configurados no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Webhook da OpenPix configurado
- [ ] YouTube API funcionando
- [ ] Autenticação testada
- [ ] CEO Panel configurado

---

## Troubleshooting

### Edge Function não responde

```bash
# Ver logs das funções
supabase functions logs youtube-videos --tail
```

### Webhook não recebe pagamentos

1. Verifique a URL do webhook na OpenPix
2. Confirme que a função está deployada
3. Verifique os logs:
   ```bash
   supabase functions logs openpix-webhook --tail
   ```

### Erro de CORS

As Edge Functions já incluem headers CORS. Se ainda houver erro:

1. Verifique se a origem está permitida
2. Confirme que o preflight (OPTIONS) está funcionando

---

## Suporte

Para problemas ou dúvidas:
- Consulte a documentação do [Supabase](https://supabase.com/docs)
- Consulte a documentação da [OpenPix](https://developers.openpix.com.br)
- Abra uma issue no repositório
