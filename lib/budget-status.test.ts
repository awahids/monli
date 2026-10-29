import { test } from 'node:test';
import assert from 'node:assert';
import { budgetStatus, budgetUsedPct } from './budget-status';

test('a budget spent to the last rupiah is used up, not almost used', () => {
  assert.equal(budgetStatus(0, 1_000_000).label, 'Aman');
  assert.equal(budgetStatus(799_999, 1_000_000).label, 'Aman');
  assert.equal(budgetStatus(800_000, 1_000_000).label, 'Hampir habis');
  assert.equal(budgetStatus(999_999, 1_000_000).label, 'Hampir habis');
  assert.equal(budgetStatus(2_500_000, 2_500_000).label, 'Habis');
  assert.equal(budgetStatus(2_500_001, 2_500_000).label, 'Lewat');
});

test('spending without a budget is over it', () => {
  assert.equal(budgetStatus(0, 0).label, 'Aman');
  assert.equal(budgetStatus(10_000, 0).label, 'Lewat');
});

test('the share used is a whole percent', () => {
  assert.equal(budgetUsedPct(313_100, 1_400_000), 22);
  assert.equal(budgetUsedPct(2_500_000, 2_500_000), 100);
  assert.equal(budgetUsedPct(3_000_000, 2_500_000), 120);
  assert.equal(budgetUsedPct(5_000, 0), 0);
});
