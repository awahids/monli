import { useAppStore } from '@/lib/store';
import { budgetMonthFor, currentBudgetMonth, formatDate } from '@/lib/date';

/** The signed-in user's budget start day (1 = calendar month). */
export function getBudgetStartDay(): number {
  return useAppStore.getState().user?.budgetStartDay || 1;
}

/** Default budget month for a transaction on `date`, per the user's setting. */
export function defaultBudgetMonth(date: Date): string {
  return budgetMonthFor(formatDate(date), getBudgetStartDay());
}

/** The budget month "now" falls in, per the user's setting. */
export function thisBudgetMonth(): string {
  return currentBudgetMonth(getBudgetStartDay());
}
