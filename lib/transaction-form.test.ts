import { test } from 'node:test';
import assert from 'node:assert';
import { formSchema, toFormValues } from '@/components/transactions/transaction-form';
import type { Transaction } from '@/types';

const row = { id: 't', userId: 'u', budgetMonth: '2026-10', actualDate: '2026-10-06', date: '2026-10-06', amount: 25000, note: null, tags: null };

test('a saved expense (null transfer accounts) passes validation when edited', () => {
  const t = { ...row, type: 'expense', accountId: 'a', categoryId: 'c', fromAccountId: null, toAccountId: null } as unknown as Transaction;
  assert.equal(formSchema.safeParse(toFormValues(t)).success, true);
});

test('a saved transfer (null account and category) passes validation when edited', () => {
  const t = { ...row, type: 'transfer', accountId: null, categoryId: null, fromAccountId: 'a', toAccountId: 'b' } as unknown as Transaction;
  assert.equal(formSchema.safeParse(toFormValues(t)).success, true);
});
