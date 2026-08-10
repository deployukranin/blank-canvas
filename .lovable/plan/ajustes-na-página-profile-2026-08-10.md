# Ajustes na página /profile

## 1. Rodapé da barra lateral (sem e-mail)
No cartão de conta do canto inferior esquerdo, trocar o e-mail pela foto de perfil do usuário e o `@` da conta (fallback: iniciais + "Membro" quando ainda não há @).

## 2. Card VIP do rodapé some para assinantes
O bloco promocional "VIP / Create your account…" na barra lateral hoje aparece sempre. Passa a ser exibido apenas para quem **não** tem VIP ativo (a conta de teste já tem assinatura ativa no banco, então ele desaparece).

## 3. Checklist da jornada
O passo "Adicionar foto de perfil" só olha para um único campo e ignora o avatar enviado na área premium. Passa a considerar concluído quando existir avatar em qualquer origem (perfil ou personalização VIP). Também corrigir os demais passos para refletirem o estado real:
- pedido feito: consultar os pedidos do usuário na loja atual;
- ideia enviada: consultar as ideias criadas pelo usuário;
- VIP: já funciona.

## 4. @ definido apenas uma vez
Mostrar o seletor de @ no /profile para quem ainda não tem handle. Depois de definido, o @ aparece apenas como texto, sem qualquer botão/campo de edição. A regra de uma única vez já é garantida no backend pela função `set_user_handle`; a interface passa a respeitá-la de forma explícita.

## 5. Remover campos do editor de perfil
Remover do editor premium: **nome de exibição**, **pronomes** e **status de mensagem** (inclusive a bolha de status no banner). O editor fica só com banner e avatar. O nome mostrado passa a ser o @ / nome da conta.

## 6. Tradução completa
Traduzir todos os textos de /profile (cabeçalho premium, reputação, ranking, jornada, upsell VIP, acessos rápidos, menu e mensagens de erro de upload) em EN, PT-BR e ES, sem strings fixas em código.

## 7. Banner e avatar padrão para usuários free
Gerar duas artes padrão (banner e avatar) no estilo escuro/minimalista da plataforma e usá-las quando o usuário não é VIP ou não enviou mídia própria. O bloqueio "Desbloquear com VIP" continua sobre o banner padrão.

## Detalhes técnicos
- `src/components/layout/DesktopShell.tsx`: usa `useProfile` + `useVIPSubscription` para o rodapé (avatar/@) e condicional do card VIP; mesmo ajuste no `CinematicMobileShell` se o bloco existir lá.
- `src/components/profile/PremiumProfileHeader.tsx`: remover estados `displayName`/`pronouns`/`statusText` e o formulário; manter uploads; aplicar assets padrão.
- `src/pages/Perfil.tsx`: integrar `HandleSelector`, corrigir os `steps` do checklist com dados reais (`custom_orders`, `video_ideas`) e aplicar chaves i18n.
- `src/i18n/locales/{en,pt-BR,es}.json`: novas chaves em `profile.*`.
- Sem alteração de esquema no banco.
