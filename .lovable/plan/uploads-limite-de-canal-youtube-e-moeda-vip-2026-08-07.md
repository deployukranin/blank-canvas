# Uploads, limite de canal YouTube e moeda VIP

## 1. Limite de 3 trocas de canal do YouTube em 14 dias (/youtube)

- Nova tabela `youtube_channel_changes` (por loja): `store_id`, `user_id`, `channel_id`, `created_at`, com RLS para gestores da loja.
- Ao salvar o canal em `AdminYoutube.tsx`, contar as trocas da loja nos últimos 14 dias:
  - 3 ou mais: bloquear o salvamento, desabilitar o botão e mostrar quando o limite libera.
  - Menos de 3: gravar a troca e mostrar quantas restam ("2 de 3 trocas usadas").
- Salvar o mesmo canal novamente (sem mudança real) não conta.
- Validação também no backend (`save-app-config` / trigger), para o limite não ser burlável pelo cliente.

## 2. /vipcontent: apenas upload, sem colar URL

- Remover o campo de URL de mídia do formulário de conteúdo VIP; deixar somente o seletor de arquivo (vídeo/áudio/imagem conforme o tipo).
- Manter compatibilidade com itens antigos que já têm URL salva (continuam tocando).

## 3. Erro de upload em VIP

A causa ainda não está confirmada (a função `drive-upload` não registrou erro nos logs). Primeiro passo: reproduzir o upload e capturar a resposta real da função, e então corrigir. Suspeitas a checar, em ordem:
- Cota de armazenamento do trial (100MB) retornando 413.
- Conector do Google Drive (chaves/pasta raiz) falhando na criação de pasta ou no upload.
- Limite de tamanho de corpo da requisição para arquivos maiores.

Também será melhorada a mensagem de erro exibida (hoje aparece genérica), mostrando o motivo real: cota excedida, arquivo grande demais ou falha no armazenamento.

## 4. /vip: moeda em EN/ES

- Converter os preços por uma taxa fixa BRL → USD ao exibir em inglês e espanhol (planos salvos em BRL).
- Taxa fixa definida em um único ponto do código (constante), fácil de ajustar depois.
- Aplicar a mesma regra em toda a página VIP: destaque, cards de planos e resumo de pagamento.
- Planos já salvos em USD continuam sendo mostrados como USD sem conversão.

## 5. /customs: preview por upload de arquivo

- Substituir os campos "URL (YouTube Embed)" e "URL da Imagem" por upload de arquivo, usando o mesmo fluxo de armazenamento do VIP.
- Vídeo: aceita arquivos de vídeo; Imagem: aceita imagens.
- A página pública de customs passa a reproduzir o arquivo enviado (vídeo nativo em vez de iframe do YouTube).
- Valores antigos em URL continuam funcionando na exibição.

## Detalhes técnicos

- Arquivos principais: `src/pages/admin/AdminYoutube.tsx`, `src/pages/admin/AdminVipConteudo.tsx`, `src/pages/admin/AdminCustoms.tsx`, `src/pages/Customs.tsx`, `src/pages/VIP.tsx`, `src/lib/external-storage.ts`, `supabase/functions/drive-upload/index.ts`.
- Uploads reutilizam `uploadToDrive` (`kind: 'vip'`), respeitando a cota por plano (`get_store_storage_quota`).
- Conversão de moeda em helper compartilhado usado por `VIP.tsx` (e admin, quando exibir preview).
- Traduções novas (limite de trocas, labels de upload) em PT/EN/ES.
