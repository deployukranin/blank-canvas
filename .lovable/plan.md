# Corrigir @ e foto de perfil

## Objetivo
Fazer o `@` funcionar de forma consistente em toda a plataforma, exibir a foto correta no canto inferior esquerdo e corrigir a mensagem exibida após o cadastro do nome de usuário.

## 1. Corrigir e proteger o cadastro do @
- Atualizar a função do backend que define o `@` para retornar também o handle salvo; hoje ela retorna apenas `success`, por isso a mensagem recebe um valor vazio.
- Impedir no backend qualquer segunda alteração quando `handle_set_at` ou `handle` já estiver preenchido, garantindo de verdade a regra “escolher apenas uma vez”.
- Normalizar o valor antes de salvar e manter validação de tamanho, caracteres permitidos e unicidade.
- Ajustar o componente do perfil para usar o valor digitado normalizado como fallback seguro e nunca renderizar `undefined` ou um `@` vazio.
- Após salvar, atualizar imediatamente o estado compartilhado do perfil para que o novo `@` apareça sem recarregar a página.

## 2. Unificar a origem da foto de perfil
A foto enviada pelo usuário está salva na personalização da loja, enquanto o rodapé do template Cinematic consulta somente o avatar global do perfil. Aplicar uma ordem única de resolução:

1. avatar personalizado da loja atual;
2. avatar global do perfil;
3. avatar da conta autenticada;
4. avatar padrão.

Usar essa mesma regra no rodapé desktop, no menu mobile, no cabeçalho de `/profile` e na listagem de clientes do painel, respeitando o isolamento por loja.

## 3. Sincronizar o painel de clientes
- Carregar `@` e avatar personalizado junto com os membros da loja atual.
- Mostrar `@handle` como identidade principal quando existir, sem duplicá-lo em duas linhas.
- Atualizar a lista após mudanças de perfil para não permanecer exibindo “user” ou avatar antigo.

## 4. Validar o fluxo completo
- Testar um usuário sem `@`: cadastrar e confirmar a mensagem completa, por exemplo `Seu @ agora é @nome`.
- Confirmar que o campo desaparece após salvar e que uma segunda tentativa é recusada pelo backend.
- Confirmar que o novo `@` aparece no rodapé e em `/admin/users` sem precisar sair da conta.
- Confirmar que a foto personalizada aparece no canto inferior esquerdo nos layouts Cinematic desktop e mobile, com fallback correto para usuários free.
- Verificar PT-BR, EN e ES e ausência de erros no console.

## Detalhes técnicos
- Frontend: `HandleSelector`, `useProfile`, `Perfil`, `DesktopShell`, `CinematicMobileShell` e `AdminUsuarios`.
- Backend: substituir com segurança a função `set_user_handle`, preservando permissões e validações existentes.
- A personalização continuará vinculada por `user_id + store_id`; nenhum avatar de outra loja poderá aparecer.