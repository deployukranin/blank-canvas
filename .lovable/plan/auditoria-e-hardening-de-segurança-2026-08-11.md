# Auditoria e Hardening de Segurança

Auditoria completa de controle de acesso (banco, funções de backend, frontend), com correções conservadoras e relatório final. Nada de funcionalidade, schema ou regra de acesso será alterado sem antes ser diagnosticado.

## Estado já verificado (leituras feitas agora)

- Todas as 46 tabelas do schema público têm RLS habilitado. Nenhuma tabela sem RLS.
- Apenas 2 tabelas têm policy equivalente a acesso universal: `youtube_videos_cache` e `youtube_cache_metadata` (cache público de vídeos) — a avaliar se leitura pública é intencional e se escrita está restrita.
- Buckets de storage: `payment-proofs`, `vip-media`, `email-assets` privados; `banners` e `media-previews` públicos (leitura). Políticas de escrita/exclusão em `storage.objects` são baseadas em role.
- 35 funções de backend. Todas as invocadas pelo app rodam com verificação de JWT desativada no gateway, ou seja, a autorização precisa acontecer dentro de cada função. Cinco delas não apresentam nenhuma checagem de identidade no código: `cleanup-expired-stores`, `csp-report`, `drive-media`, `stripe-webhook`/`platform-subscription-webhook` e `youtube-videos` — cada uma precisa ser classificada (cron, público, token, webhook assinado) e corrigida se a exposição não for intencional.
- Frontend: nenhum uso de chave de serviço no bundle; apenas as chaves públicas do projeto no `.env`. Dois usos de HTML dinâmico: `SocialLinksBar.tsx` (catálogo estático de ícones) e `ui/chart.tsx` (CSS gerado internamente).

Esses são pontos de partida; o diagnóstico definitivo de cada item faz parte do trabalho abaixo.

## O que será feito

### 1. Banco de dados e RLS
- Extrair todas as policies (comando, roles, condições) e revisar tabela a tabela: leitura anônima, escrita anônima, propriedade por `auth.uid()`, escalonamento entre lojas (`store_id`).
- Verificar GRANTs por role — uma tabela sem policy para `anon` mas com GRANT amplo continua sendo superfície de ataque.
- Foco especial em tabelas financeiras e de identidade: `custom_orders`, `vip_subscriptions`, `affiliate_commissions`, `affiliate_payouts`, `referral_commissions`, `user_roles`, `profiles`, `stores`, `app_configurations`, `admin_credentials`, `support_*`, `order_messages`.
- Validar que nenhum usuário consegue conceder role a si mesmo (`user_roles` INSERT/UPDATE) nem alterar campos financeiros dos próprios pedidos.
- Corrigir apenas o que estiver realmente frouxo, com policies escopadas — sem `USING (true)`, sem desabilitar RLS, sem service role como atalho.

### 2. Storage
- Revisar as policies de `storage.objects` por bucket: quem lê, escreve, sobrescreve e apaga.
- Confirmar que caminhos são escopados por loja/usuário e que não é possível sobrescrever arquivo alheio manipulando o path.
- Confirmar que `banners`/`media-previews` públicos não contêm conteúdo pago; conteúdo VIP permanece privado com URL assinada.

### 3. Autorização no servidor
- Inventário classificado das 35 funções: Público, Autenticado, Privilegiado, Webhook, Cron.
- Para cada uma: valida o token? identifica o usuário? checa a role em fonte confiável (`user_roles`/`has_role`)? checa a propriedade do recurso (loja, pedido, ticket) antes de ler/alterar/apagar?
- Caça a IDOR/BOLA: qualquer id vindo do cliente (`storeId`, `orderId`, `ticketId`, `fileId`, `payoutId`, `trackerId`) precisa ser cruzado com a identidade do chamador.
- Webhooks: confirmar verificação de assinatura e proteção contra replay.
- Funções de cron/manutenção: exigir segredo próprio ou role de serviço, nunca ficar abertas.

### 4. Frontend
- Mapear todas as decisões de segurança feitas só no React (guards de rota, menus, botões) e confirmar que cada operação correspondente tem checagem equivalente no servidor. O frontend continua como UX; nada é removido de lá.
- Confirmar que nenhum payload envia role/plano/preço/ownership como prova de autorização.

### 5. Secrets
- Varredura por chaves, tokens, senhas e credenciais no código, bundle, logs e respostas de erro.
- Distinção explícita entre chave pública do projeto (esperada no navegador) e segredo real.
- Se algo realmente exposto aparecer, aviso claro de rotação obrigatória.

### 6. Inputs, XSS e uploads
- Revisar formulários, parâmetros de URL e conteúdo criado por usuário renderizado na interface.
- Uploads: validar no servidor tamanho, tipo/MIME, extensão, autenticação, autorização e caminho; bloquear formatos executáveis (HTML/SVG) onde não forem necessários.

### 7. Rate limit
- Mapear onde já existe limitação (existe uma função de rate limit no banco) e aplicar nos pontos abusáveis que ainda não usam: login, recuperação de senha, cadastro, envio de email, upload, convites, endpoints com custo.
- Limitação persistida no banco, nunca contador em memória.

### 8. Verificação
- Revisão dos cenários: visitante anônimo, usuário A vs usuário B, usuário comum tentando operação administrativa, admin legítimo continuando a funcionar.
- Rodar o linter de banco, os testes existentes, build e typecheck.

## Relatório final

Tabela `Problema | Local | Severidade | Exploração possível | Correção aplicada | Status`, separada em CRÍTICO / ALTO / MÉDIO / BAIXO / INFORMATIVO, com as respostas explícitas a cada pergunta da lista (tabelas com e sem RLS, policies encontradas, A vs B, endpoints autenticados vs com ownership, IDOR, secrets, uploads, rate limit, o que não pôde ser corrigido e por quê).

## Restrições respeitadas

Sem enfraquecer CSP/headers já configurados; sem desabilitar RLS; sem policies universais; sem expor service role; integrações com Stripe, Google Drive e YouTube preservadas.
