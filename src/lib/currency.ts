/**
 * Currency display helpers.
 *
 * Plans are stored in the currency the creator picked (usually BRL).
 * When the interface language is not Portuguese we show USD, converting
 * BRL amounts with a single fixed rate defined here.
 */

export type DisplayCurrency = 'BRL' | 'USD';

/** Fixed conversion rate: 1 USD = BRL_PER_USD. Adjust here when needed. */
export const BRL_PER_USD = 5.4;

export const displayCurrencyForLang = (lang?: string): DisplayCurrency =>
  lang?.startsWith('pt') ? 'BRL' : 'USD';

/** Converts an amount between BRL and USD using the fixed rate. */
export const convertAmount = (
  value: number,
  from: DisplayCurrency,
  to: DisplayCurrency,
): number => {
  if (from === to) return value;
  const converted = from === 'BRL' ? value / BRL_PER_USD : value * BRL_PER_USD;
  return Math.round(converted * 100) / 100;
};

/** Formats a stored amount in the currency matching the active language. */
export const formatPriceForLang = (
  value: number,
  storedCurrency: DisplayCurrency | undefined,
  lang?: string,
): string => {
  const from: DisplayCurrency = storedCurrency || 'BRL';
  const to = displayCurrencyForLang(lang);
  const amount = convertAmount(value, from, to);
  return new Intl.NumberFormat(to === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: to,
  }).format(amount);
};
