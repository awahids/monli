import type { Account, Category, Transaction } from '@/types';
import type { TransactionFormValues } from '@/components/transactions/transaction-form';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { keysToCamel } from '@/lib/case';
import { formatDate } from '@/lib/date';

/**
 * Builds the API payload from form values. Fields that do not apply to the
 * selected type are sent as null so stale values (e.g. a category picked
 * before switching to "transfer") never reach the database.
 */
export function toTransactionPayload(values: TransactionFormValues) {
  const isTransfer = values.type === 'transfer';
  const actualDate = formatDate(values.actualDate);
  return {
    budgetMonth: values.budgetMonth,
    actualDate,
    date: actualDate,
    type: values.type,
    accountId: isTransfer ? null : values.accountId ?? null,
    fromAccountId: isTransfer ? values.fromAccountId ?? null : null,
    toAccountId: isTransfer ? values.toAccountId ?? null : null,
    categoryId: isTransfer ? null : values.categoryId ?? null,
    amount: values.amount,
    note: values.note || '',
    tags: values.tags || [],
  };
}

export type TransactionPayload = ReturnType<typeof toTransactionPayload>;

/**
 * Creates (no id) or updates a transaction. Throws with the API message on
 * failure. On success every page showing totals reloads (see `dataVersion`).
 */
export async function saveTransaction(
  payload: TransactionPayload,
  id?: string,
): Promise<Transaction> {
  const res = await fetch(id ? `/api/transactions/${id}` : '/api/transactions', {
    method: id ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to save transaction');
  useAppStore.getState().bumpData();
  return keysToCamel<Transaction>(data);
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete transaction');
  }
  useAppStore.getState().bumpData();
}

/** Optimistic local copy used while offline. */
export function toOfflineTransaction(
  payload: TransactionPayload,
  userId: string,
): Transaction {
  return {
    id: `offline-${Date.now()}`,
    userId,
    budgetMonth: payload.budgetMonth,
    actualDate: payload.actualDate,
    date: payload.date,
    type: payload.type,
    accountId: payload.accountId ?? undefined,
    fromAccountId: payload.fromAccountId ?? undefined,
    toAccountId: payload.toAccountId ?? undefined,
    categoryId: payload.categoryId ?? undefined,
    amount: payload.amount,
    note: payload.note,
    tags: payload.tags,
    createdBy: useAppStore.getState().user?.id ?? null,
  };
}

/** Reloads active accounts (with trigger-maintained balances) into the store. */
export async function refreshActiveAccounts(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('created_at', { ascending: false });
  if (!error && data) {
    useAppStore.getState().setAccounts(keysToCamel<Account[]>(data));
  }
}

/**
 * Loads accounts and categories for the transaction form when the current
 * page has not (e.g. the app was opened on Budget or Reports).
 */
export async function ensureFormOptions(ownerId: string): Promise<void> {
  const { accounts, categories, setCategories } = useAppStore.getState();
  await Promise.all([
    accounts.length ? null : refreshActiveAccounts(ownerId),
    categories.length
      ? null
      : supabase
          .from('categories')
          .select('*')
          .eq('user_id', ownerId)
          .then(({ data }) => {
            if (data) setCategories(keysToCamel<Category[]>(data));
          }),
  ]);
}
