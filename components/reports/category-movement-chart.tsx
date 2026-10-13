'use client';

import { useEffect, useState } from 'react';
import { formatMoney } from '@/lib/currency';
import type { ChartResponse } from '@/types';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

/**
 * Budget vs actual per category, as a list with a bar each: readable with
 * any number of categories on a phone, unlike a chart with one label per
 * category on its axis. Most used budgets first.
 */
export default function CategoryMovementChart({ month }: { month: string }) {
  const [rows, setRows] = useState<ChartResponse['data']>([]);
  const { t } = useT();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/budget-vs-actual?month=${month}&type=expense`)
      .then((res) => res.json())
      .then((res: ChartResponse) => {
        const planned = (res.data || [])
          .map((d) => ({ ...d, planned: Number(d.planned), actual: Number(d.actual) }))
          .filter((d) => d.planned > 0);
        setRows(planned.sort((a, b) => b.actual / b.planned - a.actual / a.planned));
        setError(false);
      })
      .catch(() => {
        setRows([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-destructive">{t('Gagal memuat data', 'Could not load data')}</div>}
      {loading && <div className="text-sm text-muted-foreground">{t('Memuat...', 'Loading...')}</div>}
      {!loading && !error && rows.length === 0 && (
        <div className="text-sm text-muted-foreground">
          {t('Belum ada budget per kategori untuk bulan ini.', 'No category budgets for this month yet.')}
        </div>
      )}
      {rows.length > 0 && (
        <ul className="divide-y rounded-xl border bg-card px-4" aria-label={t('Budget per kategori', 'Budget by category')}>
          {rows.map((r) => {
            const pct = Math.round((r.actual / r.planned) * 100);
            const over = r.actual > r.planned;
            return (
              <li key={r.category_id} className="space-y-1.5 py-3">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium">{r.category_name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatMoney(r.actual)} / {formatMoney(r.planned)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', over ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-primary')}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className={cn('text-xs tabular-nums', over ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                  {over
                    ? t(`Lebih ${formatMoney(r.actual - r.planned)} (${pct}%)`, `${formatMoney(r.actual - r.planned)} over (${pct}%)`)
                    : t(`Sisa ${formatMoney(r.planned - r.actual)} (${pct}% terpakai)`, `${formatMoney(r.planned - r.actual)} left (${pct}% used)`)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
