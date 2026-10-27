'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarClock, ChevronRight, FileBarChart, Sparkles, X } from 'lucide-react';
import type { Category } from '@/types';
import type { RunOut, SpendForecast } from '@/lib/forecast';
import { formatMoney } from '@/lib/currency';
import { ProLock } from '@/components/ui/pro-lock';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const HIDDEN = 'Rp •••••';
const card = 'rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border';

/**
 * Where this period is heading: expected spending by its last day against the
 * budget (or income), and the budgets set to run out early. PRO.
 */
export function ForecastCard({
  forecast,
  planned,
  income,
  runOuts,
  categories,
  isPro,
  hidden,
}: {
  forecast: SpendForecast | null;
  /** The period's budget with carry-over; null without a budget. */
  planned: number | null;
  income: number;
  runOuts: RunOut[];
  categories: Category[];
  isPro: boolean;
  hidden: boolean;
}) {
  const { t, dateLocale } = useT();
  if (!forecast) return null;
  const money = (n: number) => (hidden ? HIDDEN : formatMoney(n));
  const against = planned ?? (income > 0 ? income : null);
  const left = against === null ? null : against - forecast.projected;
  const byId = new Map(categories.map((c) => [c.id, c]));
  const day = (d: string) => format(new Date(`${d}T00:00:00`), 'd MMM', { locale: dateLocale });

  return (
    <ProLock
      locked={!isPro}
      title={t('Prediksi akhir periode', 'End-of-period forecast')}
      description={t(
        'Lihat perkiraan pengeluaran sampai gajian berikutnya dan budget mana yang akan habis duluan.',
        'See expected spending until next payday and which budgets will run out first.'
      )}
    >
      <section className={card} aria-label={t('Prediksi akhir periode', 'End-of-period forecast')}>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 className="text-base font-semibold">{t('Prediksi akhir periode', 'End-of-period forecast')}</h2>
        </div>

        <p className="text-xs text-muted-foreground">{t('Perkiraan total pengeluaran', 'Expected total spending')}</p>
        <p className="font-display text-xl font-bold tabular-nums">{money(forecast.projected)}</p>
        {left !== null && (
          <p
            className={cn(
              'mt-1 text-sm font-medium',
              left >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {left >= 0
              ? planned !== null
                ? t(`Budget diperkirakan masih sisa ${money(left)}`, `Budget expected to have ${money(left)} left`)
                : t(`Pemasukan diperkirakan masih sisa ${money(left)}`, `Income expected to have ${money(left)} left`)
              : planned !== null
                ? t(`Diperkirakan melebihi budget ${money(-left)}`, `Expected to go ${money(-left)} over budget`)
                : t(`Diperkirakan melebihi pemasukan ${money(-left)}`, `Expected to spend ${money(-left)} more than income`)}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {t(
            `Rata-rata ${money(Math.round(forecast.dailyRate))} per hari, ${forecast.daysLeft} hari lagi`,
            `${money(Math.round(forecast.dailyRate))} a day on average, ${forecast.daysLeft} days to go`
          )}
          {forecast.upcomingRecurring > 0 &&
            t(
              `, ditambah tagihan rutin ${money(forecast.upcomingRecurring)}`,
              `, plus ${money(forecast.upcomingRecurring)} in recurring bills`
            )}
          .
        </p>

        {runOuts.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t pt-3 text-sm">
            {runOuts.slice(0, 3).map((r) => (
              <li key={r.categoryId} className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 shrink-0 text-amber-500" />
                <span className="min-w-0 flex-1 truncate">
                  {t(`Budget ${byId.get(r.categoryId)?.name ?? ''} habis sekitar`, `${byId.get(r.categoryId)?.name ?? ''} budget runs out around`)}
                </span>
                <span className="font-medium tabular-nums">{day(r.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ProLock>
  );
}

const DISMISS_KEY = 'saku_report_seen';

/** "Your October report is ready", in the first week of the next period, until dismissed. */
export function ReportReadyCard({ month, daysIntoPeriod }: { month: string; daysIntoPeriod: number }) {
  const { t, dateLocale } = useT();
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === month);
    } catch {
      setDismissed(false);
    }
  }, [month]);
  if (dismissed || daysIntoPeriod > 7) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, month);
    } catch {}
  };
  const label = format(new Date(`${month}-01T00:00:00`), 'MMMM', { locale: dateLocale });
  return (
    <section className={cn(card, 'relative flex items-center gap-3')}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FileBarChart className="h-5 w-5" />
      </span>
      <Link href={`/reports/monthly?month=${month}`} onClick={dismiss} className="min-w-0 flex-1">
        <p className="text-sm font-semibold capitalize">{t(`Laporan ${label} sudah siap`, `Your ${label} report is ready`)}</p>
        <p className="text-xs text-muted-foreground">
          {t('Lihat berapa yang tersisihkan dan ke mana uangmu pergi.', 'See what you put aside and where your money went.')}
        </p>
      </Link>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('Tutup', 'Dismiss')}
        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}
