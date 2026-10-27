import type { Transaction } from '@/types';
import { monthTotals } from '@/lib/dashboard';

export type ReportTx = Pick<Transaction, 'type' | 'amount' | 'budgetMonth' | 'categoryId' | 'note' | 'actualDate'> & {
  category?: { name: string; color?: string | null } | null;
};

export interface CategoryLine {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  /** The same category last period; 0 when it had nothing. */
  previous: number;
}

export interface MonthlyReport {
  month: string;
  income: number;
  expense: number;
  /** Income minus spending; negative when more went out than came in. */
  saved: number;
  /** Share of income kept, in percent; null without income. */
  savingsRate: number | null;
  previous: { income: number; expense: number } | null;
  /** The biggest spending categories, largest first. */
  topCategories: CategoryLine[];
  /** Budgeted categories that went over, by how much over. */
  overBudget: { categoryId: string; name: string; planned: number; actual: number }[];
  biggest: { note: string; amount: number; date: string; category: string } | null;
  transactionCount: number;
}

/** Spending per category of a budget month, with name and colour. */
function byCategory(txs: ReportTx[], month: string) {
  const map = new Map<string, { name: string; color: string; amount: number }>();
  for (const t of txs) {
    if (t.type !== 'expense' || t.budgetMonth !== month || !t.categoryId) continue;
    const row = map.get(t.categoryId);
    if (row) row.amount += t.amount;
    else map.set(t.categoryId, { name: t.category?.name ?? '', color: t.category?.color || '#94a3b8', amount: t.amount });
  }
  return map;
}

/**
 * The summary of a finished budget period: what came in and went out, how it
 * compares with the period before, where the money went and which budgets
 * ran over. `previousTxs` empty means there is nothing to compare with.
 */
export function buildMonthlyReport(
  month: string,
  previousMonth: string,
  txs: ReportTx[],
  previousTxs: ReportTx[],
  budgetItems: { categoryId: string; amount: number; name: string }[]
): MonthlyReport {
  const { income, expense } = monthTotals(txs as Transaction[], month);
  const prev = previousTxs.length ? monthTotals(previousTxs as Transaction[], previousMonth) : null;

  const now = byCategory(txs, month);
  const before = byCategory(previousTxs, previousMonth);
  const topCategories = Array.from(now.entries())
    .map(([categoryId, c]) => ({ categoryId, ...c, previous: before.get(categoryId)?.amount ?? 0 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const overBudget = budgetItems
    .map((i) => ({ categoryId: i.categoryId, name: i.name, planned: i.amount, actual: now.get(i.categoryId)?.amount ?? 0 }))
    .filter((i) => i.planned > 0 && i.actual > i.planned)
    .sort((a, b) => b.actual - b.planned - (a.actual - a.planned));

  let biggest: MonthlyReport['biggest'] = null;
  for (const t of txs) {
    if (t.type !== 'expense' || t.budgetMonth !== month) continue;
    if (!biggest || t.amount > biggest.amount) {
      biggest = { note: t.note, amount: t.amount, date: t.actualDate, category: t.category?.name ?? '' };
    }
  }

  return {
    month,
    income,
    expense,
    saved: income - expense,
    savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : null,
    previous: prev,
    topCategories,
    overBudget,
    biggest,
    transactionCount: txs.filter((t) => t.budgetMonth === month && t.type !== 'transfer').length,
  };
}
