'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { formatIDR } from '@/lib/currency';
import {
  DashboardKPIs,
  CategorySpend,
  Account,
  Transaction,
  Budget,
  Category,
} from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import TransactionForm, {
  TransactionFormValues,
} from '@/components/transactions/transaction-form';
import { toast } from 'sonner';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { currentMonth, formatDate, shiftMonth } from '@/lib/date';
import { keysToCamel } from '@/lib/case';
import {
  refreshActiveAccounts,
  saveTransaction,
  toOfflineTransaction,
  toTransactionPayload,
} from '@/lib/transactions-client';
import { useOffline } from '@/hooks/use-offline';

export default function DashboardPage() {
  const {
    user,
    accounts,
    categories,
    transactions,
    budgets,
    setAccounts,
    setTransactions,
    setBudgets,
    setCategories,
    loading,
    setLoading,
  } = useAppStore();
  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savings: 0,
  });
  const [prevKpis, setPrevKpis] = useState<DashboardKPIs>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savings: 0,
  });
  const [categorySpends, setCategorySpends] = useState<CategorySpend[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const { isOnline, addOfflineChange } = useOffline();

  // Throws on failure so the form keeps the user's input and shows the error.
  const handleSave = async (values: TransactionFormValues) => {
    const payload = toTransactionPayload(values);

    if (!isOnline) {
      setTransactions([toOfflineTransaction(payload, user?.id || ''), ...transactions]);
      await addOfflineChange('create', 'transactions', payload);
      toast.success('Transaction saved offline');
      setFormOpen(false);
      return;
    }

    const tx = await saveTransaction(payload);
    setTransactions([tx, ...transactions]);
    if (user) await refreshActiveAccounts(user.id);
    toast.success('Transaction created');
    setFormOpen(false);
  };

  useEffect(() => {
    if (!user || !isOnline) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch accounts
        const { data: accountsData } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('archived', false);

        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id);

        // Fetch transactions (last 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const { data: transactionsData } = await supabase
          .from('transactions')
          .select(`
            *,
            account:accounts!transactions_account_id_fkey(name, type),
            from_account:accounts!transactions_from_account_id_fkey(name, type),
            to_account:accounts!transactions_to_account_id_fkey(name, type),
            category:categories(name, color, icon)
          `)
          .eq('user_id', user.id)
          .gte('actual_date', formatDate(threeMonthsAgo))
          .order('actual_date', { ascending: false });

        // Fetch budgets (current month)
        const { data: budgetsData } = await supabase
          .from('budgets')
          .select(
            `*, items:budget_items(*, category:categories(*))`
          )
          .eq('user_id', user.id)
          .eq('month', currentMonth());

        if (accountsData) setAccounts(keysToCamel<Account[]>(accountsData));
        if (categoriesData) setCategories(keysToCamel<Category[]>(categoriesData));
        if (transactionsData) setTransactions(keysToCamel<Transaction[]>(transactionsData));
        if (budgetsData) setBudgets(keysToCamel<Budget[]>(budgetsData));

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    user,
    isOnline,
    setAccounts,
    setTransactions,
    setBudgets,
    setCategories,
    setLoading,
  ]);

  useEffect(() => {
    if (!accounts.length) return;

    // Calculate KPIs. Timeline rule: months follow actual_date in Jakarta
    // time, the same as the charts and /api/dashboard.
    const thisMonth = currentMonth();
    const prevMonth = shiftMonth(thisMonth, -1);
    const inMonth = (t: Transaction, month: string) =>
      t.actualDate.startsWith(month);

    // Total balance taken from accounts to avoid missing older transactions
    const totalBalance = accounts.reduce(
      (sum, acc) => sum + (acc.currentBalance ?? acc.openingBalance),
      0
    );

    // Monthly budget and actual
    const currentBudgets = budgets.filter(b => b.month === thisMonth);

    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && inMonth(t, thisMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && inMonth(t, thisMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = monthlyIncome - monthlyExpenses;

    const prevMonthlyIncome = transactions
      .filter(t => t.type === 'income' && inMonth(t, prevMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    const prevMonthlyExpenses = transactions
      .filter(t => t.type === 'expense' && inMonth(t, prevMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    const prevSavings = prevMonthlyIncome - prevMonthlyExpenses;

    // Previous total balance is current balance minus this month's net change
    const prevTotalBalance =
      totalBalance - (monthlyIncome - monthlyExpenses);

    setKpis({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savings,
    });
    setPrevKpis({
      totalBalance: prevTotalBalance,
      monthlyIncome: prevMonthlyIncome,
      monthlyExpenses: prevMonthlyExpenses,
      savings: prevSavings,
    });
    const mergeBudget = (categoryMap: Map<string, CategorySpend>) => {
      currentBudgets.forEach(b =>
        (b.items || []).forEach(item => {
          const existing = categoryMap.get(item.categoryId);
          if (existing) {
            existing.budgeted = item.amount;
          } else {
            categoryMap.set(item.categoryId, {
              categoryId: item.categoryId,
              categoryName: item.category?.name || 'Unknown',
              amount: 0,
              budgeted: item.amount,
              color: item.category?.color || '#6B7280',
            });
          }
        })
      );
    };

    const buildLocalCategories = () => {
      const categoryMap = new Map<string, CategorySpend>();
      transactions
        .filter(
          t => t.type === 'expense' && inMonth(t, thisMonth)
        )
        .forEach(t => {
          if (!t.categoryId || !t.category) return;
          const existing = categoryMap.get(t.categoryId);
          if (existing) {
            existing.amount += t.amount;
          } else {
            categoryMap.set(t.categoryId, {
              categoryId: t.categoryId,
              categoryName: t.category.name,
              amount: t.amount,
              budgeted: 0,
              color: t.category.color || '#6B7280',
            });
          }
        });
      mergeBudget(categoryMap);
      return categoryMap;
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch(`/api/dashboard?month=${thisMonth}`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        const categoryMap = new Map<string, CategorySpend>();
        (data.categories || []).forEach((c: any) => {
          categoryMap.set(c.categoryId, {
            categoryId: c.categoryId,
            categoryName: c.name,
            amount: c.amount,
            budgeted: 0,
            color: c.color || '#6B7280',
          });
        });
        mergeBudget(categoryMap);
        setCategorySpends(Array.from(categoryMap.values()));
      } catch {
        const categoryMap = buildLocalCategories();
        setCategorySpends(Array.from(categoryMap.values()));
      }
    };

    if (isOnline) {
      fetchCategories();
    } else {
      const categoryMap = buildLocalCategories();
      setCategorySpends(Array.from(categoryMap.values()));
    }
  }, [accounts, transactions, budgets, isOnline]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const summaryCards = [
    {
      title: 'Total Balance',
      value: formatIDR(kpis.totalBalance),
      icon: Wallet,
      delta: kpis.totalBalance - prevKpis.totalBalance,
      prev: prevKpis.totalBalance,
    },
    {
      title: 'Monthly Income',
      value: formatIDR(kpis.monthlyIncome),
      icon: TrendingUp,
      delta: kpis.monthlyIncome - prevKpis.monthlyIncome,
      prev: prevKpis.monthlyIncome,
    },
    {
      title: 'Monthly Expenses',
      value: formatIDR(kpis.monthlyExpenses),
      icon: TrendingDown,
      delta: kpis.monthlyExpenses - prevKpis.monthlyExpenses,
      prev: prevKpis.monthlyExpenses,
    },
    {
      title: 'Savings',
      value: formatIDR(kpis.savings),
      icon: DollarSign,
      delta: kpis.savings - prevKpis.savings,
      prev: prevKpis.savings,
    },
  ];

  return (
    <div className="relative space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Good Morning{user?.name ? `, ${user.name}` : ''}
          </h2>
          <p className="text-muted-foreground">
            Here is your financial overview
          </p>
        </div>
        <Button
          className="hidden md:inline-flex"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> New Transaction
        </Button>
      </div>

      {/* Tombol add transaction di mobile view dihilangkan karena sudah ada di mobile nav */}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => {
          const deltaPct = card.prev
            ? ((card.delta / card.prev) * 100).toFixed(2)
            : '0.00';
          const positive = card.delta >= 0;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <CardDescription>This Month</CardDescription>
                </div>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
                <p className="flex items-center text-xs mt-1">
                  {positive ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={positive ? 'text-green-500' : 'text-red-500'}
                  >
                    {deltaPct}%
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    vs last month
                  </span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <DashboardCharts
        transactions={transactions}
        categorySpends={categorySpends}
      />

      {/* Recent Transactions */}
      <RecentTransactions
        transactions={transactions}
        accounts={accounts}
        categories={categories}
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