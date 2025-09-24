import { format, parseISO } from 'date-fns';

import type { Transaction } from '@/types';

const MONTH_FORMAT = 'yyyy-MM';

export function getTransactionMonth(transaction: Transaction): string {
  const { actualDate, budgetMonth } = transaction;

  if (actualDate) {
    const parsedDate = parseISO(actualDate);
    if (!Number.isNaN(parsedDate.getTime())) {
      return format(parsedDate, MONTH_FORMAT);
    }
  }

  return budgetMonth;
}

export function isTransactionInMonth(
  transaction: Transaction,
  month: string
): boolean {
  if (!month) return false;
  return getTransactionMonth(transaction) === month;
}
