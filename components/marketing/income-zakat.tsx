'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { INCOME_NISAB_MONTHLY, INCOME_NISAB_YEAR, calcIncomeZakat, toIDR } from '@/lib/zakat';

/** Zakat penghasilan: gross monthly income against the BAZNAS monthly nisab. */
export function IncomeZakat() {
  const [income, setIncome] = useState(0);
  const { obligatory, amount } = calcIncomeZakat(income);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="zakat-income">Penghasilan kotor per bulan</Label>
        <MoneyInput id="zakat-income" currency="IDR" value={income} onValueChange={setIncome} />
      </div>
      <dl className="space-y-2 rounded-lg border border-white/10 p-4 text-sm" aria-live="polite">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Nisab per bulan (BAZNAS {INCOME_NISAB_YEAR})</dt>
          <dd className="tabular-nums">{toIDR(INCOME_NISAB_MONTHLY)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Status</dt>
          <dd>{income > 0 ? (obligatory ? 'Wajib zakat' : 'Belum wajib') : '—'}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-white/10 pt-2 font-medium">
          <dt>Zakat penghasilan (2,5%)</dt>
          <dd className="tabular-nums" data-testid="income-zakat">
            {toIDR(amount)}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">
        Nisab setara 85 gram emas 14 karat per tahun, sesuai SK Ketua BAZNAS No. 15 Tahun 2026.
      </p>
    </div>
  );
}
