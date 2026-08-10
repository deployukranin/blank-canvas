# Plano: Controle de Deploy com GitHub + Vercel

## Situação atual
- O projeto já está conectado ao GitHub e deployado na Vercel.
- A Vercel faz deploy automático sempre que o repositório GitHub é atualizado pela Lovable.
- Isso faz com que qualquer mudança no editor vá direto para a URL principal (`mytinglebox.com`), sem passar pelo botão de Publish da Lovable.
- O botão Publish da Lovable só controla o deploy na URL `.lovable.app`; com Vercel conectado, o fluxo real é Lovable → GitHub → Vercel.

## Objetivo
Criar um fluxo seguro onde você possa testar mudanças antes de colocá-las na URL principal, mas mantendo a agilidade de continuar desenvolvendo no editor.

## Proposta de solução

### 1. Isolar produção na branch `main`
- Configurar a Vercel para fazer deploy de produção **apenas a partir da branch `main`**.
- Desabilitar auto-deploy em outras branches para produção.
- Resultado: a URL principal só muda quando `main` for atualizada manualmente.

### 2. Criar ambiente de staging com branch `develop` ou `staging`
- Criar uma branch `develop` (ou `staging`) no GitHub.
- Configurar a Vercel para gerar uma URL de preview fixa para essa branch (ex: `staging.mytinglebox.com` ou `mytinglebox-staging.vercel.app`).
- Mudanças feitas na Lovable podem ser direcionadas primeiro para `develop`, testadas, e depois mescladas em `main` via Pull Request.

### 3. Separar fluxo de trabalho no editor
- **Fluxo seguro**: fazer alterações na Lovable → sync para GitHub na branch `develop` → testar no staging → merge `develop` → `main` para ir para produção.
- **Fluxo rápido**: pequenos ajustes podem ir direto para `main`, mas de forma consciente.

### 4. Limitação importante: backend (Lovable Cloud)
- Edge Functions, banco de dados, RLS e migrations são compartilhados entre staging e produção, porque usam o mesmo projeto Lovable Cloud.
- Para isolar backend, seria necessário um segundo projeto Lovable (ou segundo Supabase) exclusivo para staging, com sync para outro repositório GitHub.
- A proposta inicial assume que o backend segue o mesmo ambiente, mas que mudanças destrutivas no banco são testadas em preview da Lovable antes de syncar.

### 5. Ajustes de segurança recomendados
- Proteger a branch `main` no GitHub para exigir Pull Request antes de merge.
- Desabilitar deploy automático na Vercel para `main` se desejar controle manual de quando publicar.

## Entregáveis
1. Configurar branch `main` como única fonte de produção na Vercel.
2. Criar e configurar branch `develop` com URL de preview fixa na Vercel.
3. Documentar o fluxo de trabalho (ou implementar automação via GitHub Actions se desejado).
4. (Opcional) Criar segundo projeto Lovable para staging isolado de backend.

## Próximos passos
- Confirmar se deseja staging apenas no frontend ou também no backend (segundo projeto Lovable).
- Escolher nome da URL de staging.
- Confirmar se prefere controle totalmente manual ou merge via Pull Request.
