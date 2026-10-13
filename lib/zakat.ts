export const OUNCE_TO_GRAM = 31.1034768;
export const ZAKAT_RATE = 0.025;
export const GOLD_NISAB_GRAMS = 85;
export const SILVER_NISAB_GRAMS = 595;

export function calcNisab(idrPerGram: number, grams: number) {
  const price = Number.isFinite(idrPerGram) ? idrPerGram : 0;
  const weight = Number.isFinite(grams) ? grams : 0;
  return price * weight;
}

export function calcZakat(zakatable: number, nisab: number, rate = ZAKAT_RATE) {
  const base = Number.isFinite(zakatable) ? zakatable : 0;
  const threshold = Number.isFinite(nisab) ? nisab : Infinity;
  const appliedRate = Number.isFinite(rate) ? rate : ZAKAT_RATE;
  const obligatory = base >= threshold;
  const amount = obligatory ? base * appliedRate : 0;
  return { obligatory, amount };
}

/**
 * BAZNAS income nisab for 2026: 85 g of 14-karat gold a year, Rp 7.640.144 a
 * month (SK Ketua BAZNAS No. 15/2026, in force from 21 Feb 2026).
 * shortcut: a fixed yearly figure, update it when BAZNAS sets the next one.
 */
export const INCOME_NISAB_MONTHLY = 7_640_144;
export const INCOME_NISAB_YEAR = 2026;

/** Zakat penghasilan as BAZNAS counts it: 2.5% of gross monthly income from the monthly nisab. */
export function calcIncomeZakat(monthlyIncome: number, nisab = INCOME_NISAB_MONTHLY) {
  return calcZakat(monthlyIncome, nisab);
}

export const toIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
    .format(Number.isFinite(n) ? n : 0);
