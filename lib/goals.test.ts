import { test } from 'node:test';
import assert from 'node:assert';
import { goalProgress } from './goals';

test('goalProgress without a date only reports progress', () => {
  const p = goalProgress({ targetAmount: 1000, savedAmount: 250 }, '2024-05-10');
  assert.strictEqual(p.pct, 25);
  assert.strictEqual(p.remaining, 750);
  assert.strictEqual(p.perMonth, null);
  assert.strictEqual(p.done, false);
});

test('goalProgress spreads the remainder over the months left, this month included', () => {
  const p = goalProgress({ targetAmount: 1200, savedAmount: 0, targetDate: '2024-12-31' }, '2024-01-15');
  assert.strictEqual(p.monthsLeft, 11);
  assert.strictEqual(p.perMonth, 100);
});

test('goalProgress due this month needs the whole remainder', () => {
  const p = goalProgress({ targetAmount: 500, savedAmount: 200, targetDate: '2024-05-31' }, '2024-05-10');
  assert.strictEqual(p.perMonth, 300);
});

test('goalProgress flags overdue and done goals', () => {
  assert.strictEqual(goalProgress({ targetAmount: 500, savedAmount: 0, targetDate: '2024-04-30' }, '2024-05-10').overdue, true);
  const done = goalProgress({ targetAmount: 500, savedAmount: 700, targetDate: '2024-04-30' }, '2024-05-10');
  assert.strictEqual(done.done, true);
  assert.strictEqual(done.overdue, false);
  assert.strictEqual(done.pct, 100);
});
