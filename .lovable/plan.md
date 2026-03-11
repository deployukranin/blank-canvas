

## Sugestoes de Melhorias

### 1. Lojas dinamicas no banco de dados
Atualmente as lojas estao hardcoded como mock data (`availableStores`). Criar uma tabela `stores` no banco para que lojas criadas em `/ceo/lojas` aparecam automaticamente em `/ceo/integracoes` e em todo o sistema.

### 2. Upload direto de imagens para banners
Os banners personalizados exigem URL externa para a imagem. Adicionar upload direto de imagens usando o file storage do backend, eliminando a dependencia de hospedagem externa.

### 3. Validacao de Channel ID do YouTube
Ao adicionar um canal, validar o Channel ID em tempo real chamando a API do YouTube para confirmar que o canal existe e mostrar o nome/avatar automaticamente.

### 4. Historico real de uso de cotas da API
O widget de cotas usa estimativas. Registrar cada chamada real a API no banco de dados para mostrar o consumo exato e historico de uso ao longo do tempo.

### 5. Integracao com gateway de pagamento (Stripe/PIX)
O `onPurchase` em `integrations.ts` e um mock. Conectar com Stripe ou outro gateway real para processar pagamentos de assinaturas VIP e pedidos custom.

### 6. Persistencia das configuracoes no banco
As configuracoes de integracao (canais por loja, AdSense, banners) devem ser salvas via `saveConfig` no banco de dados, nao apenas no estado local, para que persistam entre sessoes e dispositivos.

### 7. Agendamento de banners
Permitir definir data de inicio e fim para cada banner personalizado, com rotacao automatica baseada em periodo ativo.

### 8. Dashboard de performance dos anuncios
Rastrear impressoes e cliques nos banners personalizados para fornecer metricas basicas de performance no painel CEO.

