import { test } from 'node:test';
import assert from 'node:assert';
import { formatMoney, formatMoneyCompact, parseAmountText, parseMoney } from './currency';
import { useAppStore } from './store';

const nbsp = (s: string) => s.replace(/ | /g, ' ');

test('formatMoney follows the user default currency', () => {
  useAppStore.getState().setUser(null);
  assert.equal(nbsp(formatMoney(1234567)), 'Rp 1.234.567');
  useAppStore.getState().setUser({
    id: 'u', email: 'a@b.c', name: 'A', defaultCurrency: 'USD',
    onboardingCompleted: true, plan: 'FREE', proUntil: null, budgetStartDay: 1,
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

test('parseAmountText reads typed amounts and rejects words', () => {
  assert.equal(parseAmountText('25000'), 25000);
  assert.equal(parseAmountText('Rp 25.000'), 25000);
  assert.equal(parseAmountText('25rb'), 25000);
  assert.equal(parseAmountText('1,5 juta'), 1500000);
  assert.equal(parseAmountText('12K'), 12000);
  assert.equal(parseAmountText('kopi'), null);
  assert.equal(parseAmountText('kopi 25rb'), null);
  assert.equal(parseAmountText('0'), null);
});
