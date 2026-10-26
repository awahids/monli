import { test } from 'node:test';
import assert from 'node:assert';
import {
  budgetUsage,
  categoryExpenses,
  dailyExpenses,
  dailyPool,
  greeting,
  monthTotals,
  percentChange,
  upcomingRecurring,
} from './dashboard';
import type { Transaction } from '@/types';

const tx = (actualDate: string, type: Transaction['type'], amount: number, budgetMonth = actualDate.slice(0, 7)) =>
  ({ id: actualDate + amount, actualDate, budgetMonth, type, amount }) as Transaction;

test('monthTotals sums income and expense by budget month (the period)', () => {
  const txs = [
    tx('2024-05-02', 'income', 100),
    tx('2024-05-03', 'expense', 30),
    tx('2024-05-04', 'transfer', 999),
    tx('2024-05-27', 'expense', 50, '2024-06'), // after payday: next period
    tx('2024-04-28', 'expense', 7, '2024-05'), // previous calendar month, this period
  ];
  assert.deepEqual(monthTotals(txs, '2024-05'), { income: 100, expense: 37 });
});

test('greeting follows the Jakarta clock', () => {
  assert.equal(greeting(new Date('2024-05-01T00:30:00Z')), 'Selamat pagi'); // 07:30 WIB
  assert.equal(greeting(new Date('2024-05-01T05:00:00Z')), 'Selamat siang'); // 12:00 WIB
  assert.equal(greeting(new Date('2024-05-01T09:00:00Z')), 'Selamat sore'); // 16:00 WIB
  assert.equal(greeting(new Date('2024-05-01T14:00:00Z')), 'Selamat malam'); // 21:00 WIB
});

test('dailyExpenses fills every day of the period, counting only expenses', () => {
  const txs = [
    tx('2024-05-02', 'expense', 30),
    tx('2024-05-02', 'expense', 20),
    tx('2024-05-02', 'income', 500),
    tx('2024-05-04', 'expense', 10),
    tx('2024-05-09', 'expense', 99), // outside the range
  ];
  assert.deepEqual(dailyExpenses(txs, '2024-05-01', '2024-05-04'), [
    { date: '2024-05-01', amount: 0 },
    { date: '2024-05-02', amount: 50 },
    { date: '2024-05-03', amount: 0 },
    { date: '2024-05-04', amount: 10 },
  ]);
});

test('categoryExpenses groups a budget month by category, largest first', () => {
  const withCat = (t: Transaction, categoryId: string, name: string) =>
    ({ ...t, categoryId, category: { name, color: '#123456' } }) as Transaction;
  const txs = [
    withCat(tx('2024-05-02', 'expense', 30), 'food', 'Makan'),
    withCat(tx('2024-05-03', 'expense', 80), 'rent', 'Kos'),
    withCat(tx('2024-05-04', 'expense', 20), 'food', 'Makan'),
    withCat(tx('2024-05-05', 'income', 900), 'food', 'Makan'),
    withCat(tx('2024-06-01', 'expense', 70), 'food', 'Makan'),
  ];
  assert.deepEqual(categoryExpenses(txs, '2024-05'), [
    { categoryId: 'rent', name: 'Kos', color: '#123456', amount: 80 },
    { categoryId: 'food', name: 'Makan', color: '#123456', amount: 50 },
  ]);
});

test('budgetUsage puts the fullest budget first and skips empty ones', () => {
  const txs = [
    { ...tx('2024-05-02', 'expense', 90), categoryId: 'food' },
    { ...tx('2024-05-02', 'expense', 10), categoryId: 'fun' },
  ] as Transaction[];
  const items = [
    { categoryId: 'fun', amount: 100 },
    { categoryId: 'food', amount: 100 },
    { categoryId: 'none', amount: 0 },
  ];
  assert.deepEqual(budgetUsage(items, txs, '2024-05'), [
    { categoryId: 'food', planned: 100, actual: 90, pct: 90 },
    { categoryId: 'fun', planned: 100, actual: 10, pct: 10 },
  ]);
});

test('percentChange compares with the previous period', () => {
  assert.equal(percentChange(150, 100), 50);
  assert.equal(percentChange(50, 100), -50);
  assert.equal(percentChange(50, 0), null);
});

test('upcomingRecurring keeps active rules due within the window', () => {
  const rules = [
    { id: 'a', active: true, nextDate: '2024-05-10' },
    { id: 'b', active: true, nextDate: '2024-05-03' },
    { id: 'c', active: false, nextDate: '2024-05-04' },
    { id: 'd', active: true, nextDate: '2024-05-20' },
    { id: 'e', active: true, nextDate: '2024-05-05', endDate: '2024-05-01' },
  ];
  assert.deepEqual(
    upcomingRecurring(rules, '2024-05-01', 14).map((r) => r.id),
    ['b', 'a']
  );
});

test('dailyPool leaves savings out of the daily allowance', () => {
  const budget = {
    totalAmount: 1000,
    carry: 100,
    items: [
      { categoryId: 'food', amount: 600 },
      { categoryId: 'savings', amount: 400 },
    ],
  };
  const actual = [
    { categoryId: 'food', actual: 200 },
    { categoryId: 'savings', actual: 400 },
    { categoryId: 'other', actual: 50 }, // spent outside the budgeted categories
  ];
  assert.deepEqual(dailyPool(budget, 650, actual, (id) => id !== 'savings'), { planned: 700, actual: 250 });
  assert.deepEqual(dailyPool(budget, 650, actual, () => true), { planned: 1100, actual: 650 });
});
