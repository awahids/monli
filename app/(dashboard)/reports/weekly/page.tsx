'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, ReceiptText, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Kanto } from '@/components/brand/kanto';
import { formatMoney } from '@/lib/currency';
import { formatDate } from '@/lib/date';
import { addDays, weekStart, type WeeklySummary } from '@/lib/weekly-summary';
import { useAppStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

const card = 'rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border';

/** This week's spending against the same days of last week, by day and by category. */
export default function WeeklySummaryPage() {
  const { user } = useAppStore();
  const { t, dateLocale } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const thisWeek = weekStart(formatDate(new Date()));
  const asked = params.get('week') ?? '';
  const week = /^\d{4}-\d{2}-\d{2}$/.test(asked) && !Number.isNaN(Date.parse(asked)) ? weekStart(asked) : thisWeek;
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setSummary(null);
    setFailed(false);
    fetch(`/api/reports/weekly?week=${week}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => !cancelled && setSummary(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [user, week]);

  const day = (d: string, pattern: string) => format(new Date(`${d}T00:00:00`), pattern, { locale: dateLocale });
  const go = (w: string) => router.replace(`/reports/weekly?week=${w}`);
  const current = week === thisWeek;
  const change = summary?.change === null || !summary ? null : Math.round(summary.change);
  const peak = summary ? Math.max(1, ...summary.days.flatMap((d) => [d.amount, d.previous])) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" onClick={() => go(addDays(week, -7))} aria-label={t('Minggu sebelumnya', 'Previous week')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-semibold">{current ? t('Ringkasan minggu ini', 'This week') : t('Ringkasan mingguan', 'Weekly summary')}</h1>
          <p className="text-xs text-muted-foreground">
            {day(week, 'd MMM')} – {day(addDays(week, 6), 'd MMM yyyy')}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => go(addDays(week, 7))} disabled={current} aria-label={t('Minggu berikutnya', 'Next week')}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {failed ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t('Ringkasan gagal dimuat.', 'Could not load the summary.')}</p>
      ) : !summary ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : !summary.expense && !summary.previousExpense ? (
        <EmptyState
          icon={ReceiptText}
          title={t('Belum ada pengeluaran minggu ini', 'No spending this week')}
          description={t('Ringkasan muncul setelah ada pengeluaran yang dicatat.', 'The summary appears once spending is recorded.')}
        />
      ) : (
        <>
          <section className="relative isolate flex items-center gap-3 overflow-hidden rounded-3xl bg-[image:var(--gradient-hero)] p-5 text-primary-foreground shadow-lg shadow-primary/20">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-primary-foreground/80">{t('Pengeluaran', 'Spending')}</p>
              <p className="font-display text-3xl font-bold tabular-nums">{formatMoney(summary.expense)}</p>
              <p className="mt-1 text-sm text-primary-foreground/90">
                {change === null
                  ? t('Minggu lalu belum ada pengeluaran untuk dibandingkan.', 'Nothing spent last week to compare with.')
                  : change < 0
                    ? t(`${-change}% lebih hemat dari minggu lalu (${formatMoney(summary.previousExpense)})`, `${-change}% less than last week (${formatMoney(summary.previousExpense)})`)
                    : change > 0
                      ? t(`Naik ${change}% dari minggu lalu (${formatMoney(summary.previousExpense)})`, `${change}% more than last week (${formatMoney(summary.previousExpense)})`)
                      : t('Sama dengan minggu lalu', 'The same as last week')}
              </p>
              {current && summary.end < addDays(week, 6) && (
                <p className="mt-1 text-xs text-primary-foreground/70">
                  {t(`Dibanding hari yang sama minggu lalu (sampai ${day(summary.previousEnd, 'EEEE')}).`, `Against the same days last week (up to ${day(summary.previousEnd, 'EEEE')}).`)}
                </p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-white/90 p-1.5">
              <Kanto mood={change !== null && change < 0 ? 'cheer' : 'idle'} className="h-16 w-16 text-slate-900" />
            </span>
          </section>

          <section className={card}>
            <h2 className="mb-3 text-base font-semibold">{t('Per hari', 'By day')}</h2>
            <div className="flex h-32 items-end gap-2" role="list">
              {summary.days.map((d) => (
                <div
                  key={d.date}
                  role="listitem"
                  aria-label={t(`${day(d.date, 'EEEE')}: ${formatMoney(d.amount)}, minggu lalu ${formatMoney(d.previous)}`, `${day(d.date, 'EEEE')}: ${formatMoney(d.amount)}, last week ${formatMoney(d.previous)}`)}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  <div className="flex h-full w-full items-end justify-center gap-0.5">
                    <span className="w-1/3 rounded-t bg-muted-foreground/25" style={{ height: `${(d.previous / peak) * 100}%` }} />
                    <span className="w-1/2 rounded-t bg-primary" style={{ height: `${(d.amount / peak) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{day(d.date, 'EEEEEE')}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-primary" aria-hidden /> {t('Minggu ini', 'This week')}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-muted-foreground/25" aria-hidden /> {t('Minggu lalu', 'Last week')}
              </span>
            </p>
          </section>

          {summary.rising.length > 0 && (
            <section className={card}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="h-4 w-4 text-rose-500" />
                {t('Paling naik', 'Up the most')}
              </h2>
              <ul className="divide-y text-sm">
                {summary.rising.map((c) => (
                  <li key={c.categoryId} className="flex items-center gap-2 py-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatMoney(c.previous)} → {formatMoney(c.amount)}
                    </span>
                    <span className="tabular-nums font-medium text-rose-600 dark:text-rose-400">+{formatMoney(c.amount - c.previous)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summary.topCategories.length > 0 && (
            <section className={card}>
              <h2 className="mb-3 text-base font-semibold">{t('Pengeluaran terbesar', 'Biggest spending')}</h2>
              <ul className="space-y-3">
                {summary.topCategories.map((c) => (
                  <li key={c.categoryId} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      <span className="tabular-nums font-medium">{formatMoney(c.amount)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(c.amount / summary.expense) * 100}%`, backgroundColor: c.color }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-center text-xs text-muted-foreground">
            {t(`${summary.transactionCount} transaksi tercatat minggu ini. `, `${summary.transactionCount} transactions recorded this week. `)}
            <Link href="/reports/monthly" className="font-medium text-primary underline-offset-2 hover:underline">
              {t('Lihat laporan bulanan', 'See the monthly report')}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
