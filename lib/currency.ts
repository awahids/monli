import { useAppStore } from '@/lib/store';

export const CURRENCIES = [
  { code: 'IDR', label: 'Rupiah (IDR)', locale: 'id-ID' },
  { code: 'USD', label: 'US Dollar (USD)', locale: 'en-US' },
  { code: 'EUR', label: 'Euro (EUR)', locale: 'de-DE' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

function localeFor(currency: string): string {
  return CURRENCIES.find((c) => c.code === currency)?.locale ?? 'id-ID';
}

/** The signed-in user's "Default currency" setting (IDR when unknown). */
export function getDisplayCurrency(): string {
  return useAppStore.getState().user?.defaultCurrency || 'IDR';
}

/**
 * Formats an amount from the user's own data in their chosen currency.
 * Amounts are stored as plain numbers in that currency (no conversion).
 */
export function formatMoney(amount: number, currency: string = getDisplayCurrency()): string {
  return new Intl.NumberFormat(localeFor(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Short form for chart axes and tight spots, e.g. "Rp 360 rb", "Rp 1,2 jt". */
export function formatMoneyCompact(
  amount: number,
  currency: string = getDisplayCurrency(),
): string {
  return new Intl.NumberFormat(localeFor(currency), {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
}

/** Prices Qala sells in (plans, payments) are always Rupiah. */
export function formatIDR(amount: number): string {
  return formatMoney(amount, 'IDR');
}

/**
 * Parses what the user typed into an amount field. Amounts are whole
 * numbers, so every non-digit (currency symbol, thousand separators) is
 * ignored: "Rp 1.234.567" and "$1,234,567" both become 1234567.
 */
/**
 * An amount typed the way people write it: "25000", "Rp 25.000", "25rb",
 * "1,5 juta", "12k". Null when the text is not an amount.
 */
export function parseAmountText(value: string): number | null {
  const m = value.trim().toLowerCase().match(/^(?:rp\.?\s*)?([\d.,]+)\s*(rb|ribu|k|jt|juta)?$/);
  if (!m) return null;
  if (m[2]) {
    // Shorthand: comma is the decimal mark ("1,5 juta").
    const n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? Math.round(n * (m[2].startsWith('j') ? 1_000_000 : 1_000)) : null;
  }
  return parseMoney(m[1]) || null;
}

export function parseMoney(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}
