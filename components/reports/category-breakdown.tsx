'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatMoney } from '@/lib/currency';
import { useT } from '@/lib/i18n';

type Row = { categoryId: string; name: string; color: string; amount: number };

/**
 * Donut with the total in the middle and every category listed below it.
 * The list grows with the categories instead of a chart legend, which ran
 * over the donut once there were more than a handful.
 */
export function CategoryBreakdown({ rows }: { rows: Row[] }) {
  const { t } = useT();
  const sorted = [...rows].filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount);
  const total = sorted.reduce((s, r) => s + r.amount, 0);

  if (!sorted.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t('Belum ada pengeluaran.', 'No spending yet.')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={sorted} dataKey="amount" nameKey="name" innerRadius="62%" outerRadius="95%" paddingAngle={1} stroke="none">
              {sorted.map((r) => (
                <Cell key={r.categoryId} fill={r.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => formatMoney(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">{t('Total', 'Total')}</span>
          <span className="font-display text-base font-bold tabular-nums">{formatMoney(total)}</span>
        </div>
      </div>
      <ul className="divide-y text-sm">
        {sorted.map((r) => (
          <li key={r.categoryId} className="flex items-center gap-3 py-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{r.name}</span>
            <span className="tabular-nums">{formatMoney(r.amount)}</span>
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{Math.round((r.amount / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
