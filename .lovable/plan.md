

# Plano de Implementacao

## Resumo

Vou implementar duas melhorias no painel admin:

1. **Historico de Pagamentos PIX** (`/admin/pagamentos-pix`) - Substituir a pagina de "em construcao" por um painel completo com lista de pagamentos
2. **Reorganizacao do Config. Videos** (`/admin/videos-config`) - Separar em 4 paginas independentes no menu lateral

---

## Parte 1: Historico de Pagamentos PIX

### O que sera feito

Transformar a pagina atual (que mostra apenas "Sistema em Reconstrucao") em um painel completo de pagamentos com:

- **Cards de resumo**: Total recebido, Pendentes, Pagos, Falhos
- **Tabela de transacoes**: Lista todos os pedidos com status de pagamento
- **Filtros**: Por status (pendente/pago/falho) e por tipo (video/vip_subscription)
- **Detalhes**: Modal com informacoes completas de cada pagamento incluindo split

### Dados disponiveis

A tabela `custom_orders` ja possui todos os dados necessarios:
- `amount_cents` - Valor total
- `payout_amount_cents` - Valor repassado ao criador (79%)
- `status` - pending, paid, payout_done
- `payout_status` - created, approved, failed
- `paid_at` - Data do pagamento
- `product_type` - video ou vip_subscription
- `customer_name` - Nome do cliente

### Interface

```text
+----------------------------------+
|  Pagamentos PIX                  |
+----------------------------------+
| [R$ Total]  [Pendentes]  [Pagos] |
+----------------------------------+
| Filtros: [Todos v] [Tipo v]      |
+----------------------------------+
| # | Cliente | Tipo | Valor | ... |
| 1 | Maria   | VIP  | 19,90 | ... |
| 2 | Carlos  | Video| 49,90 | ... |
+----------------------------------+
```

---

## Parte 2: Separacao do Config. Videos

### O que sera feito

Dividir a pagina atual (que usa tabs) em 4 paginas separadas no menu admin:

| Rota | Titulo | Conteudo |
|------|--------|----------|
| `/admin/videos-config` | Video | URL do video explicativo, titulo, descricao, prazo de entrega |
| `/admin/videos-duracao` | Duracao | Lista de duracoes com precos |
| `/admin/videos-categorias` | Categorias | Lista de categorias com icones |
| `/admin/videos-regras` | Regras | O que pode e o que nao pode |

### Mudancas no Menu

O menu lateral do AdminLayout sera atualizado para incluir as 4 novas opcoes (substituindo a unica "Config. Videos"):

```text
...
- Pedidos
- Pagamentos PIX
- Video           <- Novo
- Duracao         <- Novo  
- Categorias      <- Novo
- Regras          <- Novo
- Usuarios
...
```

---

## Arquivos a Criar/Modificar

### Novos Arquivos
1. `src/pages/admin/AdminVideosDuracao.tsx` - Pagina de duracoes
2. `src/pages/admin/AdminVideosCategorias.tsx` - Pagina de categorias
3. `src/pages/admin/AdminVideosRegras.tsx` - Pagina de regras

### Arquivos a Modificar
1. `src/pages/admin/AdminPagamentosPix.tsx` - Adicionar historico completo
2. `src/pages/admin/AdminVideosConfig.tsx` - Manter apenas configuracao do video explicativo
3. `src/pages/admin/AdminLayout.tsx` - Atualizar menu lateral
4. `src/App.tsx` - Adicionar novas rotas

---

## Detalhes Tecnicos

### Pagamentos PIX
- Query Supabase para buscar todos os pedidos ordenados por data
- Calcular metricas: soma total, contagem por status
- Usar componentes existentes: GlassCard, Table, Badge
- Adicionar RLS policy para admins visualizarem todos os pedidos

### Config. Videos
- Compartilhar o mesmo hook de configuracao (`getVideoConfig`/`saveVideoConfig`)
- Cada pagina edita apenas sua parte da configuracao
- Botao "Salvar" em cada pagina

