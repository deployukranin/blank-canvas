
# Plano: Pop-up de Instalacao PWA para Android

## Objetivo

Criar um pop-up amigavel que aparece automaticamente quando o usuario abre o app no Android, convidando-o a instalar o PWA na tela inicial.

## Como Funciona o PWA Install Prompt

O navegador Chrome no Android dispara um evento `beforeinstallprompt` quando o app atende aos criterios de instalacao PWA. Precisamos:

1. Capturar esse evento
2. Armazena-lo para uso posterior
3. Mostrar nosso proprio pop-up customizado
4. Chamar o prompt nativo quando o usuario clicar em "Instalar"

```text
Fluxo do Usuario:
+------------------+     +------------------+     +------------------+
|  Abre o App no   | --> |  Pop-up Aparece  | --> | Clica "Instalar" |
|  Chrome Android  |     |  (customizado)   |     |                  |
+------------------+     +------------------+     +------------------+
                                 |                        |
                                 v                        v
                         +------------------+     +------------------+
                         | Clica "Agora nao"| --> |  Prompt Nativo   |
                         | (salva dismiss)  |     |  do Chrome       |
                         +------------------+     +------------------+
```

---

## Arquivos a Criar/Editar

| Acao  | Arquivo                                      |
|-------|----------------------------------------------|
| Criar | `src/hooks/use-pwa-install.ts`               |
| Criar | `src/components/pwa/PWAInstallPrompt.tsx`    |
| Editar| `src/App.tsx`                                |

---

## Implementacao Detalhada

### 1. Hook: use-pwa-install.ts

Hook customizado para gerenciar o estado de instalacao PWA:

```typescript
// Funcionalidades:
// - Captura o evento beforeinstallprompt
// - Detecta se esta em Android
// - Verifica se ja esta instalado (standalone mode)
// - Controla se o prompt ja foi dispensado
// - Expoe funcao para disparar instalacao

interface UsePWAInstall {
  canInstall: boolean;        // Pode mostrar o prompt?
  isInstalled: boolean;       // Ja esta instalado?
  isAndroid: boolean;         // Esta em Android?
  promptInstall: () => void;  // Dispara instalacao
  dismissPrompt: () => void;  // Usuario recusou
}
```

**Logica de Exibicao:**
- So mostra se `beforeinstallprompt` foi capturado
- So mostra em Android (user agent check)
- Nao mostra se ja instalado (standalone mode)
- Nao mostra se usuario ja recusou recentemente (localStorage com expiracao de 7 dias)

### 2. Componente: PWAInstallPrompt.tsx

Pop-up visual com design glassmorphism seguindo o tema do app:

```text
+--------------------------------------------------+
|  [X]                                             |
|                                                  |
|      [Icone do App - icon-192.png]               |
|                                                  |
|      Instale o ASMR Luna!                        |
|                                                  |
|      Adicione nosso app na sua tela inicial      |
|      para acesso rapido e experiencia offline.   |
|                                                  |
|      +--------------------+  +----------------+  |
|      |     Instalar       |  |   Agora nao    |  |
|      +--------------------+  +----------------+  |
|                                                  |
+--------------------------------------------------+
```

**Caracteristicas:**
- Animacao de entrada (slide-up com framer-motion)
- Backdrop blur seguindo o padrao glass do app
- Botao primario gradiente para "Instalar"
- Botao secundario ghost para "Agora nao"
- Fecha automaticamente apos instalacao bem-sucedida

### 3. Integracao no App.tsx

Adicionar o componente PWAInstallPrompt no nivel raiz:

```tsx
// Dentro do App component, apos os Toasters:
<PWAInstallPrompt />
```

---

## Deteccao de Plataforma

```typescript
const isAndroid = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('android');
};

const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
};
```

---

## Persistencia do Dismiss

Para nao irritar o usuario:

```typescript
const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7; // Mostra novamente apos 7 dias

const wasDismissed = () => {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const dismissedDate = new Date(dismissed);
  const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_DAYS;
};
```

---

## Consideracoes de UX

1. **Delay inicial**: Mostrar o pop-up apos 2-3 segundos para nao interromper imediatamente
2. **Nao bloqueia**: O pop-up aparece na parte inferior, permitindo uso do app
3. **Feedback visual**: Animacao suave ao aparecer/desaparecer
4. **iOS**: Nao mostra o pop-up automatico (iOS nao suporta beforeinstallprompt), mas podemos mostrar instrucoes manuais

---

## Resumo

Este plano adiciona um pop-up de instalacao PWA amigavel que:
- Aparece automaticamente no Android/Chrome
- Respeita a escolha do usuario (dismiss por 7 dias)
- Segue o design system existente (glassmorphism)
- Usa o prompt nativo do Chrome para instalacao real
