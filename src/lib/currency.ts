/**
 * Currency display helpers.
 *
 * The currency is ALWAYS the one the creator configured in the admin panel.
 * The interface language only changes number formatting (separators), never
 * the currency itself and never the amount.
 */

export type DisplayCurrency = 'BRL' | 'USD';

/** Kept for backwards compatibility with legacy conversions. */
export const BRL_PER_USD = 5.4;

/** Normalizes any stored currency value into a supported display currency. */
export const normalizeCurrency = (value?: string | null): DisplayCurrency =>
  String(value || 'BRL').toUpperCase() === 'USD' ? 'USD' : 'BRL';

/**
 * @deprecated The currency no longer follows the language. Use the store's
 * configured currency instead. Kept so existing callers keep compiling.
 */
export const displayCurrencyForLang = (_lang?: string): DisplayCurrency => 'BRL';

/** Formats a stored amount in the store's configured currency (no conversion). */
export const formatPriceForLang = (
  value: number,
  storedCurrency: DisplayCurrency | string | undefined,
  lang?: string,
): string => {
  const currency = normalizeCurrency(storedCurrency as string | undefined);
  const locale = lang?.startsWith('pt')
    ? 'pt-BR'
    : lang?.startsWith('es')
      ? 'es-ES'
      : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
};
