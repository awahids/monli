'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { GOLD_NISAB_GRAMS, calcIncomeZakat, calcNisab, toIDR } from '@/lib/zakat';

/** Zakat penghasilan for the public calculator: monthly income against a twelfth of the gold nisab. */
export function IncomeZakat() {
  const [income, setIncome] = useState(0);
  const [goldPrice, setGoldPrice] = useState(0);
  const monthlyNisab = calcNisab(goldPrice, GOLD_NISAB_GRAMS) / 12;
  const { obligatory, amount } = calcIncomeZakat(income, goldPrice);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="zakat-income">Penghasilan kotor per bulan</Label>
        <MoneyInput id="zakat-income" currency="IDR" value={income} onValueChange={setIncome} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zakat-gold">Harga emas per gram</Label>
        <MoneyInput id="zakat-gold" currency="IDR" value={goldPrice} onValueChange={setGoldPrice} />
      </div>
      <dl className="space-y-2 rounded-lg border border-white/10 p-4 text-sm" aria-live="polite">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Nisab per bulan ({GOLD_NISAB_GRAMS} g emas ÷ 12)</dt>
          <dd className="tabular-nums">{toIDR(monthlyNisab)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Status</dt>
          <dd>{goldPrice > 0 && income > 0 ? (obligatory ? 'Wajib zakat' : 'Belum wajib') : '—'}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-white/10 pt-2 font-medium">
          <dt>Zakat penghasilan (2,5%)</dt>
          <dd className="tabular-nums" data-testid="income-zakat">
            {toIDR(amount)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
