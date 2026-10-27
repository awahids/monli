'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney } from '@/lib/currency';
import { currentBudgetMonth, periodRange, shiftMonth } from '@/lib/date';
import { percentChange } from '@/lib/dashboard';
import type { MonthlyReport } from '@/lib/monthly-report';
import { useAppStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const card = 'rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border';

function Change({ now, before, upIsGood }: { now: number; before: number; upIsGood: boolean }) {
  const { t } = useT();
  const change = percentChange(now, before);
  if (change === null) return null;
  const good = (change >= 0) === upIsGood;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
      {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {change >= 0 ? '+' : ''}
      {Math.round(change)}%<span className="sr-only">{t(' dibanding periode sebelumnya', ' vs the period before')}</span>
    </span>
  );
}

/** A finished budget period at a glance: saved, in and out, where it went, what ran over. */
export default function MonthlyReportPage() {
  const { user } = useAppStore();
  const { t, dateLocale } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const startDay = user?.budgetStartDay || 1;
  const current = currentBudgetMonth(startDay);
  const month = /^\d{4}-\d{2}$/.test(params.get('month') ?? '') ? params.get('month')! : shiftMonth(current, -1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setReport(null);
    setFailed(false);
    fetch(`/api/reports/summary?month=${month}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => !cancelled && setReport(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [user, month]);

  const label = format(new Date(`${month}-01T00:00:00`), 'MMMM yyyy', { locale: dateLocale });
  const range = periodRange(month, startDay);
  const go = (m: string) => router.replace(`/reports/monthly?month=${m}`);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" onClick={() => go(shiftMonth(month, -1))} aria-label={t('Periode sebelumnya', 'Previous period')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-semibold capitalize">{t(`Laporan ${label}`, `${label} report`)}</h1>
          {range && <p className="text-xs text-muted-foreground">{range}</p>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => go(shiftMonth(month, 1))}
          disabled={month >= current}
          aria-label={t('Periode berikutnya', 'Next period')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {failed ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t('Laporan gagal dimuat.', 'Could not load the report.')}</p>
      ) : !report ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-36 rounded-3xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : report.transactionCount === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={t('Belum ada transaksi di periode ini', 'No transactions in this period')}
          description={t('Laporan muncul setelah ada transaksi yang dicatat.', 'The report appears once transactions are recorded.')}
        />
      ) : (
        <>
          <section className="relative isolate overflow-hidden rounded-3xl bg-[image:var(--gradient-hero)] p-5 text-primary-foreground shadow-lg shadow-primary/20">
            <p className="text-sm text-primary-foreground/80">
              {report.saved >= 0 ? t('Berhasil disisihkan', 'Put aside') : t('Pengeluaran melebihi pemasukan', 'Spent more than came in')}
            </p>
            <p className="font-display text-3xl font-bold tabular-nums">{formatMoney(Math.abs(report.saved))}</p>
            {report.savingsRate !== null && report.saved >= 0 && (
              <p className="mt-1 text-sm text-primary-foreground/80">
                {t(`${report.savingsRate}% dari pemasukan`, `${report.savingsRate}% of income`)}
              </p>
            )}
          </section>

          <section className="grid grid-cols-2 gap-3">
            {[
              { label: t('Pemasukan', 'Income'), value: report.income, before: report.previous?.income, icon: ArrowUpRight, tone: 'text-emerald-600 bg-emerald-500/10', upIsGood: true },
              { label: t('Pengeluaran', 'Spending'), value: report.expense, before: report.previous?.expense, icon: ArrowDownRight, tone: 'text-rose-600 bg-rose-500/10', upIsGood: false },
            ].map(({ label: l, value, before, icon: Icon, tone, upIsGood }) => (
              <div key={l} className={cn(card, 'space-y-1')}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{l}</span>
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', tone)}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="truncate font-display text-lg font-bold tabular-nums">{formatMoney(value)}</p>
                {before !== undefined && <Change now={value} before={before} upIsGood={upIsGood} />}
              </div>
            ))}
          </section>

          {report.topCategories.length > 0 && (
            <section className={card}>
              <h2 className="mb-3 text-base font-semibold">{t('Pengeluaran terbesar', 'Biggest spending')}</h2>
              <ul className="space-y-3">
                {report.topCategories.map((c) => (
                  <li key={c.categoryId} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      {report.previous && <Change now={c.amount} before={c.previous} upIsGood={false} />}
                      <span className="tabular-nums font-medium">{formatMoney(c.amount)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(c.amount / report.expense) * 100}%`, backgroundColor: c.color }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.overBudget.length > 0 && (
            <section className={card}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {t('Melewati budget', 'Over budget')}
              </h2>
              <ul className="divide-y text-sm">
                {report.overBudget.map((o) => (
                  <li key={o.categoryId} className="flex items-center justify-between gap-2 py-2">
                    <span className="truncate">{o.name}</span>
                    <span className="tabular-nums text-rose-600 dark:text-rose-400">
                      +{formatMoney(o.actual - o.planned)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.biggest && (
            <section className={card}>
              <h2 className="mb-1 text-base font-semibold">{t('Transaksi terbesar', 'Biggest transaction')}</h2>
              <p className="text-sm">
                <span className="font-semibold tabular-nums">{formatMoney(report.biggest.amount)}</span>{' '}
                <span className="text-muted-foreground">
                  · {report.biggest.note || report.biggest.category} ·{' '}
                  {format(new Date(`${report.biggest.date}T00:00:00`), 'd MMM', { locale: dateLocale })}
                </span>
              </p>
            </section>
          )}

          <p className="text-center text-xs text-muted-foreground">
            {t(`${report.transactionCount} transaksi tercatat. `, `${report.transactionCount} transactions recorded. `)}
            <Link href="/reports" className="font-medium text-primary underline-offset-2 hover:underline">
              {t('Lihat laporan lengkap', 'See full reports')}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
