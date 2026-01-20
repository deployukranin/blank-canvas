# Secrets e Chaves de API

Este documento lista todas as chaves secretas e tokens necessários para o funcionamento completo do projeto.

---

## Resumo Rápido

| Nome | Obrigatório | Onde Usar | Tipo |
|------|-------------|-----------|------|
| `SUPABASE_URL` | ✅ Sim | Edge Functions | URL |
| `SUPABASE_ANON_KEY` | ✅ Sim | Frontend + Edge Functions | Token |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Sim | Edge Functions | Token (Secreto!) |
| `OPENPIX_APP_ID` | 💰 Pagamentos | Edge Functions | Token |
| `OPENPIX_WEBHOOK_SECRET` | 💰 Pagamentos | Edge Functions | Token |
| `YOUTUBE_API_KEY` | 🎬 Vídeos | Edge Functions | Token |
| `MODERATION_API_URL` | 📢 Moderação | Edge Functions | URL |
| `MODERATION_API_KEY` | 📢 Moderação | Edge Functions | Token |

---

## 1. Supabase (Obrigatório)

### SUPABASE_URL
- **Descrição**: URL base do seu projeto Supabase
- **Formato**: `https://xxxxxxxxxxxx.supabase.co`
- **Onde encontrar**: Supabase Dashboard > Settings > API
- **Uso**: Cliente Supabase, chamadas às Edge Functions

### SUPABASE_ANON_KEY (PUBLISHABLE)
- **Descrição**: Chave pública/anônima do Supabase
- **Formato**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Onde encontrar**: Supabase Dashboard > Settings > API > anon/public
- **Uso**: Frontend, cliente JavaScript
- **Segurança**: ✅ Pode ser exposta publicamente

### SUPABASE_SERVICE_ROLE_KEY (SECRETO!)
- **Descrição**: Chave de serviço com acesso total ao banco
- **Formato**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Onde encontrar**: Supabase Dashboard > Settings > API > service_role
- **Uso**: Edge Functions que precisam bypass de RLS
- **Segurança**: ⚠️ NUNCA expor no frontend!

---

## 2. OpenPix / Woovi (Pagamentos PIX)

### OPENPIX_APP_ID
- **Descrição**: ID da aplicação/API Key da OpenPix
- **Formato**: String alfanumérica
- **Onde encontrar**: OpenPix Dashboard > Developers > APIs
- **Uso**: Criar cobranças PIX, autenticar chamadas

### OPENPIX_WEBHOOK_SECRET
- **Descrição**: Secret para validar webhooks da OpenPix
- **Formato**: String alfanumérica
- **Onde encontrar**: OpenPix Dashboard > Developers > Webhooks
- **Uso**: Validar assinatura HMAC das notificações
- **Segurança**: ⚠️ Nunca expor publicamente

### Configuração no Supabase

```bash
# Definir secrets via CLI
supabase secrets set OPENPIX_APP_ID="seu_app_id_aqui"
supabase secrets set OPENPIX_WEBHOOK_SECRET="seu_webhook_secret_aqui"

# Verificar secrets definidos
supabase secrets list
```

---

## 3. YouTube API

### YOUTUBE_API_KEY
- **Descrição**: Chave da YouTube Data API v3
- **Formato**: `AIza...` (39 caracteres)
- **Onde encontrar**: Google Cloud Console > Credenciais
- **Uso**: Buscar vídeos do canal do influenciador

### Configurar no Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie/selecione um projeto
3. Ative a API: **YouTube Data API v3**
4. Vá em **Credenciais > Criar Credenciais > Chave de API**
5. Restrinja a chave por IP ou referrer para segurança

### Configuração no Supabase

```bash
supabase secrets set YOUTUBE_API_KEY="AIza..."
```

---

## 4. Painel de Moderação (Opcional)

Se você tem um projeto separado para moderação:

### MODERATION_API_URL
- **Descrição**: URL do projeto de moderação
- **Formato**: `https://seu-projeto-moderacao.supabase.co`
- **Uso**: Enviar denúncias e tickets de suporte

### MODERATION_API_KEY
- **Descrição**: Chave de autenticação do projeto de moderação
- **Formato**: UUID ou string gerada
- **Uso**: Autenticar chamadas ao projeto externo

---

## 5. Configuração via CEO Panel

Algumas credenciais podem ser configuradas dinamicamente pelo CEO Panel em `/ceo/integracoes`:

| Integração | Configurável no CEO Panel |
|------------|---------------------------|
| Supabase URL/Key | ✅ Sim |
| OpenPix App ID/Secret | ✅ Sim |
| YouTube Channel ID | ✅ Sim |
| Moderação URL/Key | ✅ Sim |
| Suporte Webhook | ✅ Sim |

As configurações do CEO Panel são salvas no `localStorage` e usadas como fallback quando as variáveis de ambiente não estão definidas.

---

## 6. Variáveis de Ambiente do Frontend

Arquivo `.env` na raiz do projeto:

```env
# Supabase (obrigatório)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=xxxx

# Nota: Apenas chaves PUBLISHABLE podem ir aqui!
# Secrets vão nas Edge Functions via `supabase secrets set`
```

---

## 7. Segurança

### ⚠️ NUNCA faça isso:

```javascript
// ❌ ERRADO - Secret no frontend
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ❌ ERRADO - Hardcoded no código
const OPENPIX_KEY = "minha_chave_secreta";

// ❌ ERRADO - Commitar .env com secrets
// git add .env
```

### ✅ Boas práticas:

```javascript
// ✅ CORRETO - Apenas anon key no frontend
const supabase = createClient(url, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

// ✅ CORRETO - Secrets apenas em Edge Functions
// (definidos via supabase secrets set)
const apiKey = Deno.env.get("OPENPIX_APP_ID");
```

### .gitignore

Certifique-se que seu `.gitignore` inclui:

```
.env
.env.local
.env.*.local
supabase/.env
```

---

## 8. Rotação de Chaves

Se uma chave for comprometida:

### Supabase
1. Vá em **Settings > API**
2. Clique em **Regenerate** na chave comprometida
3. Atualize todos os lugares que usam a chave

### OpenPix
1. Vá em **Developers > APIs**
2. Revogue o App ID antigo
3. Crie um novo App ID
4. Atualize o secret no Supabase

### YouTube
1. Vá em **Google Cloud Console > Credenciais**
2. Delete a chave antiga
3. Crie uma nova chave
4. Atualize o secret no Supabase

---

## Checklist de Secrets

- [ ] `SUPABASE_URL` configurado
- [ ] `SUPABASE_ANON_KEY` configurado no frontend
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado nas Edge Functions
- [ ] `OPENPIX_APP_ID` configurado (se usar pagamentos)
- [ ] `OPENPIX_WEBHOOK_SECRET` configurado (se usar pagamentos)
- [ ] `YOUTUBE_API_KEY` configurado (se usar galeria de vídeos)
- [ ] `.env` no `.gitignore`
- [ ] Nenhum secret hardcoded no código
