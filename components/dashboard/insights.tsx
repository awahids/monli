'use client';

import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, CalendarClock, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { Category, RecurringTransaction } from '@/types';
import type { BudgetUsage, CategorySpend } from '@/lib/dashboard';
import { percentChange } from '@/lib/dashboard';
import { formatMoney, formatMoneyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { CategoryIcon } from '@/components/transactions/category-icon';

const HIDDEN = 'Rp •••••';
const card = 'rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border';

function CardHeader({ title, subtitle, href, linkLabel }: { title: string; subtitle?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          aria-label={linkLabel}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-border transition-colors hover:bg-muted"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/** Income and spending of this period next to the previous one. */
export function StatTiles({
  income,
  expense,
  prevIncome,
  prevExpense,
  hidden,
}: {
  income: number;
  expense: number;
  prevIncome: number | null;
  prevExpense: number | null;
  hidden: boolean;
}) {
  const { t } = useT();
  const tiles = [
    { label: t('Pemasukan', 'Income'), value: income, prev: prevIncome, icon: ArrowUpRight, tone: 'text-emerald-600 bg-emerald-500/10', upIsGood: true },
    { label: t('Pengeluaran', 'Spending'), value: expense, prev: prevExpense, icon: ArrowDownRight, tone: 'text-rose-600 bg-rose-500/10', upIsGood: false },
  ];
  return (
    <section className="grid grid-cols-2 gap-3" aria-label={t('Ringkasan periode', 'Period summary')}>
      {tiles.map(({ label, value, prev, icon: Icon, tone, upIsGood }) => {
        const change = prev === null ? null : percentChange(value, prev);
        const good = change !== null && (change >= 0) === upIsGood;
        return (
          <div key={label} className={cn(card, 'space-y-2')}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', tone)}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="truncate font-display text-lg font-bold tabular-nums">{hidden ? HIDDEN : formatMoney(value)}</p>
            {change !== null ? (
              <p className={cn('flex items-center gap-1 text-xs font-medium', good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {change >= 0 ? '+' : ''}
                {Math.round(change)}%
                <span className="font-normal text-muted-foreground">{t('vs periode lalu', 'vs last period')}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{t('Belum ada pembanding', 'Nothing to compare yet')}</p>
            )}
          </div>
        );
      })}
    </section>
  );
}

/** Bars of each day's spending this period, today's bar highlighted, with the daily average. */
export function SpendingChart({ days, today, hidden }: { days: { date: string; amount: number }[]; today: string; hidden: boolean }) {
  const { t } = useT();
  const passed = days.filter((d) => d.date <= today);
  const total = passed.reduce((s, d) => s + d.amount, 0);
  const average = passed.length ? total / passed.length : 0;
  const data = days.map((d) => ({ ...d, day: Number(d.date.slice(8, 10)) }));
  return (
    <section className={card}>
      <CardHeader
        title={t('Pengeluaran harian', 'Daily spending')}
        href="/reports"
        linkLabel={t('Buka laporan', 'Open reports')}
      />
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-xs text-muted-foreground">{t('Rata-rata per hari', 'Average per day')}</span>
        <span className="font-display text-xl font-bold tabular-nums">{hidden ? HIDDEN : formatMoney(Math.round(average))}</span>
      </div>
      <div className="h-36" role="img" aria-label={t('Grafik pengeluaran harian periode ini', 'Chart of daily spending this period')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="day" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} tick={{ fontSize: 10 }} />
            {!hidden && (
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                formatter={(v: number) => [formatMoney(v), t('Pengeluaran', 'Spending')]}
                labelFormatter={(day) => t(`Tanggal ${day}`, `Day ${day}`)}
              />
            )}
            {average > 0 && <ReferenceLine y={average} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />}
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {data.map((d) => (
                <Cell
                  key={d.date}
                  fill="hsl(var(--primary))"
                  fillOpacity={d.date === today ? 1 : d.date < today ? 0.35 : 0.12}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/** Donut of where the money went, with the biggest categories beside it. */
export function CategoryDonut({ rows, hidden }: { rows: CategorySpend[]; hidden: boolean }) {
  const { t } = useT();
  if (!rows.length) return null;
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const top = rows.slice(0, 4);
  const rest = total - top.reduce((s, r) => s + r.amount, 0);
  const legend = rest > 0 ? [...top, { categoryId: 'rest', name: t('Lainnya', 'Others'), color: '#94a3b8', amount: rest }] : top;
  return (
    <section className={card}>
      <CardHeader
        title={t('Ke mana uangmu', 'Where your money went')}
        href="/reports"
        linkLabel={t('Buka laporan', 'Open reports')}
      />
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={legend} dataKey="amount" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none">
                {legend.map((r) => (
                  <Cell key={r.categoryId} fill={r.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-muted-foreground">{t('Total', 'Total')}</span>
            <span className="text-xs font-bold tabular-nums">{hidden ? '•••' : formatMoneyCompact(total)}</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2 text-xs">
          {legend.map((r) => (
            <li key={r.categoryId} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <span className="tabular-nums font-medium">{Math.round((r.amount / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** The budgets closest to running out. */
export function BudgetWatch({ usage, categories, hidden }: { usage: BudgetUsage[]; categories: Category[]; hidden: boolean }) {
  const { t } = useT();
  if (!usage.length) return null;
  const byId = new Map(categories.map((c) => [c.id, c]));
  return (
    <section className={card}>
      <CardHeader
        title={t('Pantau budget', 'Budget watch')}
        subtitle={t('Kategori yang paling cepat habis', 'Categories running out fastest')}
        href="/budgets"
        linkLabel={t('Buka budget', 'Open budgets')}
      />
      <ul className="grid grid-cols-2 gap-2">
        {usage.slice(0, 4).map((u) => {
          const cat = byId.get(u.categoryId);
          const pct = Math.round(u.pct);
          const tone = u.pct >= 100 ? 'bg-rose-500' : u.pct >= 80 ? 'bg-amber-500' : 'bg-primary';
          return (
            <li key={u.categoryId} className="space-y-2 rounded-xl bg-muted/50 p-3">
              <div className="flex items-center gap-1.5">
                <CategoryIcon name={cat?.icon || 'Tag'} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-xs">{cat?.name ?? '-'}</span>
              </div>
              <p className={cn('font-display text-lg font-bold tabular-nums', u.pct >= 100 && 'text-rose-600 dark:text-rose-400')}>{pct}%</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-background">
                <div className={cn('h-full rounded-full', tone)} style={{ width: `${Math.min(u.pct, 100)}%` }} />
              </div>
              <p className="truncate text-[11px] text-muted-foreground tabular-nums">
                {hidden ? HIDDEN : `${formatMoneyCompact(u.actual)} / ${formatMoneyCompact(u.planned)}`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Recurring bills and income due in the next two weeks. */
export function UpcomingRecurring({ rules, hidden }: { rules: RecurringTransaction[]; hidden: boolean }) {
  const { t, locale } = useT();
  if (!rules.length) return null;
  const dateLabel = (d: string) =>
    new Date(`${d}T00:00:00+07:00`).toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short' });
  return (
    <section className={card}>
      <CardHeader
        title={t('Akan datang', 'Coming up')}
        subtitle={t('Transaksi rutin 14 hari ke depan', 'Recurring transactions in the next 14 days')}
        href="/recurring"
        linkLabel={t('Buka transaksi rutin', 'Open recurring transactions')}
      />
      <ul className="divide-y">
        {rules.slice(0, 5).map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${r.category?.color || '#14A7A0'}1f`, color: r.category?.color || '#14A7A0' }}
            >
              {r.category?.icon ? <CategoryIcon name={r.category.icon} className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.note || r.category?.name || t('Transfer', 'Transfer')}</p>
              <p className="text-xs text-muted-foreground">{dateLabel(r.nextDate)}</p>
            </div>
            <span
              className={cn(
                'text-sm font-semibold tabular-nums',
                r.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : r.type === 'expense' && 'text-foreground'
              )}
            >
              {hidden ? HIDDEN : `${r.type === 'income' ? '+' : r.type === 'expense' ? '-' : ''}${formatMoney(r.amount)}`}
            </span>
          </li>
        ))}
      </ul>
      <Link href="/recurring" className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        {t('Kelola transaksi rutin', 'Manage recurring')}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
