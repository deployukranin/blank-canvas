# Secrets e Chaves de API

Este documento lista todas as chaves secretas e tokens necessários para o funcionamento completo do projeto.

---

## Resumo Rápido

| Nome | Obrigatório | Onde Usar | Tipo |
|------|-------------|-----------|------|
| `SUPABASE_URL` | ✅ Sim | Edge Functions | URL |
| `SUPABASE_ANON_KEY` | ✅ Sim | Frontend + Edge Functions | Token |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Sim | Edge Functions | Token (Secreto!) |
| `YOUTUBE_API_KEY` | 🎬 Vídeos | Edge Functions | Token |
| `STRIPE_SECRET_KEY` | 💰 Pagamentos | Edge Functions | Token |

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

## 2. YouTube API

### YOUTUBE_API_KEY
- **Descrição**: Chave da YouTube Data API v3
- **Formato**: `AIza...` (39 caracteres)
- **Onde encontrar**: Google Cloud Console > Credenciais
- **Uso**: Buscar vídeos do canal do influenciador

### Configuração no Supabase

```bash
supabase secrets set YOUTUBE_API_KEY="AIza..."
```

---

## 3. Stripe (Pagamentos)

### STRIPE_SECRET_KEY
- **Descrição**: Chave secreta da conta Stripe
- **Formato**: `sk_live_...` ou `sk_test_...`
- **Onde encontrar**: Stripe Dashboard > Developers > API Keys
- **Uso**: Processar pagamentos via Stripe Connect

---

## 4. Variáveis de Ambiente do Frontend

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

## 5. Segurança

### ⚠️ NUNCA faça isso:

```javascript
// ❌ ERRADO - Secret no frontend
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ❌ ERRADO - Hardcoded no código
const API_KEY = "minha_chave_secreta";
```

### ✅ Boas práticas:

```javascript
// ✅ CORRETO - Apenas anon key no frontend
const supabase = createClient(url, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

// ✅ CORRETO - Secrets apenas em Edge Functions
const apiKey = Deno.env.get("STRIPE_SECRET_KEY");
```

---

## Checklist de Secrets

- [ ] `SUPABASE_URL` configurado
- [ ] `SUPABASE_ANON_KEY` configurado no frontend
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado nas Edge Functions
- [ ] `YOUTUBE_API_KEY` configurado (se usar galeria de vídeos)
- [ ] `STRIPE_SECRET_KEY` configurado (se usar pagamentos Stripe)
- [ ] `.env` no `.gitignore`
- [ ] Nenhum secret hardcoded no código
