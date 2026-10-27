import { test } from 'node:test';
import assert from 'node:assert';
import { widgetSnapshot } from './widget';
import { indonesian } from './locale';

const money = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
const now = new Date('2026-03-10T01:15:00Z'); // 08.15 WIB

test('the widget shows today’s allowance and what is left', () => {
  assert.deepEqual(
    widgetSnapshot({ budget: { daily: 50000, remaining: 300000, daysLeft: 6, over: false }, spentToday: 0, hidden: false, now }, money, indonesian),
    { label: 'Sisa jatah hari ini', value: 'Rp 50.000', detail: 'Sisa Rp 300.000 · 6 hari', updated: 'Diperbarui 08.15' }
  );
});

test('without a budget it shows today’s spending; hidden amounts stay hidden', () => {
  const s = widgetSnapshot({ budget: null, spentToday: 25000, hidden: true, now }, money, indonesian);
  assert.equal(s.label, 'Pengeluaran hari ini');
  assert.equal(s.value, 'Rp •••••');
});

test('over budget shows by how much', () => {
  const s = widgetSnapshot({ budget: { daily: 0, remaining: -40000, daysLeft: 3, over: true }, spentToday: 0, hidden: false, now }, money, indonesian);
  assert.deepEqual([s.label, s.value], ['Budget terlampaui', 'Rp 40.000']);
});
