import { test } from 'node:test';
import assert from 'node:assert';
import { currentMonth, nextMonthStart, shiftMonth } from './date';

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
