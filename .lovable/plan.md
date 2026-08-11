# Conectar Stripe em poucos cliques (conta existente)

Hoje o botão "Conectar Stripe" cria uma conta Standard **nova** pela API e abre o formulário de onboarding do Stripe — por isso ele pede todos os dados de novo, mesmo quem já tem conta.

A forma correta para quem já tem conta é o **Connect OAuth**: o criador é levado para a tela "Conectar com a Stripe", faz login na conta que já existe e autoriza em 2 cliques. Nada de preencher CNPJ, banco e documentos outra vez.

## Como fica o fluxo

1. No painel de pagamentos, o botão passa a ser "Conectar com a Stripe".
2. Abre a tela da Stripe já com o e-mail preenchido; o criador escolhe **"Já tenho uma conta Stripe" → login**.
3. Autoriza e volta para o painel com a conta vinculada e o status real (cobranças/repasses ativos).
4. Quem **não** tem conta continua conseguindo criar uma na mesma tela (a Stripe oferece isso no próprio fluxo), então ninguém fica de fora.
5. Continua existindo o botão "Atualizar status" e, se a Stripe pedir pendências, um link para completar só o que falta.

## O que você precisa fazer uma vez

No painel da Stripe da plataforma (Settings → Connect → Platform settings):
- Ativar o OAuth para contas Standard e copiar o **Connect client ID** (`ca_...`).
- Cadastrar as URLs de redirecionamento: `https://mytinglebox.com/{slug}/admin/payments` e o domínio de preview.

Depois disso eu peço o `STRIPE_CONNECT_CLIENT_ID` pelo formulário seguro de secrets.

## Detalhes técnicos

- Nova edge function `stripe-connect-oauth-start`: valida sessão + permissão na loja, monta `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=...&scope=read_write&state=<token assinado com store_id>&stripe_user[email]=...` e devolve a URL.
- Nova edge function `stripe-connect-oauth-callback` (rota `/oauth/token`): troca o `code` por `stripe_user_id`, valida o `state` (guardado com TTL curto), grava `stripe_account_id` na loja e sincroniza o status via `/v1/accounts/{id}`.
- `stripe-connect-onboarding` deixa de criar conta nova por padrão; fica só para gerar `account_link` de pendências quando `requirements` existirem.
- `stripe-connect-status` inalterado, exceto por refletir contas vindas do OAuth.
- Frontend `AdminPagamentosPix.tsx`: botão chama a nova função e redireciona; ao voltar com `?stripe=connected` faz refresh do status e mostra toast. Textos novos em pt-BR, EN e ES.
- Fallback: se `STRIPE_CONNECT_CLIENT_ID` não estiver configurado, mantém o fluxo atual para não quebrar nada.
