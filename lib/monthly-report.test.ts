import { test } from 'node:test';
import assert from 'node:assert';
import { buildMonthlyReport, type ReportTx } from './monthly-report';

const tx = (month: string, type: ReportTx['type'], amount: number, categoryId?: string, note = '') =>
  ({ type, amount, budgetMonth: month, categoryId, note, actualDate: `${month}-10`, category: categoryId ? { name: categoryId, color: '#111111' } : null }) as ReportTx;

test('buildMonthlyReport sums the period and compares with the one before', () => {
  const now = [
    tx('2024-05', 'income', 10_000_000),
    tx('2024-05', 'expense', 2_000_000, 'rent', 'Kos'),
    tx('2024-05', 'expense', 900_000, 'food'),
    tx('2024-05', 'expense', 300_000, 'food'),
    tx('2024-05', 'transfer', 500_000),
  ];
  const before = [tx('2024-04', 'income', 9_000_000), tx('2024-04', 'expense', 1_000_000, 'food')];
  const r = buildMonthlyReport('2024-05', '2024-04', now, before, [
    { categoryId: 'food', amount: 1_000_000, name: 'food' },
    { categoryId: 'rent', amount: 2_000_000, name: 'rent' },
  ]);

  assert.equal(r.income, 10_000_000);
  assert.equal(r.expense, 3_200_000);
  assert.equal(r.saved, 6_800_000);
  assert.equal(r.savingsRate, 68);
  assert.deepEqual(r.previous, { income: 9_000_000, expense: 1_000_000 });
  assert.deepEqual(
    r.topCategories.map((c) => [c.categoryId, c.amount, c.previous]),
    [['rent', 2_000_000, 0], ['food', 1_200_000, 1_000_000]]
  );
  assert.deepEqual(r.overBudget, [{ categoryId: 'food', name: 'food', planned: 1_000_000, actual: 1_200_000 }]);
  assert.deepEqual(r.biggest, { note: 'Kos', amount: 2_000_000, date: '2024-05-10', category: 'rent' });
  assert.equal(r.transactionCount, 4);
});

test('buildMonthlyReport without income or a previous period', () => {
  const r = buildMonthlyReport('2024-05', '2024-04', [tx('2024-05', 'expense', 50_000, 'food')], [], []);
  assert.equal(r.savingsRate, null);
  assert.equal(r.previous, null);
  assert.equal(r.saved, -50_000);
});
