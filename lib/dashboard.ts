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
