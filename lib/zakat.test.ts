import { test } from 'node:test';
import assert from 'node:assert';
import {
  calcNisab,
  calcZakat,
  GOLD_NISAB_GRAMS,
  OUNCE_TO_GRAM,
  ZAKAT_RATE,
} from './zakat';

test('calcNisab and calcZakat below threshold', () => {
  const nisab = calcNisab(1000, GOLD_NISAB_GRAMS);
  const { obligatory, amount } = calcZakat(nisab - 1, nisab);
  assert.equal(obligatory, false);
  assert.equal(amount, 0);
});

test('calcNisab and calcZakat above threshold', () => {
  const nisab = calcNisab(1000, GOLD_NISAB_GRAMS);
  const { obligatory, amount } = calcZakat(nisab + 1000, nisab);
  assert.equal(obligatory, true);
  assert.equal(amount, (nisab + 1000) * 0.025);
});

test('integration with MetalpriceAPI sample', () => {
  const payload = {
    success: true,
    base: 'IDR',
    timestamp: 1755907199,
    rates: { IDRXAU: 54552212.3116184, XAU: 1.83e-8 },
  };
  const idrPerGram = payload.rates.IDRXAU / OUNCE_TO_GRAM;
  const nisab = calcNisab(idrPerGram, GOLD_NISAB_GRAMS);
  const { obligatory, amount } = calcZakat(nisab, nisab);
  assert.equal(Math.round(idrPerGram), Math.round(payload.rates.IDRXAU / OUNCE_TO_GRAM));
  assert.equal(obligatory, true);
  assert.equal(amount, nisab * 0.025);
});

test('calcNisab handles invalid values', () => {
  assert.equal(calcNisab(Infinity, GOLD_NISAB_GRAMS), 0);
  assert.equal(calcNisab(NaN, GOLD_NISAB_GRAMS), 0);
  assert.equal(calcNisab(1000, Infinity), 0);
  assert.equal(calcNisab(1000, NaN), 0);
});

test('calcZakat handles invalid values', () => {
  let res = calcZakat(Infinity, GOLD_NISAB_GRAMS);
  assert.deepEqual(res, { obligatory: false, amount: 0 });

  res = calcZakat(1000, NaN);
  assert.deepEqual(res, { obligatory: false, amount: 0 });

  res = calcZakat(1000, 0, NaN);
  assert.deepEqual(res, { obligatory: true, amount: 1000 * ZAKAT_RATE });
});
