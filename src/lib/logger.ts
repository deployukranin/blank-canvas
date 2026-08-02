/**
 * Dev-only logger.
 *
 * Em produção estas funções são no-ops, evitando vazamento de dados
 * de configuração, pagamento e integrações no console do navegador.
 * Erros continuam sendo reportados (console.error) em qualquer ambiente.
 */
const isDev = import.meta.env.DEV;

export const devLog = (...args: unknown[]): void => {
  if (isDev) console.log(...args);
};

export const devWarn = (...args: unknown[]): void => {
  if (isDev) console.warn(...args);
};

export const logError = (...args: unknown[]): void => {
  console.error(...args);
};
