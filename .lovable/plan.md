Vou ajustar o fluxo de login/redirecionamento do `/auth` para contas que não pertencem a uma loja.

Plano:
1. Em `src/pages/Auth.tsx`, criar/ajustar a checagem de papéis do usuário para identificar `super_admin`, `ceo` e `partner` usando `user_roles`.
2. No redirecionamento automático ao abrir `/auth`, antes de buscar loja:
   - `super_admin` ou `ceo` vai para `/admin-master`.
   - `partner` vai para `/partner`.
   - demais usuários seguem o fluxo atual de buscar loja e ir para `/:slug/admin`.
3. Aplicar a mesma regra no login manual (`handleLogin`), para não disparar novamente o toast “Nenhuma loja encontrada”.
4. Manter o toast de “loja não encontrada” apenas para usuários comuns/admins de loja que realmente não tenham loja vinculada.