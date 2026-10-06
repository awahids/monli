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

function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** `startDay` of `month`, clamped to the month's last day (31 → 30 Apr, 28/29 Feb). */
function periodBoundary(month: string, startDay: number): number {
  return Math.min(startDay, daysInMonth(month));
}

/**
 * The budget month a date (YYYY-MM-DD) belongs to when budget periods start
 * on `startDay`. With startDay 1 that is the calendar month; with 25 (payday)
 * 25 Sep–24 Oct is the October budget, so 26 Sep belongs to October.
 */
export function budgetMonthFor(date: string, startDay = 1): string {
  const month = date.slice(0, 7);
  if (startDay <= 1) return month;
  const day = Number(date.slice(8, 10));
  return day >= periodBoundary(month, startDay) ? shiftMonth(month, 1) : month;
}

/** The current budget month in Asia/Jakarta. */
export function currentBudgetMonth(startDay = 1, now: Date = new Date()): string {
  return budgetMonthFor(formatDate(now), startDay);
}

/** First and last day (inclusive, YYYY-MM-DD) of a budget month's period. */
export function budgetPeriod(month: string, startDay = 1): { start: string; end: string } {
  if (startDay <= 1) {
    return { start: `${month}-01`, end: `${month}-${String(daysInMonth(month)).padStart(2, '0')}` };
  }
  const prev = shiftMonth(month, -1);
  const start = `${prev}-${String(periodBoundary(prev, startDay)).padStart(2, '0')}`;
  // startDay >= 2 here, so the period always ends on day 1 or later.
  const end = `${month}-${String(periodBoundary(month, startDay) - 1).padStart(2, '0')}`;
  return { start, end };
}

/** Whole days from `from` to `to` (YYYY-MM-DD), inclusive of both. */
export function daysBetweenInclusive(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.floor(ms / 86_400_000) + 1;
}
