import { test } from 'node:test';
import assert from 'node:assert';
import { buildWrapped, type WrappedTx } from './wrapped';

const tx = (type: WrappedTx['type'], amount: number, date: string, category?: string, note = ''): WrappedTx => ({
  type,
  amount,
  actual_date: date,
  note,
  category: category ? { name: category, color: '#000' } : null,
});

test('buildWrapped sums the year', () => {
  const w = buildWrapped(2026, [
    tx('income', 1000000, '2026-01-25'),
    tx('expense', 300000, '2026-01-26', 'Makan'),
    tx('expense', 100000, '2026-02-03', 'Transport', 'Bensin'),
    tx('expense', 100000, '2026-02-03', 'Makan'),
    tx('transfer', 50000, '2026-03-01'),
  ]);
  assert.equal(w.income, 1000000);
  assert.equal(w.expense, 500000);
  assert.equal(w.savingsRate, 50);
  assert.equal(w.count, 5);
  assert.equal(w.activeDays, 4);
  assert.deepEqual(
    w.topCategories.map((c) => [c.name, c.amount, c.share]),
    [
      ['Makan', 400000, 80],
      ['Transport', 100000, 20],
    ]
  );
  assert.deepEqual(w.frugalMonth, { month: '2026-02', amount: 200000 });
  assert.deepEqual(w.peakMonth, { month: '2026-01', amount: 300000 });
  assert.equal(w.biggestExpense?.amount, 300000);
});

test('an empty year has nothing to show', () => {
  const w = buildWrapped(2026, []);
  assert.equal(w.savingsRate, null);
  assert.equal(w.frugalMonth, null);
  assert.equal(w.biggestExpense, null);
  assert.deepEqual(w.topCategories, []);
});
