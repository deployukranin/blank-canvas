

# Plano: Corrigir Erro de CORS na Edge Function create-pix-charge

## Problema Identificado

A edge function `create-pix-charge` possui uma lista restrita de origens permitidas (CORS) que **ainda contém URLs placeholder**:

```typescript
const ALLOWED_ORIGINS = [
  "https://seusite.lovable.app",         // Placeholder
  "https://preview-seusite.lovable.app", // Placeholder  
  "http://localhost:8080",
];
```

A origem real do projeto (`4c756ab8-43f8-4073-a220-22b13086195b.lovableproject.com`) nao esta incluida, resultando em bloqueio CORS com status 403 e a mensagem "Forbidden Origin".

## Solucao

Atualizar a lista `ALLOWED_ORIGINS` na edge function para incluir as origens corretas do projeto Lovable.

## Alteracoes Necessarias

### 1. Atualizar `supabase/functions/create-pix-charge/index.ts`

Substituir os placeholders pelas URLs reais:

```text
ANTES:
const ALLOWED_ORIGINS = [
  "https://seusite.lovable.app",
  "https://preview-seusite.lovable.app",
  "http://localhost:8080",
];

DEPOIS:
const ALLOWED_ORIGINS = [
  "https://4c756ab8-43f8-4073-a220-22b13086195b.lovableproject.com",
  "https://id-preview--4c756ab8-43f8-4073-a220-22b13086195b.lovable.app",
  "https://cozy-corner-seed.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
];
```

URLs incluidas:
- **lovableproject.com**: Preview de desenvolvimento
- **id-preview--...lovable.app**: Preview alternativo
- **cozy-corner-seed.lovable.app**: URL publicada (producao)
- **localhost**: Desenvolvimento local

### 2. Deploy da Edge Function

Apos a edicao, a edge function sera reimplantada automaticamente.

## Secao Tecnica

### Por que "Failed to fetch"?

1. O browser envia uma requisicao preflight OPTIONS
2. A edge function verifica se a origem esta na lista ALLOWED_ORIGINS
3. Como nao esta, retorna 403 Forbidden Origin
4. O browser bloqueia a requisicao e reporta "Failed to fetch"
5. O frontend mostra "Erro ao gerar cobranca"

### Fluxo Corrigido

```text
Browser (lovableproject.com)
       |
       | POST /functions/v1/create-pix-charge
       v
Edge Function
       |
       | Origin: ...lovableproject.com
       | -> Verifica ALLOWED_ORIGINS
       | -> Origem valida!
       v
Processa pagamento PIX
       |
       v
Retorna QR Code
```

## Validacao

Apos a correcao:
1. Acessar /customs
2. Selecionar categoria e duracao
3. Clicar em "Comprar"
4. O modal de pagamento PIX deve abrir com o QR Code

