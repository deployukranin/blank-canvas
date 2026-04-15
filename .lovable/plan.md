

## Plano: Trial expirado = loja offline + auto-exclusão em 7 dias

### Resumo
Quando o trial de uma loja expirar, clientes verão uma tela "Plataforma Offline". O criador verá um aviso no admin para contratar um plano. Lojas com trial expirado há mais de 7 dias serão automaticamente apagadas.

### O que muda para o usuário final

1. **Clientes** que acessarem uma loja com trial expirado verão uma página bonita dizendo "Esta plataforma está temporariamente offline" — sem acesso a nenhum conteúdo.
2. **Criadores (admin)** verão um banner de alerta no painel admin informando que o trial expirou e que têm X dias para contratar um plano antes da exclusão automática.
3. Lojas expiradas há 7+ dias serão apagadas automaticamente por um job agendado.

---

### Detalhes Técnicos

#### 1. Alterar TenantContext para carregar dados de plano
- Remover o filtro `.eq('status', 'active')` da query de stores no `TenantContext.tsx`
- Adicionar `plan_type` e `plan_expires_at` ao `StoreInfo`
- Carregar a loja mesmo se `status = 'suspended'` ou trial expirado

#### 2. Alterar TenantGate para mostrar tela "Offline"
- Verificar se `store.plan_expires_at` já passou e `plan_type === 'trial'`
- Se sim, renderizar um componente `<StoreOffline>` com mensagem amigável para clientes
- Se o usuário for admin/creator da loja, permitir acesso ao painel admin (com banner de alerta)

#### 3. Criar componente `StoreOffline`
- Tela fullscreen com ícone e mensagem: "Esta plataforma está temporariamente offline. Entre em contato com o criador."
- Design consistente com o tema dark/glass do projeto

#### 4. Adicionar banner de alerta no AdminLayout
- Quando trial expirado, mostrar banner vermelho no topo do painel admin: "Seu trial expirou! Contrate um plano em X dias ou sua loja será apagada."
- Calcular dias restantes antes da exclusão (7 dias após expiração)
- Link para a página `/:slug/admin/plans`

#### 5. Criar Edge Function `cleanup-expired-stores`
- Busca lojas com `plan_type = 'trial'` e `plan_expires_at < now() - interval '7 days'`
- Executa a mesma lógica de cascade delete que já existe em `super-admin-manage-store` (apaga store_admins, store_users, invite_codes, app_configurations, custom_orders, video_ideas, video_chat_messages, depois a store)
- Protegida por verificação de Authorization header (será chamada via cron)

#### 6. Agendar cron job via pg_cron
- Rodar `cleanup-expired-stores` diariamente
- Usar `pg_cron` + `pg_net` para chamar a edge function

#### 7. Atualizar a query RLS/stores
- A RLS de `stores` já permite anon ver lojas `active`. Precisamos também permitir que anon veja lojas com trial expirado (para mostrar a tela offline em vez de 404). Ajustar a policy de SELECT para `(status = 'active' OR (plan_type = 'trial'))`.

