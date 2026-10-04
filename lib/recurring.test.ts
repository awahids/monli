import { test } from 'node:test';
import assert from 'node:assert';
import { dueOccurrences, firstOccurrence, nextOccurrence, MAX_OCCURRENCES_PER_RUN } from './recurring';

test('firstOccurrence picks this month or rolls to next', () => {
  assert.strictEqual(firstOccurrence('2024-05-10', 'monthly', 25), '2024-05-25');
  assert.strictEqual(firstOccurrence('2024-05-26', 'monthly', 25), '2024-06-25');
  assert.strictEqual(firstOccurrence('2024-05-25', 'monthly', 25), '2024-05-25');
  assert.strictEqual(firstOccurrence('2024-05-26', 'weekly'), '2024-05-26');
});

test('monthly occurrences clamp to the last day and keep the anchor day', () => {
  assert.strictEqual(nextOccurrence('2024-01-31', 'monthly', 31), '2024-02-29');
  assert.strictEqual(nextOccurrence('2024-02-29', 'monthly', 31), '2024-03-31');
  assert.strictEqual(nextOccurrence('2023-12-15', 'monthly', 15), '2024-01-15');
});

test('weekly occurrences add 7 days across month boundaries', () => {
  assert.strictEqual(nextOccurrence('2024-05-29', 'weekly'), '2024-06-05');
});

test('dueOccurrences returns every missed date up to today', () => {
  const res = dueOccurrences({ frequency: 'monthly', dayOfMonth: 1, nextDate: '2024-03-01' }, '2024-05-10');
  assert.deepStrictEqual(res.dates, ['2024-03-01', '2024-04-01', '2024-05-01']);
  assert.strictEqual(res.nextDate, '2024-06-01');
});

test('dueOccurrences returns nothing before the next date', () => {
  const res = dueOccurrences({ frequency: 'weekly', nextDate: '2024-05-11' }, '2024-05-10');
  assert.deepStrictEqual(res.dates, []);
  assert.strictEqual(res.nextDate, '2024-05-11');
});

test('dueOccurrences stops at the end date', () => {
  const res = dueOccurrences(
    { frequency: 'monthly', dayOfMonth: 5, nextDate: '2024-04-05', endDate: '2024-05-01' },
    '2024-06-10',
  );
  assert.deepStrictEqual(res.dates, ['2024-04-05']);
  assert.strictEqual(res.nextDate, null);
});

test('dueOccurrences caps a long backlog', () => {
  const res = dueOccurrences({ frequency: 'weekly', nextDate: '2020-01-01' }, '2024-01-01');
  assert.strictEqual(res.dates.length, MAX_OCCURRENCES_PER_RUN);
  assert.ok(res.nextDate! < '2024-01-01');
});
