

## Simplificar configuração PIX: Seletor de Estado

Substituir o campo de texto livre "Cidade" por um dropdown com os 27 estados brasileiros (UF + capital como cidade padrão do merchant).

### Mudanças

1. **`src/pages/admin/AdminPixConfig.tsx`** — Trocar o `<Input>` de cidade por um `<Select>` com os 27 estados do Brasil (sigla + nome). Ao selecionar o estado, o valor salvo em `merchantCity` será a capital correspondente (ex: SP → SAO PAULO, RJ → RIO DE JANEIRO).

2. **`src/hooks/use-pix-config.ts`** — Adicionar campo `merchantState` à interface `PixConfig` para armazenar a UF selecionada. O `merchantCity` continuará sendo usado no BRCode com a capital do estado.

3. **Constante de estados** — Lista inline no componente com os 27 estados e suas capitais:
   ```
   { uf: 'SP', name: 'São Paulo', capital: 'SAO PAULO' }
   { uf: 'RJ', name: 'Rio de Janeiro', capital: 'RIO DE JANEIRO' }
   // ... todos os 27
   ```

Nenhuma mudança no banco de dados — o config continua salvo como JSON no `app_configurations`.

