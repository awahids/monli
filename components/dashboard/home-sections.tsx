'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, Camera, ChevronRight, Eye, EyeOff, HandCoins, Plus, Split, Target } from 'lucide-react';
import type { Account } from '@/types';
import { formatMoney } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { CategoryIcon } from '@/components/transactions/category-icon';

const HIDE_KEY = 'saku_hide_balance';
const HIDDEN = 'Rp •••••';

/** "Hide amounts" toggle, remembered on this device. */
export function useHiddenBalance() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(HIDE_KEY) === '1');
    } catch {}
  }, []);
  const toggle = () =>
    setHidden((h) => {
      try {
        localStorage.setItem(HIDE_KEY, h ? '0' : '1');
      } catch {}
      return !h;
    });
  return [hidden, toggle] as const;
}

export interface BudgetLine {
  remaining: number;
  daily: number;
  daysLeft: number;
  pct: number;
  over: boolean;
}

/** The home screen's hero: total balance, this period's flow and today's allowance. */
export function BalanceHero({
  balance,
  income,
  expense,
  budget,
  hidden,
  onToggleHidden,
}: {
  balance: number;
  income: number;
  expense: number;
  budget: BudgetLine | null;
  hidden: boolean;
  onToggleHidden: () => void;
}) {
  const { t } = useT();
  const money = (n: number) => (hidden ? HIDDEN : formatMoney(n));
  return (
    <section className="space-y-4 rounded-3xl bg-gradient-to-br from-primary to-teal-800 p-5 text-primary-foreground shadow-lg shadow-primary/20">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-primary-foreground/80">
          {t('Saldo total', 'Total balance')}
          <button
            type="button"
            onClick={onToggleHidden}
            aria-label={hidden ? t('Tampilkan saldo', 'Show balance') : t('Sembunyikan saldo', 'Hide balance')}
            className="rounded-full p-1 transition-transform active:scale-90"
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="font-display text-3xl font-bold tabular-nums">{money(balance)}</p>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1">
          <ArrowUpRight className="h-4 w-4 text-emerald-200" aria-hidden />
          <span className="sr-only">{t('Pemasukan', 'Income')}</span>
          <span className="tabular-nums">{money(income)}</span>
        </span>
        <span className="flex items-center gap-1">
          <ArrowDownRight className="h-4 w-4 text-rose-200" aria-hidden />
          <span className="sr-only">{t('Pengeluaran', 'Expenses')}</span>
          <span className="tabular-nums">{money(expense)}</span>
        </span>
        <Link href="/reports" className="ml-auto flex items-center text-xs text-primary-foreground/80 hover:text-primary-foreground">
          {t('Laporan', 'Reports')}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="rounded-2xl bg-white/10 p-3">
        {budget ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-primary-foreground/80">
                {budget.over ? t('Budget terlampaui', 'Over budget') : t('Sisa jatah hari ini', "Today's allowance")}
              </span>
              <span className="font-semibold tabular-nums">
                {money(budget.over ? -budget.remaining : budget.daily)}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div
                className={cn('h-full rounded-full', budget.over ? 'bg-rose-300' : budget.pct >= 80 ? 'bg-amber-300' : 'bg-white')}
                style={{ width: `${budget.pct}%` }}
              />
            </div>
            {!budget.over && (
              <p className="mt-1.5 text-xs text-primary-foreground/80">
                {t(
                  `Sisa budget ${money(budget.remaining)} untuk ${budget.daysLeft} hari lagi`,
                  `${money(budget.remaining)} budget left for ${budget.daysLeft} more days`
                )}
              </p>
            )}
          </>
        ) : (
          <Link href="/budgets" className="flex items-center justify-between text-sm">
            {t('Atur budget untuk melihat jatah harianmu', 'Set a budget to see your daily allowance')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

/** Round shortcuts under the hero, like a wallet app. */
export function QuickActions({ isPro, onAdd }: { isPro: boolean; onAdd: () => void }) {
  const { t } = useT();
  const item = 'flex flex-col items-center gap-1.5 whitespace-nowrap text-xs font-medium transition-transform active:scale-95';
  const bubble = 'flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-border';
  const links = [
    isPro && { href: '/transactions?action=scan', icon: Camera, label: t('Scan struk', 'Scan') },
    { href: '/transactions?action=split', icon: Split, label: t('Patungan', 'Split') },
    { href: '/debts', icon: HandCoins, label: t('Hutang', 'Debts') },
    { href: '/goals', icon: Target, label: t('Target', 'Goals') },
  ].filter(Boolean) as { href: string; icon: typeof Camera; label: string }[];
  return (
    <nav aria-label={t('Aksi cepat', 'Quick actions')} className={cn('grid gap-2', links.length === 4 ? 'grid-cols-5' : 'grid-cols-4')}>
      <button type="button" onClick={onAdd} className={item}>
        <span className={cn(bubble, 'bg-primary text-primary-foreground ring-0')}>
          <Plus className="h-5 w-5" />
        </span>
        {t('Catat', 'Add')}
      </button>
      {links.map(({ href, icon: Icon, label }) => (
        <Link key={href} href={href} className={item}>
          <span className={cn(bubble, 'text-primary')}>
            <Icon className="h-5 w-5" />
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}

const ACCOUNT_ICON: Record<Account['type'], string> = { bank: 'Landmark', ewallet: 'Smartphone', cash: 'Banknote' };

/** Accounts as a sideways-scrolling row of cards. */
export function AccountStrip({ accounts, hidden }: { accounts: Account[]; hidden: boolean }) {
  const { t } = useT();
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t('Akun', 'Accounts')}</h2>
        <Link href="/accounts" className="text-sm text-muted-foreground hover:text-foreground">
          {t('Kelola', 'Manage')}
        </Link>
      </div>
      <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {accounts.map((a) => (
          <Link
            key={a.id}
            href={`/transactions?accountId=${a.id}`}
            className="w-36 shrink-0 snap-start space-y-2 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border transition-transform active:scale-95"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CategoryIcon name={ACCOUNT_ICON[a.type]} className="h-4 w-4" />
            </span>
            <span className="block truncate text-xs text-muted-foreground">{a.name}</span>
            <span className="block truncate text-sm font-semibold tabular-nums">
              {hidden ? HIDDEN : formatMoney(a.currentBalance ?? a.openingBalance)}
            </span>
          </Link>
        ))}
        <Link
          href="/accounts"
          className="flex w-24 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl border border-dashed text-xs text-muted-foreground transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {t('Tambah', 'Add')}
        </Link>
      </div>
    </section>
  );
}
