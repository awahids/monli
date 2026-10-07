import { test } from 'node:test';
import assert from 'node:assert';
import { debtStatus, debtTotals } from './debts';

test('debtStatus: remaining, progress, overdue, settled', () => {
  assert.deepEqual(debtStatus({ amount: 200000, paid: 50000, due_date: '2026-10-01' }, '2026-10-07'), {
    remaining: 150000,
    settled: false,
    pct: 25,
    overdue: true,
  });
  const settled = debtStatus({ amount: 100, paid: 100, due_date: '2026-10-01' }, '2026-10-07');
  assert.equal(settled.settled, true);
  assert.equal(settled.overdue, false);
  assert.equal(debtStatus({ amount: 100, paid: 0, due_date: null }, '2026-10-07').overdue, false);
});

test('debtTotals sums what is still owed each way', () => {
  assert.deepEqual(
    debtTotals([
      { kind: 'payable', amount: 100, paid: 40 },
      { kind: 'receivable', amount: 300, paid: 0 },
      { kind: 'receivable', amount: 50, paid: 50 },
    ]),
    { payable: 60, receivable: 300 }
  );
});
