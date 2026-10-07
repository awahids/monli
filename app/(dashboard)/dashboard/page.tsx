'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { useAppStore } from '@/lib/store';
import { runDueRecurring } from '@/lib/recurring-client';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/currency';
import { Account, Budget, Category, CategorySpend, Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { GettingStarted } from '@/components/dashboard/getting-started';
import { GoalsSummary } from '@/components/dashboard/goals-summary';
import TransactionForm, {
  TransactionFormValues,
} from '@/components/transactions/transaction-form';
import {
  budgetPeriod,
  currentBudgetMonth,
  daysBetweenInclusive,
  formatDate,
  periodRange,
  shiftMonth,
} from '@/lib/date';
import { keysToCamel } from '@/lib/case';
import { greeting, monthDelta, monthTotals, type Delta } from '@/lib/dashboard';
import {
  saveTransaction,
  toOfflineTransaction,
  toTransactionPayload,
} from '@/lib/transactions-client';
import { useOffline } from '@/hooks/use-offline';
import { cn } from '@/lib/utils';
import { selectAll } from '@/lib/select-all';

// The chart library is large; load it after the numbers are on screen.
const DashboardCharts = dynamic(
  () => import('@/components/dashboard/dashboard-charts').then((m) => m.DashboardCharts),
  { ssr: false, loading: () => <Skeleton className="h-80 rounded-xl" /> }
);

type BudgetSummary = { totalActual: number };

function DeltaLine({ delta }: { delta: Delta }) {
  const Icon = delta.direction === 'up' ? ArrowUpRight : delta.direction === 'down' ? ArrowDownRight : Minus;
  return (
    <p
      className={cn(
        'mt-1 flex items-center gap-1 text-xs',
        delta.tone === 'good' && 'text-green-600 dark:text-green-400',
        delta.tone === 'bad' && 'text-red-600 dark:text-red-400',
        delta.tone === 'neutral' && 'text-muted-foreground'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {delta.label}
    </p>
  );
}

function KpiCard({
  title,
  icon: Icon,
  value,
  children,
  half = false,
}: {
  title: string;
  icon: typeof Wallet;
  value: string;
  children?: React.ReactNode;
  /** Half-width tile in the two-column grid. */
  half?: boolean;
}) {
  return (
    <Card className={half ? undefined : 'col-span-2'}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={cn('truncate font-display font-bold tabular-nums', half ? 'text-lg' : 'text-2xl')}>{value}</div>
        {children}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat dashboard">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className={cn('h-32 rounded-xl', (i === 0 || i === 3) && 'col-span-2')} />
        ))}
      </div>
      <div className="grid gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    user,
    space,
    setUser,
    accounts,
    categories,
    transactions,
    budgets,
    setAccounts,
    setTransactions,
    setBudgets,
    setCategories,
    dataVersion,
  } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [categorySpends, setCategorySpends] = useState<CategorySpend[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const { isOnline, addOfflineChange } = useOffline();

  // Everything here follows the budget period, which may start on payday
  // (e.g. 26 Sep – 25 Oct is "October"), so KPIs, charts and the budget card agree.
  const budgetStartDay = user?.budgetStartDay || 1;
  const budgetMonth = currentBudgetMonth(budgetStartDay);
  const thisMonth = budgetMonth;
  const prevMonth = shiftMonth(thisMonth, -1);
  const range = periodRange(thisMonth, budgetStartDay);

  // Throws on failure so the form keeps the user's input and shows the error.
  const handleSave = async (values: TransactionFormValues) => {
    const payload = toTransactionPayload(values);

    if (!isOnline) {
      setTransactions([toOfflineTransaction(payload, space?.ownerId ?? user?.id ?? ''), ...transactions]);
      await addOfflineChange('create', 'transactions', payload);
      toast.success('Transaksi disimpan offline, akan disinkronkan saat online');
      setFormOpen(false);
      return;
    }

    // Saving bumps dataVersion, which reloads balances and totals below.
    await saveTransaction(payload);
    toast.success('Transaksi tersimpan');
    setFormOpen(false);
  };

  useEffect(() => {
    if (!user) return;
    if (!isOnline) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Record due recurring transactions first so they show up below.
        await runDueRecurring();

        const [accountsRes, categoriesRes, transactionsRes, budgetsRes] = await Promise.all([
          supabase.from('accounts').select('*').eq('user_id', (space?.ownerId ?? user.id)).eq('archived', false),
          supabase.from('categories').select('*').eq('user_id', (space?.ownerId ?? user.id)),
          // All rows: the month totals above are summed from this list.
          selectAll((from, to) =>
            supabase
              .from('transactions')
              .select(`
                *,
                account:accounts!transactions_account_id_fkey(name, type),
                from_account:accounts!transactions_from_account_id_fkey(name, type),
                to_account:accounts!transactions_to_account_id_fkey(name, type),
                category:categories(name, color, icon)
              `)
              .eq('user_id', (space?.ownerId ?? user.id))
              // This period and the one before, for the comparison.
              .in('budget_month', [prevMonth, thisMonth])
              .order('actual_date', { ascending: false })
              .order('created_at', { ascending: false })
              .order('id')
              .range(from, to)
          ),
          supabase
            .from('budgets')
            .select(`*, items:budget_items(*, category:categories(*))`)
            .eq('user_id', (space?.ownerId ?? user.id))
            .eq('month', budgetMonth),
        ]);

        if (accountsRes.data) setAccounts(keysToCamel<Account[]>(accountsRes.data));
        if (categoriesRes.data) setCategories(keysToCamel<Category[]>(categoriesRes.data));
        if (transactionsRes.data) setTransactions(keysToCamel<Transaction[]>(transactionsRes.data));
        if (budgetsRes.data) setBudgets(keysToCamel<Budget[]>(budgetsRes.data));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Gagal memuat data dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [space?.ownerId, user, isOnline, thisMonth, prevMonth, budgetMonth, dataVersion, setAccounts, setTransactions, setBudgets, setCategories]);

  // Category breakdown and budget actuals come from the server so they match
  // Reports and Budgets exactly.
  useEffect(() => {
    if (!user || !isOnline) return;
    let cancelled = false;
    fetch(`/api/dashboard?month=${thisMonth}&budgetMonth=${budgetMonth}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (cancelled) return;
        setCategorySpends(
          (data.categories ?? []).map((c: { categoryId: string; name: string; amount: number; color: string }) => ({
            categoryId: c.categoryId,
            categoryName: c.name,
            amount: c.amount,
            budgeted: 0,
            color: c.color || '#6B7280',
          }))
        );
        setBudgetSummary({ totalActual: data.budget?.totalActual ?? 0 });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, isOnline, thisMonth, budgetMonth, transactions]);

  const kpis = useMemo(() => {
    const now = monthTotals(transactions, thisMonth);
    const prev = monthTotals(transactions, prevMonth);
    const totalBalance = accounts.reduce(
      (sum, acc) => sum + (acc.currentBalance ?? acc.openingBalance),
      0
    );
    return { now, prev, totalBalance, net: now.income - now.expense };
  }, [transactions, accounts, thisMonth, prevMonth]);

  const budget = budgets.find((b) => b.month === budgetMonth);
  const budgetCard = useMemo(() => {
    if (!budget) return null;
    const planned = budget.totalAmount;
    const actual = budgetSummary?.totalActual ?? 0;
    const remaining = planned - actual;
    const { end } = budgetPeriod(budgetMonth, budgetStartDay);
    const daysLeft = Math.max(daysBetweenInclusive(formatDate(new Date()), end), 1);
    return {
      planned,
      actual,
      remaining,
      daily: Math.max(remaining, 0) / daysLeft,
      daysLeft,
      pct: planned > 0 ? Math.min((actual / planned) * 100, 100) : 0,
      over: remaining < 0,
    };
  }, [budget, budgetSummary, budgetMonth, budgetStartDay]);

  const showOnboarding = Boolean(user && !user.onboardingCompleted);
  const completeOnboarding = async () => {
    if (!user) return;
    setUser({ ...user, onboardingCompleted: true });
    await fetch('/api/onboarding/complete', { method: 'POST' }).catch(() => {});
  };
  const onboardingDone = accounts.length > 0 && transactions.length > 0 && budgets.length > 0;
  useEffect(() => {
    if (showOnboarding && onboardingDone && !loading) completeOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnboarding, onboardingDone, loading]);

  if (loading) return <DashboardSkeleton />;

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-muted-foreground">
            {space && !space.isOwn ? `Ringkasan keuangan bersama ${space.ownerName}` : 'Ringkasan keuanganmu'}{' '}
            {range ? `periode ${range}.` : 'bulan ini.'}
          </p>
      </div>

      {showOnboarding && (
        <GettingStarted
          hasAccount={accounts.length > 0}
          hasTransaction={transactions.length > 0}
          hasBudget={budgets.length > 0}
          onAddTransaction={() => setFormOpen(true)}
          onDismiss={completeOnboarding}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <KpiCard title="Saldo total" icon={Wallet} value={formatMoney(kpis.totalBalance)}>
          <p className="mt-1 text-xs text-muted-foreground">
            {accounts.length} akun aktif · arus bersih bulan ini{' '}
            <span
              className={cn(
                'font-medium',
                kpis.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {kpis.net >= 0 ? '+' : ''}
              {formatMoney(kpis.net)}
            </span>
          </p>
        </KpiCard>
        <KpiCard half title="Pemasukan" icon={TrendingUp} value={formatMoney(kpis.now.income)}>
          <DeltaLine delta={monthDelta(kpis.now.income, kpis.prev.income, true)} />
        </KpiCard>
        <KpiCard half title="Pengeluaran" icon={TrendingDown} value={formatMoney(kpis.now.expense)}>
          <DeltaLine delta={monthDelta(kpis.now.expense, kpis.prev.expense, false)} />
        </KpiCard>
        {budgetCard ? (
          <KpiCard
            title={budgetCard.over ? 'Budget terlampaui' : 'Sisa budget'}
            icon={PiggyBank}
            value={formatMoney(Math.abs(budgetCard.remaining))}
          >
            <Progress
              value={budgetCard.pct}
              className="mt-2 h-1.5"
              indicatorClassName={
                budgetCard.over ? 'bg-red-500' : budgetCard.pct >= 80 ? 'bg-amber-500' : 'bg-primary'
              }
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {budgetCard.over
                ? `Lebih ${formatMoney(-budgetCard.remaining)} dari rencana ${formatMoney(budgetCard.planned)}`
                : `Jatah harian ${formatMoney(budgetCard.daily)} untuk ${budgetCard.daysLeft} hari lagi`}
            </p>
          </KpiCard>
        ) : (
          <Card className="col-span-2 flex flex-col justify-center border-dashed">
            <CardContent className="space-y-2 pt-6">
              <p className="text-sm font-medium">Belum ada budget bulan ini</p>
              <p className="text-xs text-muted-foreground">
                Tentukan batas belanja supaya tahu jatah harianmu.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/budgets">Buat budget</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <DashboardCharts
        transactions={transactions}
        categorySpends={categorySpends}
        month={thisMonth}
        startDay={budgetStartDay}
      />

      {isOnline && <GoalsSummary />}

      <RecentTransactions
        transactions={transactions}
        onAdd={accounts.length ? () => setFormOpen(true) : undefined}
      />

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        accounts={accounts}
        categories={categories}
        onSubmit={handleSave}
      />
    </div>
  );
}
