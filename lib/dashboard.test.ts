import { test } from 'node:test';
import assert from 'node:assert';
import { greeting, monthDelta, monthTotals } from './dashboard';
import type { Transaction } from '@/types';

const tx = (actualDate: string, type: Transaction['type'], amount: number) =>
  ({ id: actualDate + amount, actualDate, type, amount }) as Transaction;

test('monthTotals sums income and expense by actual date', () => {
  const txs = [
    tx('2024-05-02', 'income', 100),
    tx('2024-05-03', 'expense', 30),
    tx('2024-05-04', 'transfer', 999),
    tx('2024-04-30', 'expense', 50),
  ];
  assert.deepEqual(monthTotals(txs, '2024-05'), { income: 100, expense: 30 });
});

test('monthDelta colors by meaning, not by sign', () => {
  assert.deepEqual(monthDelta(120, 100, false), { label: 'Naik 20% dari bulan lalu', tone: 'bad', direction: 'up' });
  assert.equal(monthDelta(120, 100, true).tone, 'good');
  assert.equal(monthDelta(80, 100, false).tone, 'good');
  assert.equal(monthDelta(500, 0, true).label, 'Belum ada data bulan lalu');
  assert.equal(monthDelta(100000, 10, true).label, 'Naik >999% dari bulan lalu');
});

test('greeting follows the Jakarta clock', () => {
  assert.equal(greeting(new Date('2024-05-01T00:30:00Z')), 'Selamat pagi'); // 07:30 WIB
  assert.equal(greeting(new Date('2024-05-01T05:00:00Z')), 'Selamat siang'); // 12:00 WIB
  assert.equal(greeting(new Date('2024-05-01T09:00:00Z')), 'Selamat sore'); // 16:00 WIB
  assert.equal(greeting(new Date('2024-05-01T14:00:00Z')), 'Selamat malam'); // 21:00 WIB
});
