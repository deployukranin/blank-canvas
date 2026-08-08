# Tudo no Google Drive, organizado por cliente

## Situação atual (verificada no código)

- VIP, entregas de customs e previews **já vão para o Google Drive**, dentro da pasta raiz TingleBox → pasta do cliente (`slug (email)`) → subpastas `vip`, `customs`, `previews`.
- Banners e ícone/favicon da plataforma **não vão para o Drive**: são enviados para o bucket `banners` do backend (`AdminPersonalizacao.tsx`), em `<storeId>/banners` e `<storeId>/platform-icon`.

## O que muda

### 1. Pastas padronizadas por cliente

Dentro da pasta do cliente no Drive, três pastas fixas:

```text
TingleBox/
  februxry (email@dominio.com)/
    config/     banners, ícone/favicon e demais assets visuais
    vip/        fotos e vídeos VIP
    customs/    entregas dos pedidos + previews de customs
```

`previews` passa a ser gravado em `customs` (arquivos antigos continuam acessíveis onde estão).

### 2. Banners e ícone passam a ir para o Drive (`/config`)

- O upload de banner (desktop/mobile) e o upload do ícone da plataforma passam a usar o mesmo fluxo de upload do Drive, com `kind: 'config'`.
- Como esses arquivos precisam aparecer publicamente (site, favicon, PWA), o link salvo será um link de mídia assinado de longa duração servido pelo nosso domínio de funções, tratado como público (mesma regra que hoje vale para `preview`).
- Ao trocar banner/ícone, o arquivo anterior é apagado do Drive, para o consumo de armazenamento ficar correto.
- Banners/ícones já salvos no bucket continuam funcionando; só novos uploads vão para o Drive.

### 3. Customs reproduzidos direto na plataforma

- As entregas continuam em `customs` e são tocadas por streaming (vídeo/áudio nativo, com suporte a avanço/retrocesso), sem obrigar download. Onde hoje só existe botão de baixar, entra também o player embutido.

## Detalhes técnicos

- `supabase/functions/drive-upload/index.ts`: aceitar `kind: 'config'`; mapear pastas para `config` / `vip` / `customs` (preview → `customs`).
- `supabase/functions/drive-sign/index.ts`: tratar `kind` `config` como público, com validade longa para assets de marca.
- `src/lib/external-storage.ts`: novo `uploadConfigAsset()` e ajuste dos helpers existentes.
- `src/pages/admin/AdminPersonalizacao.tsx`: trocar `supabase.storage.from('banners')` pelos uploads via Drive, mantendo a checagem de cota (`get_store_storage_quota`) e o purge do arquivo anterior.
- Quota: como tudo passa a ser contado em `drive_files`, o cálculo de uso do plano fica consistente (hoje soma Drive + bucket).
- `src/pages/MeusPedidos.tsx` / `AdminPedidos.tsx`: player inline para entregas de vídeo/áudio.
