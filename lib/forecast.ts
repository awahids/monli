import type { Transaction } from '@/types';
import { daysBetweenInclusive } from '@/lib/date';

const DAY_MS = 86_400_000;
const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** Fewer days than this and a daily rate says little; no forecast is shown. */
export const MIN_DAYS_FOR_FORECAST = 3;

export interface SpendForecast {
  /** Spent so far this period. */
  spent: number;
  /** Expected spending by the last day of the period. */
  projected: number;
  /** Day-to-day spending per day so far (recurring bills left out). */
  dailyRate: number;
  daysLeft: number;
  /** Recurring expenses still due before the period ends. */
  upcomingRecurring: number;
}

/**
 * Expected spending at the end of the period: what is spent, plus the
 * day-to-day rate so far for the days left, plus recurring bills still due.
 * Recurring transactions already recorded are kept out of the rate, so a rent
 * paid on day one doesn't count again every day. Null early in the period.
 */
export function forecastSpending(
  transactions: Transaction[],
  month: string,
  period: { start: string; end: string },
  today: string,
  upcomingRecurringExpenses: { amount: number; nextDate: string }[]
): SpendForecast | null {
  if (today < period.start || today > period.end) return null;
  const daysPassed = daysBetweenInclusive(period.start, today);
  if (daysPassed < MIN_DAYS_FOR_FORECAST) return null;
  const daysLeft = daysBetweenInclusive(today, period.end) - 1;

  let spent = 0;
  let recurringSpent = 0;
  for (const t of transactions) {
    if (t.type !== 'expense' || t.budgetMonth !== month) continue;
    spent += t.amount;
    if (t.recurringId) recurringSpent += t.amount;
  }
  const dailyRate = (spent - recurringSpent) / daysPassed;
  const upcomingRecurring = upcomingRecurringExpenses
    .filter((r) => r.nextDate > today && r.nextDate <= period.end)
    .reduce((s, r) => s + r.amount, 0);
  return {
    spent,
    projected: Math.round(spent + dailyRate * daysLeft + upcomingRecurring),
    dailyRate,
    daysLeft,
    upcomingRecurring,
  };
}

export interface RunOut {
  categoryId: string;
  /** The day the budget is expected to run out. */
  date: string;
}

/**
 * Budgeted categories expected to run out before the period ends, at the pace
 * spent so far; soonest first. Already-overspent ones are left to the budget
 * card, which shows them.
 */
export function budgetRunOuts(
  usage: { categoryId: string; planned: number; actual: number }[],
  period: { start: string; end: string },
  today: string
): RunOut[] {
  if (today < period.start || today > period.end) return [];
  const daysPassed = daysBetweenInclusive(period.start, today);
  if (daysPassed < MIN_DAYS_FOR_FORECAST) return [];
  return usage
    .filter((u) => u.actual > 0 && u.actual < u.planned)
    .map((u) => {
      const perDay = u.actual / daysPassed;
      const date = addDays(today, Math.ceil((u.planned - u.actual) / perDay));
      return { categoryId: u.categoryId, date };
    })
    .filter((r) => r.date <= period.end)
    .sort((a, b) => a.date.localeCompare(b.date));
}
