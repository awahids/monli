export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const toIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);

export function formatCurrency(amount: number, currency = 'IDR'): string {
  if (currency === 'IDR') {
    return formatIDR(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function parseIDR(value: string): number {
  // IDR values are commonly formatted with thousand separators (.) and
  // often omit a decimal portion. The previous implementation simply
  // stripped non digits except for dots, causing values like
  // `Rp 1.234.567` to be interpreted as `1.234` instead of `1234567`.
  // Remove thousand separators and convert any decimal comma to a dot
  // before parsing.
  const sanitized = value
    .replace(/\./g, '')
    .replace(/[^0-9,-]/g, '')
    .replace(',', '.');
  return parseFloat(sanitized) || 0;
}