import type { z } from 'zod';
import type { recurringSchema } from '@/lib/validation';

export const RECURRING_SELECT = `*,
  account:accounts!recurring_transactions_account_id_fkey(name, type),
  from_account:accounts!recurring_transactions_from_account_id_fkey(name, type),
  to_account:accounts!recurring_transactions_to_account_id_fkey(name, type),
  category:categories(name, color, icon)`;

/** Maps validated input to columns, nulling fields that don't apply to the type. */
export function toRecurringRow(body: z.infer<typeof recurringSchema>) {
  const isTransfer = body.type === 'transfer';
  return {
    type: body.type,
    account_id: isTransfer ? null : body.accountId,
    from_account_id: isTransfer ? body.fromAccountId : null,
    to_account_id: isTransfer ? body.toAccountId : null,
    category_id: isTransfer ? null : body.categoryId ?? null,
    amount: body.amount,
    note: body.note ?? '',
    frequency: body.frequency,
    day_of_month: body.frequency === 'monthly' ? body.dayOfMonth : null,
    start_date: body.startDate,
    end_date: body.endDate ?? null,
  };
}
