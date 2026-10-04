import { test } from 'node:test';
import assert from 'node:assert';
import { formatMoney, formatMoneyCompact, parseMoney } from './currency';
import { useAppStore } from './store';

const nbsp = (s: string) => s.replace(/ | /g, ' ');

test('formatMoney follows the user default currency', () => {
  useAppStore.getState().setUser(null);
  assert.equal(nbsp(formatMoney(1234567)), 'Rp 1.234.567');
  useAppStore.getState().setUser({
    id: 'u', email: 'a@b.c', name: 'A', defaultCurrency: 'USD',
    onboardingCompleted: true, plan: 'FREE',
  });
  assert.equal(formatMoney(1234567), '$1,234,567');
  assert.equal(nbsp(formatMoney(5000, 'IDR')), 'Rp 5.000');
  useAppStore.getState().setUser(null);
});

test('formatMoneyCompact shortens large amounts', () => {
  assert.match(nbsp(formatMoneyCompact(360000, 'IDR')), /^Rp 360 rb$/);
});

test('parseMoney ignores symbols and separators', () => {
  assert.equal(parseMoney('Rp 1.234.567'), 1234567);
  assert.equal(parseMoney('$1,234,567'), 1234567);
  assert.equal(parseMoney(''), 0);
  assert.equal(parseMoney('abc'), 0);
});
