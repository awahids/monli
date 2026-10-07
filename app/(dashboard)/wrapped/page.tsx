'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { Wrapped } from '@/lib/wrapped';
import { formatMoney } from '@/lib/currency';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { type I18n, useT } from '@/lib/i18n';

const monthName = (m: string, { dateLocale }: I18n) => format(new Date(`${m}-01T00:00:00`), 'MMMM', { locale: dateLocale });

/** What the share button sends: numbers only, no account names. */
function shareText(w: Wrapped, i18n: I18n) {
  const { t } = i18n;
  const top = w.topCategories[0];
  return [
    t(`${w.year} versi aku di Qala Saku:`, `My ${w.year} on Qala Saku:`),
    t(`${w.count} transaksi dicatat dalam ${w.activeDays} hari`, `${w.count} transactions recorded over ${w.activeDays} days`),
    w.savingsRate !== null && t(`Menabung ${w.savingsRate}% dari pemasukan`, `Saved ${w.savingsRate}% of income`),
    top && t(`Paling banyak untuk ${top.name} (${top.share}%)`, `Spent most on ${top.name} (${top.share}%)`),
    w.frugalMonth && t(`Bulan paling hemat: ${monthName(w.frugalMonth.month, i18n)}`, `Most frugal month: ${monthName(w.frugalMonth.month, i18n)}`),
  ]
    .filter(Boolean)
    .join('\n');
}

function Slide({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn('space-y-3 rounded-2xl p-6 text-white shadow-sm', className)}>{children}</section>
  );
}

export default function WrappedPage() {
  const { dataVersion } = useAppStore();
  const i18n = useT();
  const { t, dateLocale } = i18n;
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [data, setData] = useState<Wrapped | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    fetch(`/api/reports/wrapped?year=${year}`)
      .then((r) => r.json())
      .then((d) => !cancelled && (d.error ? toast.error(t('Gagal memuat ringkasan', 'Could not load the summary')) : setData(d)))
      .catch(() => toast.error(t('Gagal memuat ringkasan', 'Could not load the summary')));
    return () => {
      cancelled = true;
    };
  }, [year, dataVersion, t]);

  const share = async () => {
    if (!data) return;
    const text = shareText(data, i18n);
    try {
      if (navigator.share) await navigator.share({ title: t(`Ringkasan ${data.year}`, `${data.year} in review`), text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success(t('Ringkasan disalin', 'Summary copied'));
      }
    } catch {
      // Cancelled by the user.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('Ringkasan tahunan', 'Year in review')}</h1>
          <p className="text-sm text-muted-foreground">{t('Setahun keuanganmu dalam beberapa angka.', 'Your year of money in a few numbers.')}</p>
        </div>
        <Button variant="outline" onClick={share} disabled={!data || data.count === 0}>
          <Share2 className="mr-1 h-4 w-4" /> {t('Bagikan', 'Share')}
        </Button>
      </div>

      <div className="flex gap-2" role="group" aria-label={t('Tahun', 'Year')}>
        {[thisYear, thisYear - 1, thisYear - 2].map((y) => (
          <button
            key={y}
            type="button"
            aria-pressed={year === y}
            onClick={() => setYear(y)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              year === y ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
          >
            {y}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="space-y-4" aria-busy="true" aria-label={t('Memuat ringkasan', 'Loading summary')}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : data.count === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={t(`Belum ada catatan di ${data.year}`, `Nothing recorded in ${data.year}`)}
          description={t('Catat transaksimu, dan ringkasannya muncul di sini.', 'Record your transactions and the summary shows up here.')}
        />
      ) : (
        <div className="space-y-4">
          <Slide className="bg-gradient-to-br from-teal-600 to-emerald-800">
            <p className="text-sm uppercase tracking-widest text-white/70">{t(`${data.year} kamu`, `Your ${data.year}`)}</p>
            <p className="font-display text-4xl font-bold leading-tight">{t(`${data.count} transaksi`, `${data.count} transactions`)}</p>
            <p className="text-white/80">
              {t(`dicatat dalam ${data.activeDays} hari berbeda. Konsisten!`, `recorded on ${data.activeDays} different days. Consistent!`)}
            </p>
          </Slide>

          <Slide className="bg-gradient-to-br from-indigo-600 to-violet-800">
            <p className="text-sm uppercase tracking-widest text-white/70">{t('Arus uang', 'Money flow')}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-white/70">{t('Masuk', 'In')}</p>
                <p className="font-display text-xl font-bold tabular-nums">{formatMoney(data.income)}</p>
              </div>
              <div>
                <p className="text-sm text-white/70">{t('Keluar', 'Out')}</p>
                <p className="font-display text-xl font-bold tabular-nums">{formatMoney(data.expense)}</p>
              </div>
            </div>
            {data.savingsRate !== null && (
              <p className="text-white/90">
                {data.savingsRate > 0
                  ? t(`Kamu menyisihkan ${data.savingsRate}% dari pemasukan.`, `You kept ${data.savingsRate}% of your income.`)
                  : t('Pengeluaran melebihi pemasukan tahun ini. Tahun depan pasti lebih baik!', 'Spending was higher than income this year. Next year will be better!')}
              </p>
            )}
          </Slide>

          {data.topCategories.length > 0 && (
            <Slide className="bg-gradient-to-br from-amber-500 to-orange-700">
              <p className="text-sm uppercase tracking-widest text-white/70">{t('Paling banyak untuk', 'Spent most on')}</p>
              <p className="font-display text-3xl font-bold">{data.topCategories[0].name}</p>
              <ul className="space-y-2">
                {data.topCategories.map((c) => (
                  <li key={c.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{c.name}</span>
                      <span className="tabular-nums">
                        {formatMoney(c.amount)} · {c.share}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/20">
                      <div className="h-full rounded-full bg-white" style={{ width: `${c.share}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Slide>
          )}

          {data.frugalMonth && data.peakMonth && (
            <Slide className="bg-gradient-to-br from-sky-600 to-blue-800">
              <p className="text-sm uppercase tracking-widest text-white/70">{t('Bulan paling hemat', 'Most frugal month')}</p>
              <p className="font-display text-3xl font-bold capitalize">{monthName(data.frugalMonth.month, i18n)}</p>
              <p className="text-white/80">
                {t(`Hanya ${formatMoney(data.frugalMonth.amount)} keluar. Paling boros di`, `Only ${formatMoney(data.frugalMonth.amount)} spent. Priciest was`)}{' '}
                <span className="capitalize">{monthName(data.peakMonth.month, i18n)}</span> ({formatMoney(data.peakMonth.amount)}).
              </p>
            </Slide>
          )}

          {data.biggestExpense && (
            <Slide className="bg-gradient-to-br from-rose-600 to-pink-800">
              <p className="text-sm uppercase tracking-widest text-white/70">{t('Pengeluaran terbesar', 'Biggest expense')}</p>
              <p className="font-display text-3xl font-bold tabular-nums">{formatMoney(data.biggestExpense.amount)}</p>
              <p className="text-white/80">
                {data.biggestExpense.note || data.biggestExpense.category} ·{' '}
                {format(new Date(`${data.biggestExpense.date}T00:00:00`), 'd MMMM', { locale: dateLocale })}
              </p>
            </Slide>
          )}
        </div>
      )}
    </div>
  );
}
