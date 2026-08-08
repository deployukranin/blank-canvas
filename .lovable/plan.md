# Correções: upload de ícone, thumbnails, nome da loja e links

## 1. Erro ao subir PNG em /customize (RLS)

Confirmado: a política do bucket `banners` exige que a **primeira pasta do arquivo seja o ID da loja**. O upload do ícone da plataforma grava em `platform-icon/<timestamp>.png`, sem o ID — por isso "new row violates row-level security policy".

Correção: gravar em `<store_id>/platform-icon/<timestamp>.png` (e bloquear o botão quando ainda não houver loja carregada). Os banners já usam o caminho correto.

## 2. Thumbnails do YouTube não carregam em mytinglebox.com

Diagnóstico confirmado ao vivo: carregando `www.mytinglebox.com/februxry` no navegador, as imagens do `i.ytimg.com` (e as fontes do Google) falham com `net::ERR_FAILED`. Com o Service Worker desativado, as mesmas imagens carregam normalmente (naturalWidth 1280). Causa: o Service Worker intercepta **todas** as requisições, inclusive de outros domínios, e as buscas feitas de dentro dele são regidas pelo `Content-Security-Policy` enviado junto do `sw.js`, cujo `connect-src` não inclui `i.ytimg.com` nem `fonts.gstatic.com`. No preview da Lovable não há CSP, por isso funciona.

Correção: o Service Worker passa a interceptar apenas requisições do próprio domínio (retorna sem `respondWith` para qualquer outra origem), e a versão do cache é incrementada para forçar atualização nos navegadores já instalados. Complementarmente, `i.ytimg.com`, `img.youtube.com` e `fonts.gstatic.com` entram no `connect-src` do CSP.

Também será adicionado um fallback de imagem: se `maxresdefault.jpg` falhar, usar `hqdefault.jpg`.

## 3. /community mostra "WhisperScape" em vez do nome da loja

O título da galeria usa `config.siteName`, cujo valor padrão é "WhisperScape" quando a loja não personalizou o nome. Correção: usar o nome real da loja (tenant) como fonte principal, caindo para `siteName` apenas fora do contexto de loja.

## 4. Links abrindo em cozy-corner-seed.lovable.app

Vários fluxos ainda constroem URLs com `window.location.origin` (cadastro/confirmação de e-mail, redirecionos de checkout, retorno do Stripe). Se a origem for a URL da Lovable, o link enviado/aberto aponta para lá. Correção: usar o helper público já existente (`getPublicOrigin()` / `publicUrl()`) nesses pontos, para que sempre resultem em `https://mytinglebox.com/februxry/login` etc. O fluxo de Google OAuth em domínio próprio continua passando pelo domínio publicado apenas para iniciar, mas volta para o domínio público.

## Detalhes técnicos

- `src/pages/admin/AdminPersonalizacao.tsx`: caminho do upload do ícone com prefixo `store.id`.
- `public/sw.js`: `if (new URL(request.url).origin !== self.location.origin) return;` no listener de fetch; `CACHE_NAME` para `v7`.
- `vercel.json`: acrescentar `https://i.ytimg.com https://img.youtube.com https://fonts.gstatic.com` ao `connect-src`.
- `src/components/video/VideoCard.tsx` (e grid/carrossel): `onError` trocando `maxresdefault` por `hqdefault`.
- `src/components/video/VideoGalleryPanel.tsx`: título usando `store?.name` do `TenantContext`.
- `src/contexts/AuthContext.tsx`, `src/pages/ClientAuth.tsx`, `src/pages/Auth.tsx`, `src/pages/VIP.tsx`, `src/pages/Customs.tsx`, `src/pages/admin/AdminPlanos.tsx`: `getPublicOrigin()` no lugar de `window.location.origin`.
