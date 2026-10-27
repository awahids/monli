import { test } from 'node:test';
import assert from 'node:assert';
import { budgetRunOuts, forecastSpending } from './forecast';
import type { Transaction } from '@/types';

const period = { start: '2024-05-01', end: '2024-05-31' };
const tx = (actualDate: string, amount: number, extra: Partial<Transaction> = {}) =>
  ({ id: actualDate + amount, actualDate, budgetMonth: '2024-05', type: 'expense', amount, ...extra }) as Transaction;

test('forecastSpending projects the day-to-day rate and adds recurring bills still due', () => {
  const txs = [
    tx('2024-05-01', 1_000_000, { recurringId: 'rent' }), // rent: not part of the daily rate
    tx('2024-05-02', 50_000),
    tx('2024-05-05', 50_000),
    tx('2024-05-10', 100_000),
    tx('2024-05-10', 999, { type: 'income' }),
  ];
  const upcoming = [
    { amount: 300_000, nextDate: '2024-05-20' }, // still due this period
    { amount: 400_000, nextDate: '2024-06-02' }, // next period
  ];
  const f = forecastSpending(txs, '2024-05', period, '2024-05-10', upcoming)!;
  // 200k over 10 days = 20k a day, 21 days left.
  assert.equal(f.spent, 1_200_000);
  assert.equal(f.dailyRate, 20_000);
  assert.equal(f.daysLeft, 21);
  assert.equal(f.upcomingRecurring, 300_000);
  assert.equal(f.projected, 1_200_000 + 20_000 * 21 + 300_000);
});

test('forecastSpending waits for a few days of data and stays inside the period', () => {
  assert.equal(forecastSpending([tx('2024-05-01', 10)], '2024-05', period, '2024-05-02', []), null);
  assert.equal(forecastSpending([], '2024-05', period, '2024-06-03', []), null);
});

test('budgetRunOuts lists budgets that run out before the period ends, soonest first', () => {
  const usage = [
    { categoryId: 'food', planned: 600_000, actual: 300_000 }, // 30k/day: 10 more days -> 20 May
    { categoryId: 'fun', planned: 1_000_000, actual: 100_000 }, // 10k/day: 90 days -> after the period
    { categoryId: 'fuel', planned: 200_000, actual: 150_000 }, // 15k/day: 4 more days -> 14 May
    { categoryId: 'over', planned: 100_000, actual: 120_000 }, // already over
    { categoryId: 'none', planned: 100_000, actual: 0 },
  ];
  assert.deepEqual(budgetRunOuts(usage, period, '2024-05-10'), [
    { categoryId: 'fuel', date: '2024-05-14' },
    { categoryId: 'food', date: '2024-05-20' },
  ]);
});
