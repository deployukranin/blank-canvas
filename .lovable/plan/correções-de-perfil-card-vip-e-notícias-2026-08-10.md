# Correções de perfil, card VIP e notícias

## 1. Nome de usuário e foto somem ao trocar de página

Causa: a barra lateral (`DesktopShell` / `CinematicMobileShell`) é montada de novo a cada página, então os hooks `use-profile` e `use-profile-customization` reiniciam o estado vazio e refazem a consulta. Durante esse intervalo o nome cai para "Membro" e o avatar some.

Correção: manter os dados em cache entre navegações, com um cache em memória por usuário/loja dentro dos dois hooks (estado inicial = último valor conhecido, atualização silenciosa em segundo plano). Enquanto carrega, nunca renderizar o fallback "Membro"/avatar padrão se já existir valor em cache.

## 2. Card "crie uma conta / VIP" pisca

Causa: `use-vip-subscription` começa com `isVIP = false` e `isLoading = true`; o card no rodapé da sidebar só checa `!isVIP`, então aparece e some depois que a consulta responde.

Correção: só renderizar o card quando o carregamento terminar (`!isLoading && !isVIP`), e também aplicar o mesmo cache em memória do status VIP para evitar reconsulta visível a cada troca de página. Mesma correção no desktop e no mobile.

## 3. Notícias no topo da home

Mover o bloco de notícias (`feedPosts`) para logo abaixo do hero, antes dos atalhos rápidos e dos vídeos, nos dois layouts da home (Cinematic e Classic), mantendo o mesmo estilo visual e o link "ver todas".

## Detalhes técnicos

- `src/hooks/use-profile.ts`, `src/hooks/use-profile-customization.ts`, `src/hooks/use-vip-subscription.ts`: cache module-level chaveado por `userId` (+ `storeId`), hidratação síncrona no `useState` inicial, revalidação em background.
- `src/components/layout/DesktopShell.tsx`, `src/components/layout/CinematicMobileShell.tsx`: usar `isLoading` para evitar fallback prematuro e esconder o card VIP até resolver.
- `src/components/storefront/layouts/CinematicLayout.tsx`, `src/components/storefront/layouts/ClassicLayout.tsx`: reordenar a seção de notícias para o topo.

Sem mudanças de banco de dados.
