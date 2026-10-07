export type RecurringFrequency = 'weekly' | 'monthly';

export interface RecurringSchedule {
  frequency: RecurringFrequency;
  /** Day of month for monthly rules (1–31, clamped to the month's last day). */
  dayOfMonth?: number | null;
  nextDate: string;
  endDate?: string | null;
}

/** Hard cap so a rule left untouched for years can't flood the ledger in one run. */
export const MAX_OCCURRENCES_PER_RUN = 12;

function parse(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return { y, m, d };
}

function fmt(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function daysInMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** The date of `dayOfMonth` in the given month, clamped (31 → 30 Apr, 28/29 Feb). */
export function clampDay(y: number, m: number, dayOfMonth: number): string {
  return fmt(y, m, Math.min(dayOfMonth, daysInMonth(y, m)));
}

/** First occurrence on or after `startDate`. */
export function firstOccurrence(
  startDate: string,
  frequency: RecurringFrequency,
  dayOfMonth?: number | null,
): string {
  if (frequency === 'weekly' || !dayOfMonth) return startDate;
  const { y, m, d } = parse(startDate);
  const thisMonth = clampDay(y, m, dayOfMonth);
  if (Number(thisMonth.slice(8)) >= d) return thisMonth;
  const next = new Date(Date.UTC(y, m, 1));
  return clampDay(next.getUTCFullYear(), next.getUTCMonth() + 1, dayOfMonth);
}

/** The occurrence after `date`. */
export function nextOccurrence(
  date: string,
  frequency: RecurringFrequency,
  dayOfMonth?: number | null,
): string {
  const { y, m, d } = parse(date);
  if (frequency === 'weekly') {
    const next = new Date(Date.UTC(y, m - 1, d + 7));
    return fmt(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
  }
  const next = new Date(Date.UTC(y, m, 1));
  return clampDay(next.getUTCFullYear(), next.getUTCMonth() + 1, dayOfMonth ?? d);
}

/**
 * Occurrences due on or before `today`, plus the rule's next date afterwards.
 * `nextDate` is null when the rule has passed its end date.
 */
export function dueOccurrences(
  rule: RecurringSchedule,
  today: string,
): { dates: string[]; nextDate: string | null } {
  const dates: string[] = [];
  let cursor = rule.nextDate;
  while (cursor <= today && dates.length < MAX_OCCURRENCES_PER_RUN) {
    if (rule.endDate && cursor > rule.endDate) break;
    dates.push(cursor);
    cursor = nextOccurrence(cursor, rule.frequency, rule.dayOfMonth);
  }
  const ended = Boolean(rule.endDate && cursor > rule.endDate);
  return { dates, nextDate: ended ? null : cursor };
}

export function describeSchedule(
  frequency: RecurringFrequency,
  dayOfMonth?: number | null,
  startDate?: string,
  locale: 'id' | 'en' = 'id',
) {
  const en = locale === 'en';
  if (frequency === 'monthly') return en ? `Monthly, on day ${dayOfMonth}` : `Tiap bulan, tanggal ${dayOfMonth}`;
  if (!startDate) return en ? 'Weekly' : 'Tiap minggu';
  const weekday = new Intl.DateTimeFormat(en ? 'en-US' : 'id-ID', { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(`${startDate}T00:00:00Z`),
  );
  return en ? `Weekly, on ${weekday}` : `Tiap minggu, hari ${weekday}`;
}
