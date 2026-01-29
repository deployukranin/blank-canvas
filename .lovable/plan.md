

## Plano: Configuração de Credenciais Admin e CEO no Painel CEO

### Situação Atual

O sistema atual usa credenciais fixas ("hardcoded") no arquivo `AdminLogin.tsx`:

```typescript
const MOCK_ADMINS = [
  { email: 'admin@whisperscape.com', password: 'admin123', role: 'admin' },
  { email: 'ceo@whisperscape.com', password: 'ceo123', role: 'ceo' },
];
```

Essas credenciais não podem ser alteradas sem modificar o código-fonte.

### O Que Será Implementado

Uma nova seção no Painel CEO para configurar dinamicamente as credenciais de acesso administrativo:

1. **Seção "Contas Administrativas"** em `/ceo/integracoes` ou nova página `/ceo/configuracoes`
2. **Configuração da Conta Admin**: Email e senha
3. **Configuração da Conta CEO**: Email e senha
4. **Persistência via WhiteLabelContext** (localStorage)

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE AUTENTICAÇÃO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Painel CEO configura credenciais                               │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │      WhiteLabelContext (localStorage)                    │   │
│  │                                                          │   │
│  │   config.adminCredentials = {                            │   │
│  │     admin: { email, passwordHash }                       │   │
│  │     ceo: { email, passwordHash }                         │   │
│  │   }                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                        │                                        │
│                        ▼                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              AdminLogin.tsx                              │   │
│  │                                                          │   │
│  │   1. Lê credenciais do WhiteLabel                        │   │
│  │   2. Se não configurado, usa fallback (mock)             │   │
│  │   3. Valida login contra credenciais salvas              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Detalhes da Implementação

#### 1. Atualizar WhiteLabelContext

Adicionar nova seção `adminCredentials` na configuração:

```typescript
interface WhiteLabelConfig {
  // ... campos existentes ...
  
  adminCredentials: {
    admin: {
      email: string;
      password: string; // Nota: em produção, usar hash
    };
    ceo: {
      email: string;
      password: string;
    };
  };
}
```

Valores padrão (fallback para credenciais atuais):
```typescript
adminCredentials: {
  admin: {
    email: 'admin@whisperscape.com',
    password: 'admin123',
  },
  ceo: {
    email: 'ceo@whisperscape.com',
    password: 'ceo123',
  },
}
```

#### 2. Criar Interface no Painel CEO

Nova seção em `CEOIntegracoes.tsx` ou criar página dedicada `CEOConfiguracoes.tsx`:

**Seção "Contas Administrativas"** com:
- Card para Conta Admin
  - Input: Email
  - Input: Senha (com toggle de visibilidade)
  - Botão: Salvar
  
- Card para Conta CEO
  - Input: Email
  - Input: Senha (com toggle de visibilidade)
  - Botão: Salvar

- Aviso de segurança: "As credenciais são armazenadas localmente. Para produção, recomenda-se implementar autenticação via Supabase Auth."

#### 3. Atualizar AdminLogin.tsx

Modificar para:
1. Importar `useWhiteLabel` context
2. Ler credenciais do `config.adminCredentials`
3. Usar fallback se não configurado
4. Atualizar exibição de credenciais de teste dinamicamente

```typescript
const { config } = useWhiteLabel();

const ADMIN_CREDENTIALS = [
  { 
    email: config.adminCredentials?.admin?.email || 'admin@whisperscape.com',
    password: config.adminCredentials?.admin?.password || 'admin123',
    role: 'admin' 
  },
  { 
    email: config.adminCredentials?.ceo?.email || 'ceo@whisperscape.com',
    password: config.adminCredentials?.ceo?.password || 'ceo123',
    role: 'ceo' 
  },
];
```

### Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/contexts/WhiteLabelContext.tsx` | Modificar | Adicionar `adminCredentials` ao tipo e defaults |
| `src/pages/ceo/CEOIntegracoes.tsx` | Modificar | Adicionar seção de configuração de credenciais |
| `src/pages/admin/AdminLogin.tsx` | Modificar | Usar credenciais dinâmicas do WhiteLabel |
| `src/pages/ceo/CEOLayout.tsx` | Modificar | Adicionar item "Configurações" ao menu (opcional) |

### Interface Visual Proposta

Na página de Integrações (`/ceo/integracoes`), após as seções existentes:

```text
┌────────────────────────────────────────────────────────────────┐
│  🔐 Contas Administrativas                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────┐  ┌────────────────────────────┐│
│  │  🛡️ Conta Admin            │  │  👑 Conta CEO              ││
│  │                            │  │                            ││
│  │  Email:                    │  │  Email:                    ││
│  │  [admin@exemplo.com    ]   │  │  [ceo@exemplo.com      ]   ││
│  │                            │  │                            ││
│  │  Senha:                    │  │  Senha:                    ││
│  │  [••••••••        ] 👁️     │  │  [••••••••        ] 👁️     ││
│  │                            │  │                            ││
│  │  [     Salvar      ]       │  │  [     Salvar      ]       ││
│  └────────────────────────────┘  └────────────────────────────┘│
│                                                                │
│  ⚠️ As credenciais são armazenadas no navegador local.         │
│     Para ambientes de produção, considere usar autenticação    │
│     via banco de dados com hash de senhas.                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Considerações de Segurança

**Importante**: Esta solução armazena credenciais no localStorage do navegador, o que é adequado para:
- Ambientes de desenvolvimento
- Demonstrações
- Protótipos

Para produção real, recomenda-se:
1. Migrar para autenticação via Supabase Auth
2. Criar usuários reais no banco de dados
3. Usar hash de senhas (bcrypt)
4. Implementar tabela `user_roles` para controle de acesso

### Fluxo de Uso

1. CEO acessa `/ceo/integracoes`
2. Localiza seção "Contas Administrativas"
3. Configura email e senha para Admin
4. Configura email e senha para CEO
5. Clica "Salvar" em cada card
6. Credenciais são persistidas no WhiteLabel (localStorage)
7. Próximo login usa as novas credenciais

### Validações

- Email: formato válido
- Senha: mínimo 6 caracteres
- Não permitir emails duplicados entre Admin e CEO
- Feedback visual ao salvar (toast de sucesso)

