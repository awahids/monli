import type { Transaction } from '@/types';
import { TIMEZONE } from '@/lib/date';
import { indonesian, type Translate } from './locale';

export type MonthTotals = { income: number; expense: number };

/**
 * Income and expense of a budget month (the period, which may start on
 * payday), so the KPIs match the budget card and the Budget page.
 */
export function monthTotals(transactions: Transaction[], month: string): MonthTotals {
  return transactions.reduce<MonthTotals>(
    (acc, t) => {
      if (t.budgetMonth !== month) return acc;
      if (t.type === 'income') acc.income += t.amount;
      else if (t.type === 'expense') acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
}

/** "Selamat pagi/siang/sore/malam" by the hour in Jakarta. */
export function greeting(now: Date = new Date(), t: Translate = indonesian): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: 'numeric', hourCycle: 'h23' }).format(now)
  );
  if (hour >= 4 && hour < 11) return t('Selamat pagi', 'Good morning');
  if (hour >= 11 && hour < 15) return t('Selamat siang', 'Good afternoon');
  if (hour >= 15 && hour < 18) return t('Selamat sore', 'Good afternoon');
  return t('Selamat malam', 'Good evening');
}

const DAY_MS = 86_400_000;
const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** Spending of every day from `start` to `end` (inclusive), zero-filled, by actual date. */
export function dailyExpenses(
  transactions: Transaction[],
  start: string,
  end: string
): { date: string; amount: number }[] {
  const byDay = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense' || t.actualDate < start || t.actualDate > end) continue;
    byDay.set(t.actualDate, (byDay.get(t.actualDate) ?? 0) + t.amount);
  }
  const days: { date: string; amount: number }[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push({ date: d, amount: byDay.get(d) ?? 0 });
  return days;
}

export type CategorySpend = { categoryId: string; name: string; color: string; amount: number };

/** Spending per category in a budget month, largest first. */
export function categoryExpenses(transactions: Transaction[], month: string): CategorySpend[] {
  const map = new Map<string, CategorySpend>();
  for (const t of transactions) {
    if (t.type !== 'expense' || t.budgetMonth !== month || !t.categoryId) continue;
    const row = map.get(t.categoryId);
    if (row) row.amount += t.amount;
    else
      map.set(t.categoryId, {
        categoryId: t.categoryId,
        name: t.category?.name ?? '',
        color: t.category?.color || '#94a3b8',
        amount: t.amount,
      });
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

export type BudgetUsage = { categoryId: string; planned: number; actual: number; pct: number };

/** How much of each budgeted category is used in a budget month, the fullest first. */
export function budgetUsage(
  items: { categoryId: string; amount: number }[],
  transactions: Transaction[],
  month: string
): BudgetUsage[] {
  const spent = new Map(categoryExpenses(transactions, month).map((c) => [c.categoryId, c.amount]));
  return items
    .filter((i) => i.amount > 0)
    .map((i) => {
      const actual = spent.get(i.categoryId) ?? 0;
      return { categoryId: i.categoryId, planned: i.amount, actual, pct: (actual / i.amount) * 100 };
    })
    .sort((a, b) => b.pct - a.pct);
}

/** Change from `previous` to `current` in percent; null when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Active recurring rules due from `today` up to `days` days ahead, soonest first. */
export function upcomingRecurring<R extends { active: boolean; nextDate: string; endDate?: string | null }>(
  rules: R[],
  today: string,
  days: number
): R[] {
  const until = addDays(today, days);
  return rules
    .filter((r) => r.active && r.nextDate >= today && r.nextDate <= until && (!r.endDate || r.nextDate <= r.endDate))
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
}

/**
 * The part of a budget meant for day-to-day spending: the whole budget (with
 * what was carried in) minus the categories left out of the daily allowance,
 * such as savings, both planned and already spent.
 */
export function dailyPool(
  budget: { totalAmount: number; carry?: number; items: { categoryId: string; amount: number }[] },
  totalActual: number,
  actualByCategory: { categoryId: string; actual: number }[],
  isDaily: (categoryId: string) => boolean
): { planned: number; actual: number } {
  const outPlanned = budget.items.filter((i) => !isDaily(i.categoryId)).reduce((s, i) => s + i.amount, 0);
  const outActual = actualByCategory.filter((c) => !isDaily(c.categoryId)).reduce((s, c) => s + c.actual, 0);
  return {
    planned: budget.totalAmount + (budget.carry ?? 0) - outPlanned,
    actual: totalActual - outActual,
  };
}
