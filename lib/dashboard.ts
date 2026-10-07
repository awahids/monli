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

export type DeltaTone = 'good' | 'bad' | 'neutral';
export type Delta = { label: string; tone: DeltaTone; direction: 'up' | 'down' | 'flat' };

/**
 * Month-over-month change for a KPI. `upIsGood` decides the color: more
 * income is good, more spending is bad. Avoids nonsense percentages when the
 * previous value is zero or negative.
 */
export function monthDelta(current: number, previous: number, upIsGood: boolean, t: Translate = indonesian): Delta {
  if (previous === 0) {
    return current === 0
      ? { label: t('Sama seperti bulan lalu', 'Same as last month'), tone: 'neutral', direction: 'flat' }
      : { label: t('Belum ada data bulan lalu', 'No data for last month'), tone: 'neutral', direction: 'flat' };
  }
  const change = current - previous;
  if (change === 0) return { label: t('Sama seperti bulan lalu', 'Same as last month'), tone: 'neutral', direction: 'flat' };
  const pct = Math.round((Math.abs(change) / Math.abs(previous)) * 100);
  const shown = pct > 999 ? '>999' : String(pct);
  const up = change > 0;
  return {
    label: t(`${up ? 'Naik' : 'Turun'} ${shown}% dari bulan lalu`, `${up ? 'Up' : 'Down'} ${shown}% from last month`),
    tone: up === upIsGood ? 'good' : 'bad',
    direction: up ? 'up' : 'down',
  };
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
