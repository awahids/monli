const TIMEZONE = 'Asia/Jakarta';

export function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function endOfMonth(date: Date): Date {
  const start = startOfMonth(date);
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

export function formatLocal(date: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, ...options }).format(date);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(date);
}

export { TIMEZONE };

/** Current month (YYYY-MM) in Asia/Jakarta, not UTC. */
export function currentMonth(now: Date = new Date()): string {
  return formatDate(now).slice(0, 7);
}

/** Shifts a YYYY-MM month string by `delta` months. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** First day of the month after `month`, as YYYY-MM-DD (exclusive upper bound). */
export function nextMonthStart(month: string): string {
  return `${shiftMonth(month, 1)}-01`;
}
