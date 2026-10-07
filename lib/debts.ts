export type DebtKind = 'payable' | 'receivable';

export interface DebtEntry {
  id: string;
  kind: 'principal' | 'payment';
  amount: number;
  account_id: string | null;
  date: string;
}

export interface Debt {
  id: string;
  kind: DebtKind;
  person: string;
  amount: number;
  paid: number;
  due_date: string | null;
  note: string | null;
  created_at: string;
  entries?: DebtEntry[];
}

/** Remaining amount, progress and state of a debt on `today` (YYYY-MM-DD). */
export function debtStatus(debt: Pick<Debt, 'amount' | 'paid' | 'due_date'>, today: string) {
  const remaining = Math.max(debt.amount - debt.paid, 0);
  const settled = remaining === 0;
  return {
    remaining,
    settled,
    pct: debt.amount > 0 ? Math.min((debt.paid / debt.amount) * 100, 100) : 0,
    overdue: !settled && debt.due_date !== null && debt.due_date < today,
  };
}

/** What is still owed in each direction, over unsettled debts. */
export function debtTotals(debts: Pick<Debt, 'kind' | 'amount' | 'paid'>[]) {
  return debts.reduce(
    (acc, d) => {
      acc[d.kind] += Math.max(d.amount - d.paid, 0);
      return acc;
    },
    { payable: 0, receivable: 0 }
  );
}
