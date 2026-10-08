'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { runDueRecurring } from '@/lib/recurring-client';
import { supabase } from '@/lib/supabase';
import { Account, Budget, Category, Transaction } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/lib/date';
import { keysToCamel } from '@/lib/case';
import { greeting, monthTotals } from '@/lib/dashboard';
import {
  saveTransaction,
  toOfflineTransaction,
  toTransactionPayload,
} from '@/lib/transactions-client';
import { useOffline } from '@/hooks/use-offline';
import { selectAll } from '@/lib/select-all';
import { useT } from '@/lib/i18n';
import { spacePlan } from '@/lib/plans';
import { AccountStrip, BalanceHero, QuickActions, useHiddenBalance } from '@/components/dashboard/home-sections';

type BudgetSummary = { totalActual: number };

function DashboardSkeleton() {
  const { t } = useT();
  return (
    <div className="space-y-6" aria-busy="true" aria-label={t('Memuat dashboard', 'Loading dashboard')}>
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-52 rounded-3xl" />
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mx-auto h-12 w-12 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
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
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const { isOnline, addOfflineChange } = useOffline();
  const { t, locale } = useT();
  const [hidden, toggleHidden] = useHiddenBalance();

  // Everything here follows the budget period, which may start on payday
  // (e.g. 26 Sep – 25 Oct is "October"), so KPIs, charts and the budget card agree.
  const budgetStartDay = user?.budgetStartDay || 1;
  const budgetMonth = currentBudgetMonth(budgetStartDay);
  const thisMonth = budgetMonth;
  const range = periodRange(thisMonth, budgetStartDay, locale);

  // Throws on failure so the form keeps the user's input and shows the error.
  const handleSave = async (values: TransactionFormValues) => {
    const payload = toTransactionPayload(values);

    if (!isOnline) {
      setTransactions([toOfflineTransaction(payload, space?.ownerId ?? user?.id ?? ''), ...transactions]);
      await addOfflineChange('create', 'transactions', payload);
      toast.success(t('Transaksi disimpan offline, akan disinkronkan saat online', 'Transaction saved offline, will sync when online'));
      setFormOpen(false);
      return;
    }

    // Saving bumps dataVersion, which reloads balances and totals below.
    await saveTransaction(payload);
    toast.success(t('Transaksi tersimpan', 'Transaction saved'));
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
              .eq('budget_month', thisMonth)
              .order('actual_date', { ascending: false })
              .order('created_at', { ascending: false })
              .order('id')
              .range(from, to)
          ),
          supabase
            .from('budgets')
            .select(`*, carry, items:budget_items(*, category:categories(*))`)
            .eq('user_id', (space?.ownerId ?? user.id))
            .eq('month', budgetMonth),
        ]);

        if (accountsRes.data) setAccounts(keysToCamel<Account[]>(accountsRes.data));
        if (categoriesRes.data) setCategories(keysToCamel<Category[]>(categoriesRes.data));
        if (transactionsRes.data) setTransactions(keysToCamel<Transaction[]>(transactionsRes.data));
        if (budgetsRes.data) setBudgets(keysToCamel<Budget[]>(budgetsRes.data));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error(t('Gagal memuat data dashboard', 'Could not load the dashboard'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [space?.ownerId, user, isOnline, thisMonth, budgetMonth, dataVersion, setAccounts, setTransactions, setBudgets, setCategories, t]);

  // Budget actuals come from the server so they match Reports and Budgets exactly.
  useEffect(() => {
    if (!user || !isOnline) return;
    let cancelled = false;
    fetch(`/api/dashboard?month=${thisMonth}&budgetMonth=${budgetMonth}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (cancelled) return;
        setBudgetSummary({ totalActual: data.budget?.totalActual ?? 0 });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, isOnline, thisMonth, budgetMonth, transactions]);

  const kpis = useMemo(() => {
    const now = monthTotals(transactions, thisMonth);
    const totalBalance = accounts.reduce(
      (sum, acc) => sum + (acc.currentBalance ?? acc.openingBalance),
      0
    );
    return { now, totalBalance };
  }, [transactions, accounts, thisMonth]);

  const budget = budgets.find((b) => b.month === budgetMonth);
  const budgetCard = useMemo(() => {
    if (!budget) return null;
    const planned = budget.totalAmount + (budget.carry ?? 0);
    const actual = budgetSummary?.totalActual ?? 0;
    const remaining = planned - actual;
    const { end } = budgetPeriod(budgetMonth, budgetStartDay);
    const daysLeft = Math.max(daysBetweenInclusive(formatDate(new Date()), end), 1);
    return {
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
        <h1 className="text-lg font-semibold">
          {greeting(new Date(), t)}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-xs text-muted-foreground">
          {space && !space.isOwn
            ? t(`Keuangan bersama ${space.ownerName}`, `Shared finances of ${space.ownerName}`)
            : t('Keuanganmu', 'Your finances')}{' '}
          {range ? t(`periode ${range}`, `for ${range}`) : t('bulan ini', 'this month')}
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

      <BalanceHero
        balance={kpis.totalBalance}
        income={kpis.now.income}
        expense={kpis.now.expense}
        budget={budgetCard}
        hidden={hidden}
        onToggleHidden={toggleHidden}
      />

      <QuickActions isPro={spacePlan(user, space) === 'PRO'} onAdd={() => setFormOpen(true)} />

      {accounts.length > 0 && <AccountStrip accounts={accounts} hidden={hidden} />}

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
