import { indonesian, type Translate } from './locale';

export type BudgetStatus = { label: string; badge: string; bar: string };

/** Aman < 80%, Hampir habis 80–99%, Habis at exactly the budget, Lewat over it. */
export function budgetStatus(spent: number, planned: number, t: Translate = indonesian): BudgetStatus {
  if (spent > planned)
    return { label: t('Lewat', 'Over'), badge: 'bg-red-500/15 text-red-700 dark:text-red-300', bar: 'bg-red-500' };
  if (planned > 0 && spent === planned)
    return { label: t('Habis', 'Used up'), badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-300', bar: 'bg-orange-500' };
  if (planned > 0 && spent >= planned * 0.8)
    return { label: t('Hampir habis', 'Almost used'), badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' };
  return { label: t('Aman', 'On track'), badge: 'bg-green-500/15 text-green-700 dark:text-green-300', bar: 'bg-primary' };
}

/** How much of the budget is spent, as a whole percent (can pass 100). */
export function budgetUsedPct(spent: number, planned: number): number {
  return planned > 0 ? Math.round((spent / planned) * 100) : 0;
}
