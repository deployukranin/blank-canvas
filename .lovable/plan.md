# Corrigir entrega dos emails de confirmação de cadastro

## Problema
Hoje os emails de confirmação de cadastro saem pelo remetente padrão do Lovable Cloud, que é fortemente limitado e entrega de forma não confiável (spam / não chega). Existe uma chave `RESEND_API_KEY` no projeto, mas ela **não está conectada** ao fluxo de emails de autenticação. Não existe domínio de email configurado nem o hook de email de auth.

## Solução
Usar o sistema de **Lovable Emails**: configurar um domínio remetente próprio e provisionar o hook de email de autenticação, para que os emails de confirmação saiam pelo seu domínio com boa entregabilidade.

## Passos

1. **Configurar o domínio de email remetente**
   - Você abre o assistente de configuração de domínio de email e informa o domínio (ex.: `notify.seudominio.com`).
   - O Lovable provisiona automaticamente a infraestrutura (filas, registros DNS via delegação de NS, etc.). Você só precisa adicionar os registros NS indicados no seu provedor de DNS.

2. **Provisionar os templates + hook de email de autenticação**
   - Cria automaticamente o `auth-email-hook` (o "webhook" do Auth) e os 6 templates (confirmação de cadastro, recuperação de senha, etc.).
   - Aplico a identidade visual do app (cores, logo, idioma PT-BR) nos templates de confirmação e recuperação.
   - Faço o deploy do hook.

3. **Validar**
   - Após a verificação do DNS (pode levar de minutos a algumas horas), os emails passam a sair pelo seu domínio.
   - Testamos o fluxo de cadastro e acompanhamos o status em Cloud → Emails.

## Observações
- A confirmação de email no cadastro continua exigindo verificação (já está ativada). A diferença é que agora o email chega de forma confiável.
- Até o DNS verificar, o sistema continua usando o remetente padrão como fallback.
- **Você precisa ter um domínio próprio** para apontar o remetente. Se ainda não tiver, dá pra continuar usando o remetente padrão, mas a entrega seguirá limitada.

## Decisão necessária
Antes de começar eu preciso saber: você tem um **domínio próprio** que possa usar como remetente (ex.: `mytinglebox.com`)? Se sim, seguimos com o passo 1. Se não, eu explico as alternativas.
