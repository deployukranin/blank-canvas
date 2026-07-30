# Trial passa de 7 para 3 dias

## O que muda

- Novas lojas criadas no cadastro passam a ter trial de **3 dias** em vez de 7.
- Quando o super admin volta uma loja para "trial", a nova validade também é de 3 dias.
- O valor padrão do campo "Dias de Trial" nas configurações da plataforma passa a ser 3.
- Todos os textos de marketing e da interface que dizem "7 dias grátis" passam a dizer "3 dias" (PT, EN, ES).

## O que NÃO muda

- O prazo de tolerância antes da exclusão automática da loja após o trial expirar continua em 7 dias (aviso no painel e rotina de limpeza). Posso ajustar isso também se você quiser.
- Lojas já existentes mantêm a data de expiração atual.

## Detalhes técnicos

1. Migração no banco: alterar o default de `public.stores.plan_expires_at` de `now() + interval '7 days'` para `now() + interval '3 days'`.
2. `src/pages/super-admin/SuperAdminTenants.tsx`: ao trocar plano para `trial`, usar `3 * 24 * 60 * 60 * 1000`.
3. `src/pages/super-admin/SuperAdminConfiguracoes.tsx`: `trialDays` default `3`.
4. Textos:
   - `src/i18n/locales/pt-BR.json`, `en.json`, `es.json`: chave `auth.trialBadge` ("3 dias grátis ...").
   - `src/pages/Landing.tsx`: `pricingSub`, FAQ "Existe período de teste?" e o CTA "Testar 7 dias grátis" nos três idiomas.
