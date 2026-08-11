# Correção conservadora dos headers de segurança HTTP

## O que a auditoria mostrou

Boa parte do que o scanner apontou já está configurado em `vercel.json` (CSP completa, HSTS, nosniff, Referrer-Policy, Permissions-Policy, `frame-ancestors 'self'`, `object-src 'none'`, sem `unsafe-eval`, sem `unsafe-inline` em script-src).

O problema real é **onde esses headers não chegam**:

1. **Todas as navegações HTML passam pelo Edge Middleware** (`middleware.ts`), que monta e devolve uma `Response` própria copiando apenas os headers do `index.html` de origem. Ou seja: as páginas que o scanner realmente visita podem sair **sem CSP, sem HSTS, sem nosniff, sem frame-ancestors** — o que explica "Missing Anti-clickjacking Header", "HSTS Not Set" e vários avisos de CSP.
2. **A rota `/media`** (proxy de mídia protegida) devolve a resposta do upstream sem headers de segurança nem `Cache-Control: no-store` consistente.
3. **Cookies** criados no cliente (`tb_track` de atribuição e o cookie de estado da sidebar) não têm `Secure` nem `SameSite` — daí "SameSite None" e "escopo fraco".

Serviços externos realmente usados (confirmados no código): Supabase (REST, Auth, Realtime WSS, Edge Functions), Stripe (js.stripe.com, checkout, api), YouTube/ytimg (embed, thumbs), Google APIs (Drive), Google Fonts. Nada além disso precisa entrar na allowlist.

## O que será feito

### 1. Fonte única de headers de segurança
Criar um módulo `security-headers` compartilhado com a política final e aplicá-lo:
- em **todas as respostas do middleware** (HTML das páginas e `/media`);
- mantendo o bloco equivalente em `vercel.json` para assets e fallback.

Headers aplicados a todas as páginas:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")`
- `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-site`
- CSP com `frame-ancestors 'self'` como proteção principal de clickjacking (X-Frame-Options fica só como fallback legado, não como substituto).

### 2. CSP revisada (allowlist explícita, sem `*` de host livre)
Mantendo a política atual e apenas trocando curingas amplos por hosts explícitos onde é seguro:
- `script-src 'self' https://js.stripe.com https://www.youtube.com https://s.ytimg.com` — `cdn.gpteng.co` só em preview/dev, removido do build de produção.
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — `unsafe-inline` **permanece**: é exigido pelo `<style id="ssr-theme">` injetado pelo middleware, pelos estilos inline do Radix/shadcn e pelo `chart.tsx`. Remover quebraria o tema e o layout.
- `img-src`, `media-src`, `connect-src`, `frame-src`, `font-src`: hosts nomeados de Supabase (projeto), Stripe, YouTube, googleapis e Google Fonts, substituindo `https://*.youtube.com` e similares por hosts fixos onde possível.
- Diretivas explícitas garantidas: `default-src`, `script-src`, `script-src-attr 'none'`, `style-src`, `img-src`, `font-src`, `connect-src`, `media-src`, `frame-src`, `frame-ancestors`, `object-src`, `base-uri`, `form-action`, `worker-src`, `manifest-src`.
- `unsafe-eval` já não existe e continua fora.

### 3. Cache
- Páginas HTML (todas passam pelo middleware, incluindo dashboards): `Cache-Control: no-store, no-cache, must-revalidate` + `Pragma: no-cache`.
- `/media`: `private, no-store`.
- Assets estáticos com hash: cache imutável **inalterado**.

### 4. Cookies
- `tb_track` (atribuição) e o cookie da sidebar passam a ser gravados com `; Secure; SameSite=Lax; Path=/` (Secure omitido em `localhost` para não quebrar o dev).
- Nenhum cookie do projeto precisa de `SameSite=None`; a sessão do Supabase vive no cliente, não em cookie próprio — `HttpOnly` não é aplicável a cookies gravados por JS e isso será registrado como limitação conhecida.

### 5. localStorage e XSS
- Auditoria do que é gravado: tema/white-label, cache de perfil, histórico de vídeo, preferências. **Nenhuma senha, API key ou secret.** O token de sessão do Supabase fica em localStorage por design do SDK — trocar isso exigiria mudança de arquitetura (cookies SSR) e está fora do escopo conservador; ficará documentado como risco aceito.
- Os dois usos de `dangerouslySetInnerHTML` serão revisados: `chart.tsx` (CSS gerado internamente) e `SocialLinksBar` (SVG de catálogo estático). Se o SVG puder vir de dado editável no painel, ele passa a ser renderizado a partir de um mapa fixo de ícones, sem HTML dinâmico.

### 6. Comentários e vazamento de informação
Varredura por comentários com TODO de segurança, endpoints internos e nomes de infraestrutura em código que vai para o bundle; remoção do que for desnecessário. Os comentários explicativos de arquitetura em arquivos de servidor permanecem.

## Verificação
Build, console limpo, e teste manual de: login/logout, recuperação de senha, dashboard admin, upload (Drive), chamadas Supabase/Edge Functions, imagens (YouTube thumbs, Supabase storage), fontes, embed de vídeo e Stripe Connect. Ao final, relato de quais headers ficaram ativos e quais alertas não podem ser corrigidos sem quebrar funcionalidade (`style-src 'unsafe-inline'`, sessão em localStorage, cookies sem HttpOnly).
