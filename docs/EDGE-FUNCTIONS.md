# Edge Functions - Documentação

Este documento descreve todas as Edge Functions do projeto e como deployá-las em um Supabase externo.

---

## Lista de Functions

| Função | Descrição | Secrets Necessários |
|--------|-----------|---------------------|
| `youtube-videos` | Busca vídeos do YouTube | `YOUTUBE_API_KEY` |
| `create-pix-charge` | Cria cobrança PIX | `OPENPIX_APP_ID`, `SUPABASE_*` |
| `openpix-webhook` | Recebe webhooks da OpenPix | `OPENPIX_WEBHOOK_SECRET`, `SUPABASE_*` |
| `mock-pix-webhook` | Simula pagamento (sandbox) | `SUPABASE_*` |
| `sandbox-pix-test` | Teste completo sandbox | `SUPABASE_*` |
| `send-report` | Envia denúncias/suporte | Configurável |

---

## 1. youtube-videos

**Endpoint**: `POST /functions/v1/youtube-videos`

### Descrição
Busca vídeos de um canal do YouTube usando a YouTube Data API v3.

### Request
```json
{
  "channelId": "UCxxxxxxxxxxxxxx"
}
```

### Response
```json
{
  "videos": [
    {
      "video_id": "dQw4w9WgXcQ",
      "thumbnail_url": "https://...",
      "video_title": "Título do vídeo",
      "video_description": "Descrição...",
      "published_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Secrets
```bash
supabase secrets set YOUTUBE_API_KEY="AIza..."
```

---

## 2. create-pix-charge

**Endpoint**: `POST /functions/v1/create-pix-charge`

### Descrição
Cria uma cobrança PIX na OpenPix com suporte a split de pagamentos.

### Request
```json
{
  "value": 1990,
  "productType": "VIP",
  "productId": "vip-monthly",
  "customerName": "João Silva",
  "customerEmail": "joao@email.com",
  "customerTaxId": "12345678901",
  "influencerId": "uuid-do-influencer"
}
```

### Response
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "correlationId": "uuid",
    "chargeId": "charge_xxx",
    "value": 1990,
    "status": "PENDING",
    "qrcode": "00020126...",
    "qrcodeImage": "data:image/png;base64,...",
    "brcode": "00020126...",
    "expiresAt": "2024-01-15T11:00:00Z",
    "split": {
      "platformValue": 398,
      "influencerValue": 1592
    }
  }
}
```

### Headers
- `Authorization: Bearer <user_jwt>` (obrigatório)

### Secrets
```bash
supabase secrets set OPENPIX_APP_ID="seu_app_id"
```

---

## 3. openpix-webhook

**Endpoint**: `POST /functions/v1/openpix-webhook`

### Descrição
Recebe notificações da OpenPix quando um pagamento é confirmado, expirado ou estornado.

### Events Suportados
- `OPENPIX:CHARGE_COMPLETED` - Pagamento confirmado
- `OPENPIX:CHARGE_EXPIRED` - Cobrança expirada
- `OPENPIX:TRANSACTION_RECEIVED` - Transação recebida
- `OPENPIX:TRANSACTION_REFUND_RECEIVED` - Estorno recebido

### Payload (OpenPix)
```json
{
  "event": "OPENPIX:CHARGE_COMPLETED",
  "charge": {
    "correlationID": "uuid-do-pagamento",
    "value": 1990,
    "status": "COMPLETED"
  },
  "pix": {
    "transactionID": "xxx"
  }
}
```

### Configurar na OpenPix
1. Vá em **Developers > Webhooks**
2. URL: `https://SEU_PROJETO.supabase.co/functions/v1/openpix-webhook`
3. Selecione os eventos desejados
4. Copie o **Webhook Secret**

### Secrets
```bash
supabase secrets set OPENPIX_WEBHOOK_SECRET="seu_webhook_secret"
```

---

## 4. mock-pix-webhook

**Endpoint**: `POST /functions/v1/mock-pix-webhook`

### Descrição
Simula a confirmação de um pagamento PIX para testes em ambiente sandbox.

