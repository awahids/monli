import { percentChange } from './dashboard';
import { indonesian, type Translate } from './locale';

/**
 * The weekly summary (/reports/weekly and Sunday's 19:00 notification): this
 * week's spending (Monday to Sunday, by the day it was spent) against the
 * same days of the week before, and the categories that went up. Pure.
 */

export type WeeklyTx = {
  type: string;
  amount: number;
  actualDate: string;
  categoryId: string | null;
  category?: { name: string; color?: string | null } | null;
};

export interface WeeklyCategory {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  /** The same category on the same days of last week. */
  previous: number;
}

export interface WeeklySummary {
  /** Monday of the week, and its last day so far (Sunday once it is over). */
  start: string;
  end: string;
  /** The same days of the week before. */
  previousStart: string;
  previousEnd: string;
  expense: number;
  previousExpense: number;
  /** Change in spending in percent; null when last week had none. */
  change: number | null;
  /** Spending per day, Monday first, with last week's same day. */
  days: { date: string; amount: number; previous: number }[];
  /** The biggest spending categories this week, largest first. */
  topCategories: WeeklyCategory[];
  /** Categories spent more on than last week, biggest rise first. */
  rising: WeeklyCategory[];
  transactionCount: number;
}

export const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/** Monday of the week (Monday to Sunday) holding `date`, YYYY-MM-DD. */
export function weekStart(date: string): string {
  const weekday = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(date, -weekday);
}

/**
 * The week starting `start` (a Monday) as of `today`: a week under way is
 * compared with the same days of last week, so Wednesday is not measured
 * against a whole week.
 */
export function buildWeeklySummary(start: string, today: string, txs: WeeklyTx[]): WeeklySummary {
  const sunday = addDays(start, 6);
  const end = today < sunday ? today : sunday;
  const span = Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000));
  const previousStart = addDays(start, -7);
  const previousEnd = addDays(previousStart, span);

  const inThis = (d: string) => d >= start && d <= end;
  const inPrevious = (d: string) => d >= previousStart && d <= previousEnd;
  const categories = new Map<string, WeeklyCategory>();
  const days = Array.from({ length: span + 1 }, (_, i) => ({ date: addDays(start, i), amount: 0, previous: 0 }));
  let expense = 0;
  let previousExpense = 0;
  let transactionCount = 0;

  for (const t of txs) {
    if (t.type === 'transfer') continue;
    const now = inThis(t.actualDate);
    if (now) transactionCount++;
    if (t.type !== 'expense' || (!now && !inPrevious(t.actualDate))) continue;
    const day = Math.round((Date.parse(t.actualDate) - Date.parse(now ? start : previousStart)) / 86_400_000);
    if (now) {
      expense += t.amount;
      days[day].amount += t.amount;
    } else {
      previousExpense += t.amount;
      days[day].previous += t.amount;
    }
    if (!t.categoryId) continue;
    let c = categories.get(t.categoryId);
    if (!c) {
      c = { categoryId: t.categoryId, name: t.category?.name ?? '', color: t.category?.color || '#94a3b8', amount: 0, previous: 0 };
      categories.set(t.categoryId, c);
    }
    if (now) c.amount += t.amount;
    else c.previous += t.amount;
  }

  const all = Array.from(categories.values());
  return {
    start,
    end,
    previousStart,
    previousEnd,
    expense,
    previousExpense,
    change: percentChange(expense, previousExpense),
    days,
    topCategories: all.filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 5),
    rising: all
      .filter((c) => c.amount > c.previous)
      .sort((a, b) => b.amount - b.previous - (a.amount - a.previous))
      .slice(0, 3),
    transactionCount,
  };
}

/** The notification's title; the server tells the language of a planned one by it. */
export const weeklyTitle = (t: Translate = indonesian) => t('Ringkasan minggu ini', 'Your week in review');

/** What Sunday's notification says about the week. */
export function weeklySummaryText(
  s: WeeklySummary,
  formatMoney: (n: number) => string,
  t: Translate = indonesian
): { title: string; body: string } {
  const title = weeklyTitle(t);
  if (!s.expense && !s.previousExpense) {
    return { title, body: t('Belum ada pengeluaran tercatat minggu ini.', 'No spending recorded this week yet.') };
  }
  const spent = formatMoney(s.expense);
  const pct = s.change === null ? 0 : Math.round(Math.abs(s.change));
  let body =
    s.change === null || pct === 0
      ? t(`Pengeluaran minggu ini ${spent}.`, `You spent ${spent} this week.`)
      : s.change < 0
        ? t(`Pengeluaran minggu ini ${spent}, ${pct}% lebih hemat dari minggu lalu.`, `You spent ${spent} this week, ${pct}% less than last week.`)
        : t(`Pengeluaran minggu ini ${spent}, naik ${pct}% dari minggu lalu.`, `You spent ${spent} this week, ${pct}% more than last week.`);
  const top = s.rising[0];
  if (top) {
    const more = formatMoney(top.amount - top.previous);
    body += t(` Paling naik: ${top.name} (+${more}).`, ` Up the most: ${top.name} (+${more}).`);
  }
  return { title, body };
}
