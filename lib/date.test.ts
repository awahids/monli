import { test } from 'node:test';
import assert from 'node:assert';
import { budgetMonthFor, budgetPeriod, currentBudgetMonth, currentMonth, daysBetweenInclusive, nextMonthStart, shiftMonth } from './date';

test('currentMonth uses Jakarta time, not UTC', () => {
  // 2024-05-31 18:30 UTC is already 2024-06-01 01:30 in Jakarta.
  assert.equal(currentMonth(new Date('2024-05-31T18:30:00Z')), '2024-06');
  assert.equal(currentMonth(new Date('2024-05-31T16:59:00Z')), '2024-05');
});

test('shiftMonth crosses year boundaries', () => {
  assert.equal(shiftMonth('2024-01', -1), '2023-12');
  assert.equal(shiftMonth('2024-12', 1), '2025-01');
  assert.equal(shiftMonth('2024-05', 0), '2024-05');
});

test('nextMonthStart returns the exclusive upper bound', () => {
  assert.equal(nextMonthStart('2024-02'), '2024-03-01');
  assert.equal(nextMonthStart('2024-12'), '2025-01-01');
});

test('budgetMonthFor is the calendar month when periods start on the 1st', () => {
  assert.equal(budgetMonthFor('2024-05-31', 1), '2024-05');
  assert.equal(budgetMonthFor('2024-05-01'), '2024-05');
});

test('budgetMonthFor moves days from the start day onwards to next month', () => {
  assert.equal(budgetMonthFor('2024-09-24', 25), '2024-09');
  assert.equal(budgetMonthFor('2024-09-25', 25), '2024-10');
  assert.equal(budgetMonthFor('2024-12-28', 25), '2025-01');
});

test('budgetMonthFor clamps a start day past the month end', () => {
  // Start day 31: Feb's period boundary is the 29th (leap year).
  assert.equal(budgetMonthFor('2024-02-28', 31), '2024-02');
  assert.equal(budgetMonthFor('2024-02-29', 31), '2024-03');
  assert.equal(budgetMonthFor('2024-04-30', 31), '2024-05');
});

test('budgetPeriod spans start day of previous month to the day before', () => {
  assert.deepEqual(budgetPeriod('2024-10', 25), { start: '2024-09-25', end: '2024-10-24' });
  assert.deepEqual(budgetPeriod('2024-03', 31), { start: '2024-02-29', end: '2024-03-30' });
  assert.deepEqual(budgetPeriod('2024-02', 1), { start: '2024-02-01', end: '2024-02-29' });
});

test('currentBudgetMonth uses Jakarta time', () => {
  // 2024-09-24 18:00 UTC is 25 Sep 01:00 in Jakarta: payday, next budget.
  assert.equal(currentBudgetMonth(25, new Date('2024-09-24T18:00:00Z')), '2024-10');
});

test('daysBetweenInclusive counts both ends', () => {
  assert.equal(daysBetweenInclusive('2024-10-01', '2024-10-01'), 1);
  assert.equal(daysBetweenInclusive('2024-09-25', '2024-10-24'), 30);
});
