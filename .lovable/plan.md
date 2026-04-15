

# Plano: Configurar CRON_SECRET

O `CRON_SECRET` é um token aleatório que protege a Edge Function `cleanup-expired-stores`. Sem ele, qualquer pessoa poderia chamar a função e deletar lojas.

## O que será feito

1. **Gerar um token seguro** — será criado um valor aleatório forte (UUID ou string de 64 caracteres)
2. **Adicionar como secret** — usar a ferramenta de secrets para solicitar que você configure o valor `CRON_SECRET` no projeto
3. **Atualizar o cron job** — o job agendado no `pg_cron` precisa enviar esse secret no header `Authorization: Bearer <CRON_SECRET>` ao chamar a Edge Function. A query SQL do cron será atualizada para incluir o header correto.

## Detalhes técnicos

- A Edge Function `cleanup-expired-stores` já tem o código de validação do `CRON_SECRET` implementado
- O cron job existente precisa ser recriado com o header `Authorization` contendo o secret
- O secret será armazenado de forma segura no backend e acessível apenas pela Edge Function via `Deno.env.get("CRON_SECRET")`