### Request
```json
{
  "correlationId": "uuid-do-pagamento",
  "event": "OPENPIX:CHARGE_COMPLETED"
}
```

### Response
```json
{
  "success": true,
  "message": "Pagamento atualizado para COMPLETED",
  "simulatedEvent": "OPENPIX:CHARGE_COMPLETED",
  "payment": {
    "id": "uuid",
    "status": "COMPLETED",
    "paid_at": "2024-01-15T10:30:00Z"
  }
}
```

⚠️ **Apenas para testes!** Não use em produção.

---

## 5. sandbox-pix-test

**Endpoint**: `POST /functions/v1/sandbox-pix-test`

### Descrição
Executa um fluxo completo de teste de pagamento PIX:
1. Cria cobrança mock
2. Salva no banco de dados
3. Opcionalmente confirma automaticamente

### Request
```json
{
  "value": 1990,
  "productType": "VIP",
  "influencerId": "uuid-do-influencer",
  "autoConfirm": true
}
```

### Response
```json
{
  "success": true,
  "message": "Teste sandbox completado (auto-confirmado)",
  "payment": {
    "id": "uuid",
    "correlationId": "uuid",
    "status": "COMPLETED",
    "value": 1990
  },
  "charge": {
    "qrcode": "00020126...",
    "brcode": "00020126..."
  },
  "split": {
    "platformValue": 398,
    "influencerValue": 1592
  }
}
```

---

## 6. send-report

**Endpoint**: `POST /functions/v1/send-report`

### Descrição
Envia denúncias ou tickets de suporte para um painel de moderação externo.

### Request
```json
{
  "type": "report",
  "content_type": "video",
  "content_id": "video123",
  "reporter_id": "user-uuid",
  "reason": "spam",
  "description": "Conteúdo inapropriado",
  "moderationApiUrl": "https://projeto-moderacao.supabase.co",
  "moderationApiKey": "chave-api"
}
```

### Response
```json
{
  "success": true,
  "message": "Report sent to external moderation panel",
  "storedLocally": false
}
```

Se a API de moderação não estiver configurada, o report é salvo localmente.

---

## Deploy Manual

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Login e Link

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
```

### 3. Deploy Individual

```bash
# Deploy de uma função específica
supabase functions deploy youtube-videos

# Deploy de todas as funções
supabase functions deploy youtube-videos
supabase functions deploy create-pix-charge
supabase functions deploy openpix-webhook
supabase functions deploy mock-pix-webhook
supabase functions deploy sandbox-pix-test
supabase functions deploy send-report
```

### 4. Configurar Secrets

```bash
# Ver secrets atuais
supabase secrets list

# Definir secrets
supabase secrets set YOUTUBE_API_KEY="AIza..."
supabase secrets set OPENPIX_APP_ID="seu_app_id"
supabase secrets set OPENPIX_WEBHOOK_SECRET="seu_secret"
```

### 5. Ver Logs

```bash
# Logs em tempo real
supabase functions logs youtube-videos --tail

# Logs de todas as funções
supabase functions logs --tail
```

---

## Estrutura dos Arquivos

```
supabase/
├── config.toml
└── functions/
    ├── youtube-videos/
    │   └── index.ts
    ├── create-pix-charge/
    │   └── index.ts
    ├── openpix-webhook/
    │   └── index.ts
    ├── mock-pix-webhook/
    │   └── index.ts
    ├── sandbox-pix-test/
    │   └── index.ts
    └── send-report/
        └── index.ts
```

---

## Troubleshooting

### Função não encontrada

```
Error: Function not found
```

**Solução**: Verifique se a função foi deployada:
```bash
supabase functions list
```

### Erro de CORS

**Solução**: As funções já incluem headers CORS. Verifique se o handler OPTIONS está funcionando.

### Secret não definido

```
Error: Missing YOUTUBE_API_KEY
```

**Solução**: Defina o secret:
```bash
supabase secrets set YOUTUBE_API_KEY="..."
```

### Timeout

**Solução**: Edge Functions têm limite de 25 segundos. Otimize operações longas ou use background jobs.
