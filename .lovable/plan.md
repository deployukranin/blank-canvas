

## Plano: Configuração Completa de Pagamentos PIX com Split no Painel CEO

### Entendimento do Requisito

O objetivo é criar uma interface no Painel CEO para:
1. **Configurar a chave PIX da plataforma** (sua chave - a conta principal que recebe as taxas)
2. **Gerenciar subcontas/influencers** com suas chaves PIX para receber o split
3. **Configurar percentuais de split** (quanto fica para plataforma vs influencer)
4. **Taxa OpenPix descontada automaticamente da sua conta** (conta principal)

### Arquitetura do Sistema de Split na Woovi/OpenPix

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DO PAGAMENTO PIX                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cliente paga R$100,00                                          │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   OpenPix/Woovi                          │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Taxa OpenPix (1.29% ou configurada)               │  │   │
│  │  │ R$1,29 descontado da CONTA PRINCIPAL              │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  Split automático ANTES de cair nas contas:              │   │
│  │  ┌────────────────────┐  ┌─────────────────────────┐    │   │
│  │  │ 20% Plataforma     │  │ 80% Influencer          │    │   │
│  │  │ R$18,71            │  │ R$80,00                 │    │   │
│  │  │ (Sua chave PIX)    │  │ (Subconta do influencer)│    │   │
│  │  └────────────────────┘  └─────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### O Que Será Implementado

#### 1. Nova Seção "Pagamentos" no Painel CEO (/ceo/integracoes)

Expandir a seção OpenPix existente com:

- **Chave PIX da Plataforma** (sua chave principal)
  - Campo para informar a chave PIX (CPF, CNPJ, Email, Telefone ou Aleatória)
  - Tipo da chave PIX
  - Nome do titular
  
- **Configuração de Split Padrão**
  - Slider para ajustar % Plataforma vs % Influencer (padrão 20/80)
  - Opção "Taxa OpenPix descontada da plataforma" (checkbox)

- **Gestão de Subcontas (Influencers)**
  - Lista de subcontas cadastradas
  - Botão para adicionar nova subconta
  - Para cada subconta: Nome, Chave PIX, Tipo, Percentual customizado (opcional)
  - Status de ativação

#### 2. Atualização do WhiteLabelContext

Adicionar novos campos na configuração `tokens.openpix`:

```typescript
openpix: {
  appId: string;
  webhookSecret: string;
  environment: 'sandbox' | 'production';
  enabled: boolean;
  // NOVOS CAMPOS:
  platformPixKey: string;
  platformPixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  platformName: string;
  defaultSplitPercentage: number; // % que vai para plataforma (padrão 20)
  platformPaysOpenPixFee: boolean; // Se true, taxa descontada da plataforma
}
```

#### 3. Atualização da Tabela `influencers`

Adicionar campos para gerenciar subcontas diretamente via Woovi:

```sql
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS 
  woovi_subaccount_id text; -- ID da subconta na Woovi
```

#### 4. Nova Edge Function: `manage-subaccount`

Criar edge function para gerenciar subcontas na Woovi:
- Criar subconta via API `/api/v1/subaccount`
- Atualizar dados da subconta
- Buscar saldo da subconta

#### 5. Atualizar Edge Function `create-pix-charge`

Modificar para:
- Usar as configurações do WhiteLabel (passadas pelo frontend ou lidas do banco)
- Aplicar split correto baseado nas configurações
- Registrar se a taxa OpenPix é descontada da plataforma

### Arquivos a Serem Modificados/Criados

| Arquivo | Ação |
|---------|------|
| `src/contexts/WhiteLabelContext.tsx` | Adicionar campos de configuração de pagamento |
| `src/pages/ceo/CEOIntegracoes.tsx` | Adicionar seção de configuração de PIX e subcontas |
| `src/hooks/use-influencers.ts` | Expandir para gerenciar subcontas |
| `supabase/functions/manage-subaccount/index.ts` | **NOVO** - Criar/gerenciar subcontas na Woovi |
| `supabase/functions/create-pix-charge/index.ts` | Atualizar para usar configurações dinâmicas |
| Migração SQL | Adicionar coluna `woovi_subaccount_id` na tabela influencers |
| `supabase/config.toml` | Adicionar nova função |

### Seção Técnica - Detalhes de Implementação

#### API da Woovi para Subcontas

Baseado na documentação que você enviou:

**Criar Subconta:**
```
POST /api/v1/subaccount
{
  "pixKey": "chave-pix-do-influencer@email.com",
  "name": "Nome do Influencer"
}
```

**Listar Subcontas:**
```
GET /api/v1/subaccount
```

**Buscar Subconta:**
```
GET /api/v1/subaccount/{pixKey}
```

**Sacar de Subconta (se necessário):**
```
POST /api/v1/subaccount/{pixKey}/withdraw
{ "value": 1000 }
```

#### Split na Cobrança

O split já está implementado no `create-pix-charge`, mas será melhorado:

```typescript
// Usar receiver da subconta Woovi em vez de openpix_receiver_id manual
openPixPayload.splits = [
  {
    receiver: influencer.woovi_subaccount_id || influencer.pix_key,
    value: splitInfluencerValue,
  },
];
```

#### Interface no Painel CEO

Nova seção colapsável "Configurações de Pagamento PIX" com:

1. **Conta Principal da Plataforma**
   - Input: Chave PIX
   - Select: Tipo (CPF, CNPJ, Email, Telefone, Aleatória)
   - Input: Nome do Titular
   
2. **Configuração de Split**
   - Slider: 0-50% para plataforma (deixar mínimo de 50% para influencer)
   - Toggle: "Taxa OpenPix descontada da minha conta"
   - Info: Exibir exemplo de cálculo em tempo real

3. **Gerenciar Subcontas (Influencers)**
   - Tabela com influencers cadastrados
   - Botão "Sincronizar com Woovi" - cria subcontas automaticamente
   - Status de cada subconta

### Fluxo de Configuração

1. CEO acessa `/ceo/integracoes`
2. Habilita OpenPix e insere App ID
3. Configura sua chave PIX principal
4. Define percentual de split padrão
5. Cadastra influencers com suas chaves PIX
6. Sistema sincroniza subcontas com Woovi
7. Pagamentos são automaticamente divididos

### Considerações de Segurança

- **Chaves PIX e App ID** são armazenados no localStorage (WhiteLabel) e passados para Edge Functions
- Para produção, recomenda-se migrar App ID para Supabase Secrets (já existe `OPENPIX_APP_ID`)
- RLS nas tabelas protege dados de influencers

### Próximos Passos Após Aprovação

1. Criar migração SQL para adicionar coluna
2. Atualizar WhiteLabelContext com novos campos
3. Implementar UI no CEOIntegracoes
4. Criar edge function manage-subaccount
5. Atualizar create-pix-charge
6. Testar fluxo completo

