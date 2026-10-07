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

const SHORT_MONTHS = {
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const shortDate = (d: string, locale: 'id' | 'en') =>
  `${Number(d.slice(8, 10))} ${SHORT_MONTHS[locale][Number(d.slice(5, 7)) - 1]}`;

/**
 * "26 Sep – 25 Okt" for a budget month when periods start after the 1st;
 * null for calendar months, where the month name already says it all.
 */
export function periodRange(month: string, startDay = 1, locale: 'id' | 'en' = 'id'): string | null {
  if (startDay <= 1) return null;
  const { start, end } = budgetPeriod(month, startDay);
  return `${shortDate(start, locale)} – ${shortDate(end, locale)}`;
}

/**
 * Transactions to move when the period start day changes: those whose budget
 * month is still the automatic one for the old setting. Ones the user moved
 * by hand (e.g. an early salary put into next month) stay where they are.
 */
export function rebucket(
  rows: { id: string; actual_date: string; budget_month: string }[],
  oldStartDay: number,
  newStartDay: number
): { id: string; budget_month: string }[] {
  if (oldStartDay === newStartDay) return [];
  return rows.flatMap((r) => {
    if (r.budget_month !== budgetMonthFor(r.actual_date, oldStartDay)) return [];
    const next = budgetMonthFor(r.actual_date, newStartDay);
    return next === r.budget_month ? [] : [{ id: r.id, budget_month: next }];
  });
}
