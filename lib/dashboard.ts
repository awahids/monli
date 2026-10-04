import type { Transaction } from '@/types';
import { TIMEZONE } from '@/lib/date';

export type MonthTotals = { income: number; expense: number };

/** Income and expense per month, by actual date (the timeline rule). */
export function monthTotals(transactions: Transaction[], month: string): MonthTotals {
  return transactions.reduce<MonthTotals>(
    (acc, t) => {
      if (!t.actualDate?.startsWith(month)) return acc;
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
export function monthDelta(current: number, previous: number, upIsGood: boolean): Delta {
  if (previous === 0) {
    return current === 0
      ? { label: 'Sama seperti bulan lalu', tone: 'neutral', direction: 'flat' }
      : { label: 'Belum ada data bulan lalu', tone: 'neutral', direction: 'flat' };
  }
  const change = current - previous;
  if (change === 0) return { label: 'Sama seperti bulan lalu', tone: 'neutral', direction: 'flat' };
  const pct = Math.round((Math.abs(change) / Math.abs(previous)) * 100);
  const shown = pct > 999 ? '>999' : String(pct);
  const up = change > 0;
  return {
    label: `${up ? 'Naik' : 'Turun'} ${shown}% dari bulan lalu`,
    tone: up === upIsGood ? 'good' : 'bad',
    direction: up ? 'up' : 'down',
  };
}

/** "Selamat pagi/siang/sore/malam" by the hour in Jakarta. */
export function greeting(now: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: 'numeric', hourCycle: 'h23' }).format(now)
  );
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}
