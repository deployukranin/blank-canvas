# Blindar o conteúdo premium: links de mídia não abrem fora da plataforma

Hoje um link `/media?f=...&exp=...&sig=...` funciona em qualquer navegador, em qualquer aba, por até 2 horas — basta copiar e colar. A proposta é fazer esse link só funcionar dentro da plataforma, na sessão de quem tem acesso, e por pouco tempo.

## Como fica

- Colar a URL de mídia numa aba nova: bloqueado (403), inclusive para quem gerou o link.
- Colar em outro navegador/celular/WhatsApp: bloqueado.
- Dentro da plataforma (`/vip`, customs, player): continua funcionando normalmente, com streaming e barra de progresso.
- Assets públicos de marca (banner, ícone da loja) continuam abertos — são branding, não conteúdo pago.

## Camadas de proteção

1. **Vínculo com a sessão do visitante**
   Ao gerar o link (`drive-sign`), o backend passa a emitir também um identificador de sessão de mídia gravado num cookie `HttpOnly`/`Secure`/`SameSite=Lax` no domínio do site. A assinatura do link passa a incluir esse identificador, então o link só é válido no navegador que o solicitou. Link copiado para outro dispositivo deixa de abrir.

2. **Bloqueio de navegação direta**
   O proxy de mídia passa a recusar requisições cujo destino é uma navegação de topo (`Sec-Fetch-Dest: document`) e requisições sem origem/referer do próprio site. Só `img`/`video`/`audio` embutidos na plataforma são servidos. Isso encerra o caso "abrir arquivo em nova aba".

3. **Validade curta**
   Conteúdo VIP e de pedidos (customs) passa de 2 horas para ~5 minutos de validade, com renovação automática pelo player quando a mídia ainda está em uso. Assets de config/preview mantêm validade longa.

4. **Endurecimento da resposta**
   Respostas de mídia passam a sair com `Content-Security-Policy: sandbox`, `Cross-Origin-Resource-Policy: same-origin` e `Cache-Control: private, no-store` para VIP/customs, evitando cache compartilhado e embed em sites de terceiros.

5. **Remoção do visualizador `/media`**
   A página intermediária criada para o favicon deixa de existir: qualquer navegação direta a `/media` responde 403 em vez de renderizar um player. O favicon deixa de ser um problema porque não há mais página de mídia aberta.

## Detalhes técnicos

- `supabase/functions/_shared/drive.ts`: token HMAC passa a assinar `fileId.exp.sessionId.kind`; nova função para emitir/validar o `sessionId` (valor aleatório assinado, sem PII).
- `supabase/functions/drive-sign/index.ts`: lê o cookie de sessão de mídia (encaminhado pelo proxy) ou emite um novo via `Set-Cookie`, e devolve a URL já vinculada; TTL 5 min para `vip`/`custom`, mantém longo para `config`/`preview`.
- `supabase/functions/drive-media/index.ts`: valida cookie + assinatura, rejeita `Sec-Fetch-Dest: document`/`iframe` e `Sec-Fetch-Site: cross-site`, valida `Origin`/`Referer` contra a allowlist (mytinglebox.com, domínios personalizados verificados, preview), aplica novos headers de resposta.
- `middleware.ts`: remove `mediaViewerHtml` e o modo `raw`; `/media` vira proxy puro que encaminha cookies, `range`, `sec-fetch-*`, `origin` e `referer` para a função e repassa `Set-Cookie` de volta.
- `src/lib/external-storage.ts` / `VipMediaViewer` / `VipMediaEmbed`: renovação automática da URL assinada quando expira durante a exibição (re-sign transparente ao erro de carregamento).
- Requisições de assinatura passam a usar `credentials: 'include'` para o cookie trafegar.

## Limitação honesta

Nada impede que quem já tem acesso legítimo grave a tela ou baixe o arquivo pelas ferramentas do navegador. O objetivo aqui é acabar com o vazamento por link compartilhado, que é o furo real hoje.
