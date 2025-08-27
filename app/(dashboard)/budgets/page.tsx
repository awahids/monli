'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';

import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { formatIDR } from '@/lib/currency';
import { Budget, Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { BudgetDetailDialog } from '@/components/budgets/budget-detail-dialog';
import { BudgetFormDialog } from '@/components/budgets/budget-form-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const toCamel = (str: string) =>
  str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function keysToCamel<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v)) as any;
  }
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[toCamel(key)] = keysToCamel(value);
    }
    return result as T;
  }
  return obj as T;
}

export default function BudgetsPage() {
  const {
    user,
    budgets,
    transactions,
    setBudgets,
    setTransactions,
    loading,
    setLoading,
    getMonthlySpending,
  } = useAppStore();

  const [year, setYear] = useState('all');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const disableAdd = user?.plan === 'FREE' && budgets.length >= 2;
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: budgetsData } = await supabase
          .from('budgets')
          .select(
            `*, items:budget_items(*, category:categories(*))`
          )
          .eq('user_id', user.id);
        if (budgetsData) setBudgets(keysToCamel<Budget[]>(budgetsData));

        if (!transactions.length) {
          const { data: transactionsData } = await supabase
            .from('transactions')
            .select(
              `
              *,
              account:accounts!transactions_account_id_fkey(name, type),
              from_account:accounts!transactions_from_account_id_fkey(name, type),
              to_account:accounts!transactions_to_account_id_fkey(name, type),
              category:categories(name, color, icon)
            `
            )
            .eq('user_id', user.id);
          if (transactionsData)
            setTransactions(keysToCamel<Transaction[]>(transactionsData));
        }
      } catch (error) {
        console.error('Failed to fetch budgets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, setBudgets, setTransactions, transactions.length, setLoading]);

  const years = Array.from(
    new Set(budgets.map((b) => b.month.slice(0, 4)))
  ).sort();
  const filteredBudgets = budgets.filter(
    (b) => year === 'all' || b.month.startsWith(year)
  );

  const getBudgetTotals = (budget: Budget) => {
    const planned = budget.totalAmount;
    const actual = getMonthlySpending(budget.month);
    const progress = planned ? (actual / planned) * 100 : 0;
    const indicatorColor =
      progress < 70
        ? 'bg-green-500'
        : progress <= 100
        ? 'bg-orange-500'
        : 'bg-red-500';
    return { planned, actual, progress, indicatorColor };
  };

  const openBudgetDetail = (id: string) => {
    if (user?.plan !== 'PRO') {
      router.push('/upgrade');
      return;
    }
    setSelectedBudgetId(id);
  };

  // Card versi mobile/tablet, dengan tombol view lebih besar dan mudah diakses
  const renderBudgetCard = (budget: Budget) => {
    const { planned, actual, progress, indicatorColor } =
      getBudgetTotals(budget);

    return (
      <Card
        key={budget.id}
        className="bg-muted/50 hover:shadow-md transition-shadow flex flex-col"
      >
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">
              {format(new Date(`${budget.month}-01`), 'MMMM yyyy')}
            </CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openBudgetDetail(budget.id)}
            className="mt-2 sm:mt-0 w-full sm:w-auto flex items-center gap-1 transition-transform hover:scale-105"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden xs:inline">Lihat</span>
            <span className="inline xs:hidden">Detail</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Rencana</span>
            <span>{formatIDR(planned)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Terpakai</span>
            <span>{formatIDR(actual)}</span>
          </div>
          <Progress value={progress} indicatorClassName={indicatorColor} />
          <div className="text-right text-xs text-muted-foreground">
            {progress.toFixed(0)}%
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Anggaran
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Kelola anggaran bulanan Anda.
          </p>
        </div>
        {!disableAdd && (
          <div className="hidden md:block">
            <Button
              onClick={() => setIsAdding(true)}
              className="transition-transform hover:scale-105 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Buat Anggaran
            </Button>
          </div>
        )}
      </div>
      {disableAdd && (
        <p className="text-sm text-muted-foreground">
          Free plan limited to two budgets.{' '}
          <Link href="/upgrade" className="text-primary underline">
            Upgrade
          </Link>{' '}
          to create more.
        </p>
      )}

      <div className="flex gap-2 max-w-xs">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger>
            <SelectValue placeholder="Tahun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Responsive grid: 1 kolom di mobile, 2 di sm, 3 di md */}
      <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 md:hidden">
        {filteredBudgets.map((b) => renderBudgetCard(b))}
      </div>

      {/* Tabel hanya di md ke atas */}
      <div className="hidden md:block overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Bulan</TableHead>
              <TableHead className="text-right">Rencana</TableHead>
              <TableHead className="text-right">Terpakai</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBudgets.map((b) => {
              const { planned, actual, progress, indicatorColor } =
                getBudgetTotals(b);
              return (
                <TableRow key={b.id}>
                  <TableCell>
                    {format(new Date(`${b.month}-01`), 'MMMM yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatIDR(planned)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatIDR(actual)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={progress}
                        indicatorClassName={indicatorColor}
                        className="flex-1"
                      />
                      <span className="text-sm">{progress.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openBudgetDetail(b.id)}
                      className="flex items-center gap-1 transition-transform hover:scale-105"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Detail</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Tombol tambah di mobile, selalu fixed dan mudah dijangkau */}
      {!disableAdd && (
        <Button
          onClick={() => setIsAdding(true)}
          className={cn(
            'md:hidden fixed right-6 bottom-[calc(5rem+env(safe-area-inset-bottom))] h-14 w-14 rounded-full p-0 shadow-lg',
            'flex items-center justify-center bg-primary text-white transition-transform hover:scale-105'
          )}
          aria-label="Buat Anggaran"
        >
          <Plus className="h-7 w-7" />
        </Button>
      )}
      <BudgetDetailDialog
        budgetId={selectedBudgetId}
        open={selectedBudgetId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBudgetId(null);
        }}
      />
      <BudgetFormDialog open={isAdding} onOpenChange={setIsAdding} />
    </div>
  );
}
