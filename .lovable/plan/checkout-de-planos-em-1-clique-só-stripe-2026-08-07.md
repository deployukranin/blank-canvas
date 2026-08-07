# Checkout de planos em 1 clique (só Stripe)

Hoje a página /plans exige dois passos: clicar em "Selecionar" no plano e depois escolher o método de pagamento (só Stripe) e clicar em "Continuar para Stripe". Como só existe Stripe, o botão do card passa a iniciar o checkout diretamente.

## O que muda

- O botão de cada plano vira "Assinar com Stripe" e, ao clicar, cria a sessão de checkout do Stripe e redireciona na hora.
- O bloco inteiro de "Método de Pagamento" é removido da página.
- Enquanto a sessão está sendo criada, apenas o botão do plano clicado mostra "Carregando..." e todos ficam desabilitados para evitar cliques duplos.
- O plano ativo atual mostra "Plano atual" com o botão desabilitado, em vez de oferecer a compra novamente.
- Mensagens de retorno do Stripe (sucesso/cancelado) continuam iguais.

## Detalhes técnicos

Arquivo: `src/pages/admin/AdminPlanos.tsx`

- Remover os estados `paymentMethod` e `selectedPlan` (o id do plano passa a ser argumento direto), mantendo `isCheckingOut` como `checkoutPlanId: string | null`.
- `handlePayment` passa a receber `planId` e continua chamando a edge function `platform-subscription-checkout` com `store_id`, `plan_id`, `currency` (brl/usd conforme idioma) e as URLs de sucesso/cancelamento atuais.
- Remover o JSX do cartão de método de pagamento e os ícones não usados (`QrCode`); manter `CreditCard` no botão.
- Chaves i18n: reutilizar `admin.plans.payWithStripe`; remover uso de `admin.plans.selected`, `admin.plans.select`, `admin.plans.selectMethod`, `admin.plans.pixDesc`, `admin.plans.payWithPix`, `admin.plans.comingSoon`, `admin.plans.paymentMethod`. Adicionar `admin.plans.currentPlanBadge` ("Plano atual" / "Current plan" / "Plan actual") em pt/en/es.
- Nenhuma mudança de backend, banco ou edge function.
