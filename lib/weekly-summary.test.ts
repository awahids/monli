import { test } from 'node:test';
import assert from 'node:assert';
import { buildWeeklySummary, weekStart, weeklySummaryText, type WeeklyTx } from './weekly-summary';

const food = { name: 'Makan', color: '#f00' };
const snacks = { name: 'Jajan', color: '#0f0' };
const tx = (actualDate: string, amount: number, categoryId: string | null, type = 'expense'): WeeklyTx => ({
  type,
  amount,
  actualDate,
  categoryId,
  category: categoryId === 'food' ? food : categoryId === 'snacks' ? snacks : null,
});
const money = (n: number) => `Rp${n}`;

test('weeks run Monday to Sunday', () => {
  assert.equal(weekStart('2026-10-26'), '2026-10-26'); // Monday
  assert.equal(weekStart('2026-10-29'), '2026-10-26'); // Thursday
  assert.equal(weekStart('2026-11-01'), '2026-10-26'); // Sunday
  assert.equal(weekStart('2026-11-02'), '2026-11-02');
});

test('a week under way is compared with the same days of last week', () => {
  const txs = [
    tx('2026-10-26', 50_000, 'food'), // this Monday
    tx('2026-10-28', 30_000, 'snacks'), // this Wednesday
    tx('2026-10-19', 100_000, 'food'), // last Monday
    tx('2026-10-21', 10_000, 'snacks'), // last Wednesday
    tx('2026-10-24', 999_000, 'food'), // last Saturday: not yet comparable
    tx('2026-10-27', 5_000_000, null, 'income'),
    tx('2026-10-27', 70_000, null, 'transfer'),
  ];
  const s = buildWeeklySummary('2026-10-26', '2026-10-28', txs);
  assert.deepEqual([s.start, s.end, s.previousStart, s.previousEnd], ['2026-10-26', '2026-10-28', '2026-10-19', '2026-10-21']);
  assert.equal(s.expense, 80_000);
  assert.equal(s.previousExpense, 110_000);
  assert.equal(Math.round(s.change!), -27);
  assert.deepEqual(
    s.days.map((d) => [d.date, d.amount, d.previous]),
    [
      ['2026-10-26', 50_000, 100_000],
      ['2026-10-27', 0, 0],
      ['2026-10-28', 30_000, 10_000],
    ]
  );
  assert.deepEqual(s.topCategories.map((c) => c.name), ['Makan', 'Jajan']);
  assert.deepEqual(s.rising.map((c) => [c.name, c.amount, c.previous]), [['Jajan', 30_000, 10_000]]);
  assert.equal(s.transactionCount, 3);
});

test('a finished week covers Monday to Sunday', () => {
  const s = buildWeeklySummary('2026-10-19', '2026-10-29', [tx('2026-10-25', 20_000, 'food')]);
  assert.deepEqual([s.end, s.previousEnd, s.days.length], ['2026-10-25', '2026-10-18', 7]);
  assert.equal(s.change, null);
});

test('the notification says how the week went and what went up the most', () => {
  const base = buildWeeklySummary('2026-10-26', '2026-11-01', [
    tx('2026-10-26', 80_000, 'snacks'),
    tx('2026-10-19', 100_000, 'food'),
  ]);
  assert.deepEqual(weeklySummaryText(base, money), {
    title: 'Ringkasan minggu ini',
    body: 'Pengeluaran minggu ini Rp80000, 20% lebih hemat dari minggu lalu. Paling naik: Jajan (+Rp80000).',
  });
  const up = buildWeeklySummary('2026-10-26', '2026-11-01', [tx('2026-10-26', 150_000, 'food'), tx('2026-10-19', 100_000, 'food')]);
  assert.equal(weeklySummaryText(up, money).body, 'Pengeluaran minggu ini Rp150000, naik 50% dari minggu lalu. Paling naik: Makan (+Rp50000).');
  const empty = buildWeeklySummary('2026-10-26', '2026-11-01', []);
  assert.equal(weeklySummaryText(empty, money).body, 'Belum ada pengeluaran tercatat minggu ini.');
  assert.equal(weeklySummaryText(empty, money, (_, en) => en).title, 'Your week in review');
});
