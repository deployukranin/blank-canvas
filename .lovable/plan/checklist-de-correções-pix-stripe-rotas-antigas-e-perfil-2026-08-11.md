# Checklist de correções: PIX, Stripe, rotas antigas e perfil

## 1. PIX manual — erro ao gerar

Causa confirmada: ao salvar a chave PIX no painel, o método de pagamento ativo nunca chega ao banco. Nas três lojas que já preencheram os dados do PIX, a chave/nome/cidade estão salvos, mas o campo "gateway ativo" está vazio. Por isso o servidor responde "nenhum método de pagamento configurado" na hora de gerar a cobrança.

Correções:
- Corrigir o salvamento imediato das configurações para gravar sempre o estado mais recente (hoje ele grava a versão anterior e ainda cancela o salvamento automático pendente). Isso afeta todas as telas do painel que usam "salvar agora", não só pagamentos.
- Ao salvar o PIX, marcar o PIX manual como método ativo e confirmar a gravação antes de mostrar a mensagem de sucesso.
- Rede de segurança no servidor: se não houver método ativo definido mas os dados do PIX estiverem completos, gerar a cobrança por PIX manual mesmo assim.
- Regularizar as lojas existentes que já têm PIX preenchido, para que voltem a vender sem precisar salvar de novo.

Segunda causa: o QR Code é gerado por um serviço externo (`api.qrserver.com`) que está bloqueado pela política de segurança do site — a imagem simplesmente não aparece em produção. O QR passa a ser desenhado no próprio site a partir do código PIX, sem depender de serviço externo.

## 2. Stripe Connect — continua "pendente"

As lojas já têm conta Stripe vinculada. O painel só mostra "conectado" quando a Stripe libera cobranças (`charges_enabled`), e isso depende do cadastro ser aprovado do lado da Stripe.

Ajustes no painel:
- Separar claramente dois estados: "Conta vinculada" (verde) e "Cobranças liberadas" (pendente/ativo), em vez de um único selo que parece erro.
- Listar em português/inglês/espanhol exatamente quais pendências a Stripe está exigindo, com botão que leva direto para completar o cadastro na Stripe.
- Definir o Stripe como método ativo assim que a conta estiver vinculada (hoje só acontece depois da liberação, e mesmo assim não era gravado por causa do bug do item 1).
- Manter o botão de atualizar status.

Observação: se após completar o cadastro a Stripe mantiver pendências, a ação restante é no painel da Stripe — o SaaS já estará sincronizado.

## 3. /perfil e /comunidade dando 404

Causa: essas URLs antigas caem na rota de loja (`/:slug`), não encontram loja com esse nome e mostram 404.

Correção: mapear os nomes antigos em português para as rotas atuais, redirecionando silenciosamente:
- `/perfil` → `/profile`, `/comunidade` → `/community`, e o mesmo dentro de lojas (`/:slug/perfil`, `/:slug/comunidade`), além de `pedidos`, `ideias`, `galeria`, `ajuda`.

## 4. Perfil novo sem foto e banner

- Foto padrão passa a ser servida por um arquivo público do próprio site, garantindo que apareça sempre (a imagem atual usa um caminho que não sobrevive ao domínio personalizado).
- Banner: usuários sem VIP passam a ver o banner padrão em degradê com as cores da loja e o aviso "Desbloquear com VIP", sem nenhum botão de envio. O envio de banner e avatar personalizados continua exclusivo para assinantes VIP.

## Detalhes técnicos

- `src/hooks/use-persistent-config.ts`: `saveNow` passa a aceitar um override e usar uma referência ao estado atual.
- `src/pages/admin/AdminPagamentosPix.tsx`: `handleSavePix` salva com override; UI de status Stripe separada em vinculado/liberado.
- `supabase/functions/create-pix-charge` e `create-vip-charge`: fallback para `pix_manual` quando `activeGateway` for nulo e `pixManual` estiver completo.
- Migração de dados: `UPDATE app_configurations` definindo `activeGateway` nas lojas com PIX completo.
- QR: renderizar via biblioteca no cliente (`qrcode`) a partir do `br_code`; remover dependência de `api.qrserver.com`.
- `src/App.tsx`: rotas de alias legadas com `<Navigate replace>` antes de `/:slug`.
- `src/components/profile/PremiumProfileHeader.tsx`: avatar padrão em `public/`, banner padrão via `DefaultBanner` para não-VIP.
- Sem mudanças de esquema no banco.
