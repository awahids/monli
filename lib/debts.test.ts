import { test } from 'node:test';
import assert from 'node:assert';
import { compareDebts, debtStatus, debtTotals } from './debts';

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

test('compareDebts: overdue, then nearest due, then no due date, then settled', () => {
  const debts = [
    { id: 'settled', amount: 100, paid: 100, due_date: '2026-09-01' },
    { id: 'no-due', amount: 100, paid: 0, due_date: null },
    { id: 'january', amount: 100, paid: 0, due_date: '2027-01-10' },
    { id: 'overdue', amount: 100, paid: 20, due_date: '2026-09-30' },
    { id: 'next-week', amount: 100, paid: 0, due_date: '2026-10-20' },
  ];
  assert.deepEqual(
    [...debts].sort(compareDebts).map((d) => d.id),
    ['overdue', 'next-week', 'january', 'no-due', 'settled']
  );
});
