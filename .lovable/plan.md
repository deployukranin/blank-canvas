
## Plano: Sistema de Exportacao de Metricas para Painel Externo

### Objetivo

Criar um sistema completo para enviar metricas da plataforma para outro painel externo, coletando o maximo de dados possiveis do Supabase e enviando periodicamente ou sob demanda.

### Metricas Disponiveis

Com base na analise do banco de dados, as seguintes metricas podem ser exportadas:

| Categoria | Metrica | Fonte |
|-----------|---------|-------|
| **Usuarios** | Total de perfis | `profiles` |
| **Usuarios** | Novos usuarios (periodo) | `profiles.created_at` |
| **Usuarios** | Usuarios ativos (periodo) | `profiles.updated_at` |
| **Usuarios** | Total de admins/CEOs | `user_roles` |
| **Pagamentos** | Total de pagamentos | `pix_payments` |
| **Pagamentos** | Pagamentos por status | `pix_payments.status` |
| **Pagamentos** | Receita total (centavos) | `pix_payments.value WHERE status='COMPLETED'` |
| **Pagamentos** | Receita por tipo de produto | `pix_payments.product_type` |
| **Pagamentos** | Split para influencers | `pix_payments.split_influencer_value` |
| **Pagamentos** | Split para plataforma | `pix_payments.split_platform_value` |
| **Videos** | Total de reacoes | `video_reactions` |
| **Videos** | Reacoes por tipo | `video_reactions.reaction_type` |
| **Videos** | Videos mais curtidos | Agregacao por `video_id` |
| **Videos** | Total de visualizacoes | `video_watch_history` |
| **Videos** | Videos mais assistidos | Agregacao por `video_id` |
| **Videos** | Taxa de conclusao | `video_watch_history.completed` |
| **Comunidade** | Mensagens no chat | `video_chat_messages` |
| **Influencers** | Total de influencers ativos | `influencers.is_active` |
| **Influencers** | Subcontas Woovi sincronizadas | `influencers.woovi_subaccount_id` |

### Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE METRICAS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Painel CEO (CEOIntegracoes.tsx)                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Secao: Exportacao de Metricas                             │ │
│  │ - URL do painel externo                                   │ │
│  │ - API Key do painel                                       │ │
│  │ - Botao "Enviar Agora"                                    │ │
│  │ - Toggle "Envio automatico" (intervalo)                   │ │
│  │ - Preview das metricas                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│         │                                                       │
│         ▼                                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │        Edge Function: export-metrics                      │ │
│  │                                                           │ │
│  │  1. Coleta metricas do Supabase                           │ │
│  │  2. Agrega dados por periodo                              │ │
│  │  3. Envia para URL configurada                            │ │
│  │  4. Retorna confirmacao                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│         │                                                       │
│         ▼                                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │            Painel Externo (seu outro sistema)             │ │
│  │  POST /api/receive-metrics                                │ │
│  │  { projectId, timestamp, metrics: {...} }                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Implementacao

#### 1. Atualizar WhiteLabelContext

Adicionar nova secao de configuracao para exportacao de metricas:

```typescript
tokens: {
  // ... existentes ...
  metricsExport: {
    enabled: boolean;
    apiUrl: string;      // URL do painel externo
    apiKey: string;      // Chave de autenticacao
    autoSendEnabled: boolean;
    autoSendInterval: number; // minutos (ex: 60 = a cada hora)
    lastSentAt?: string;
  };
}
```

#### 2. Criar Edge Function `export-metrics`

Nova edge function que:
- Aceita parametros de periodo (hoje, 7 dias, 30 dias, customizado)
- Coleta todas as metricas do Supabase usando service_role
- Agrega os dados
- Envia para a URL configurada
- Suporta modo "preview" que retorna os dados sem enviar

Payload de metricas:

```typescript
interface MetricsPayload {
  projectId: string;
  timestamp: string;
  period: {
    start: string;
    end: string;
    label: string;
  };
  metrics: {
    users: {
      total: number;
      newInPeriod: number;
      activeInPeriod: number;
      byRole: { admin: number; ceo: number; moderator: number; user: number };
    };
    payments: {
      total: number;
      byStatus: { pending: number; completed: number; expired: number; refunded: number; cancelled: number };
      revenueTotal: number;
      revenueByProduct: Record<string, number>;
      splitInfluencer: number;
      splitPlatform: number;
    };
    videos: {
      totalReactions: number;
      reactionsByType: { relaxante: number; dormi: number; arrepios: number; favorito: number };
      topReactedVideos: Array<{ videoId: string; count: number }>;
      totalViews: number;
      completionRate: number;
      topWatchedVideos: Array<{ videoId: string; views: number }>;
    };
    community: {
      totalChatMessages: number;
      messagesInPeriod: number;
    };
    influencers: {
      total: number;
      active: number;
      syncedWithWoovi: number;
    };
  };
}
```

#### 3. Interface no Painel CEO

Nova secao em CEOIntegracoes.tsx:

**Secao "Exportacao de Metricas"** com:

- Toggle: Habilitar exportacao
- Input: URL do painel externo (ex: `https://meu-painel.com/api/v1`)
- Input: API Key (com toggle de visibilidade)
- Select: Periodo padrao (Hoje, 7 dias, 30 dias, Tudo)
- Toggle: Envio automatico
- Select: Intervalo (15 min, 30 min, 1 hora, 6 horas, 24 horas)
- Botao: "Enviar Agora"
- Botao: "Visualizar Metricas" (preview sem enviar)
- Info: Ultimo envio bem-sucedido

### Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/contexts/WhiteLabelContext.tsx` | Modificar | Adicionar `metricsExport` em tokens |
| `supabase/functions/export-metrics/index.ts` | **NOVO** | Edge function para coletar e enviar metricas |
| `supabase/config.toml` | Modificar | Registrar nova funcao |
| `src/pages/ceo/CEOIntegracoes.tsx` | Modificar | Adicionar secao de exportacao |
| `src/hooks/use-metrics-export.ts` | **NOVO** (opcional) | Hook para gerenciar estado da exportacao |

### Secao Tecnica - Consultas SQL

A Edge Function executara as seguintes queries:

```sql
-- Usuarios
SELECT COUNT(*) as total FROM profiles;
SELECT COUNT(*) FROM profiles WHERE created_at >= :period_start;
SELECT COUNT(*) FROM profiles WHERE updated_at >= :period_start;

-- Roles
SELECT role, COUNT(*) as count FROM user_roles GROUP BY role;

-- Pagamentos
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'COMPLETED' THEN value ELSE 0 END) as revenue,
  SUM(CASE WHEN status = 'COMPLETED' THEN split_influencer_value ELSE 0 END) as split_inf,
  SUM(CASE WHEN status = 'COMPLETED' THEN split_platform_value ELSE 0 END) as split_plat
FROM pix_payments WHERE created_at >= :period_start;

SELECT status, COUNT(*) FROM pix_payments GROUP BY status;
SELECT product_type, SUM(value) FROM pix_payments WHERE status = 'COMPLETED' GROUP BY product_type;

-- Videos - Reacoes
SELECT reaction_type, COUNT(*) FROM video_reactions GROUP BY reaction_type;
SELECT video_id, COUNT(*) as cnt FROM video_reactions GROUP BY video_id ORDER BY cnt DESC LIMIT 10;

-- Videos - Visualizacoes
SELECT COUNT(*) FROM video_watch_history;
SELECT COUNT(*) FILTER (WHERE completed = true) * 100.0 / NULLIF(COUNT(*), 0) FROM video_watch_history;
SELECT video_id, COUNT(*) as views FROM video_watch_history GROUP BY video_id ORDER BY views DESC LIMIT 10;

-- Comunidade
SELECT COUNT(*) FROM video_chat_messages;
SELECT COUNT(*) FROM video_chat_messages WHERE created_at >= :period_start;

-- Influencers
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as active,
  COUNT(*) FILTER (WHERE woovi_subaccount_id IS NOT NULL) as synced
FROM influencers;
```

### Interface Visual Proposta

```text
┌────────────────────────────────────────────────────────────────┐
│  📊 Exportacao de Metricas                     [Toggle ON/OFF] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  URL do Painel Externo:                                        │
│  [https://meu-painel.com/api/v1/metrics                    ]   │
│                                                                │
│  API Key:                                                      │
│  [••••••••••••••••••••••••••••••                ] 👁️           │
│                                                                │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐│
│  │ Periodo: [30 dias ▼] │  │ ⏰ Envio Automatico: [  OFF  ] ││
│  └──────────────────────┘  │    Intervalo: [1 hora ▼]       ││
│                            └─────────────────────────────────┘│
│                                                                │
│  ┌──────────────────┐  ┌────────────────────┐                 │
│  │ 📤 Enviar Agora  │  │ 👁️ Visualizar      │                 │
│  └──────────────────┘  └────────────────────┘                 │
│                                                                │
│  ✅ Ultimo envio: 29/01/2026 07:30 - Sucesso                  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Preview das Metricas (ultimos 30 dias)                 │  │
│  │                                                         │  │
│  │  👥 Usuarios: 1,247 (12 novos)                          │  │
│  │  💳 Pagamentos: R$ 8.456,80 (342 transacoes)            │  │
│  │  📺 Videos: 2,891 visualizacoes | 156 reacoes           │  │
│  │  💬 Chat: 89 mensagens                                  │  │
│  │  🎭 Influencers: 2 ativos | 1 sincronizado              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Endpoint Esperado no Painel Externo

O painel que recebera as metricas deve implementar:

```
POST /api/receive-metrics (ou caminho customizado)
Headers:
  Content-Type: application/json
  X-API-Key: {sua-api-key}

Body: MetricsPayload (descrito acima)

Response esperado:
{
  "success": true,
  "message": "Metrics received successfully",
  "id": "metric-123456"
}
```

### Consideracoes de Seguranca

- API Key nunca e exposta no frontend (enviada apenas para edge function)
- Edge function usa `service_role` para acessar dados agregados
- Dados sensiveis (emails, nomes) NAO sao exportados - apenas contagens/agregacoes
- Logs de envio armazenados localmente para auditoria

### Proximos Passos Apos Aprovacao

1. Atualizar WhiteLabelContext com configuracao `metricsExport`
2. Criar edge function `export-metrics`
3. Atualizar `supabase/config.toml`
4. Implementar UI no CEOIntegracoes
5. Testar com preview local
6. Documentar formato esperado pelo painel receptor
