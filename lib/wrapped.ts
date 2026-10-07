import { type Translate, indonesian } from './locale';

export type WrappedTx = {
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  actual_date: string;
  note: string | null;
  category: { name: string; color: string | null } | null;
};

export type Wrapped = {
  year: number;
  income: number;
  expense: number;
  /** Share of income kept (0–100), null without income. */
  savingsRate: number | null;
  count: number;
  /** Days with at least one transaction recorded. */
  activeDays: number;
  topCategories: { name: string; color: string; amount: number; share: number }[];
  /** Months with spending: the lowest and the highest. */
  frugalMonth: { month: string; amount: number } | null;
  peakMonth: { month: string; amount: number } | null;
  biggestExpense: { amount: number; note: string; date: string; category: string } | null;
};

/** A year in numbers, from that year's transactions (by actual date). */
export function buildWrapped(year: number, txs: WrappedTx[], translate: Translate = indonesian): Wrapped {
  const uncategorized = translate('Tanpa kategori', 'Uncategorized');
  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, { name: string; color: string; amount: number }>();
  const byMonth = new Map<string, number>();
  const days = new Set<string>();
  let biggest: WrappedTx | null = null;

  for (const t of txs) {
    days.add(t.actual_date);
    if (t.type === 'income') income += t.amount;
    if (t.type !== 'expense') continue;
    expense += t.amount;
    const name = t.category?.name ?? uncategorized;
    const cat = byCategory.get(name) ?? { name, color: t.category?.color || '#6B7280', amount: 0 };
    cat.amount += t.amount;
    byCategory.set(name, cat);
    const month = t.actual_date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + t.amount);
    if (!biggest || t.amount > biggest.amount) biggest = t;
  }

  const months = Array.from(byMonth, ([month, amount]) => ({ month, amount })).sort((a, b) => a.amount - b.amount);
  return {
    year,
    income,
    expense,
    savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : null,
    count: txs.length,
    activeDays: days.size,
    topCategories: Array.from(byCategory.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map((c) => ({ ...c, share: Math.round((c.amount / expense) * 100) })),
    frugalMonth: months[0] ?? null,
    peakMonth: months[months.length - 1] ?? null,
    biggestExpense: biggest
      ? {
          amount: biggest.amount,
          note: biggest.note ?? '',
          date: biggest.actual_date,
          category: biggest.category?.name ?? uncategorized,
        }
      : null,
  };
}
