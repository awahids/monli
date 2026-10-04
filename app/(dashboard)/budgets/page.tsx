'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PiggyBank, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { formatMoney } from '@/lib/currency';
import { currentMonth } from '@/lib/date';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { BudgetDetailDialog, budgetStatus } from '@/components/budgets/budget-detail-dialog';
import { BudgetFormDialog } from '@/components/budgets/budget-form-dialog';

type BudgetSummary = {
  id: string;
  month: string;
  planned: number;
  actual: number;
};

export default function BudgetsPage() {
  const { user } = useAppStore();

  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('all');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const disableAdd = user?.plan === 'FREE' && budgets.length >= 2;
  const thisMonth = currentMonth();

  // Planned vs actual is computed on the server (actual by budget_month), so
  // the numbers no longer depend on which transactions happen to be cached.
  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/budgets?year=all&pageSize=240');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch budgets');
      setBudgets(data.data ?? []);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
      toast.error('Gagal memuat budget');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const years = Array.from(new Set(budgets.map((b) => b.month.slice(0, 4)))).sort().reverse();
  const filteredBudgets = budgets.filter((b) => year === 'all' || b.month.startsWith(year));
  const hasThisMonth = budgets.some((b) => b.month === thisMonth);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Budget</h1>
          <p className="text-sm text-muted-foreground">Batas belanja bulanan dan seberapa banyak yang sudah terpakai.</p>
        </div>
        <div className="flex gap-2">
          {years.length > 1 && (
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua tahun</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!disableAdd && (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="mr-1 h-4 w-4" /> Buat budget
            </Button>
          )}
        </div>
      </div>

      {disableAdd && (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          Paket FREE dibatasi 2 budget.{' '}
          <Link href="/upgrade" className="font-medium text-primary underline-offset-4 hover:underline">
            Upgrade ke PRO
          </Link>{' '}
          untuk budget tanpa batas.
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Memuat budget">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Belum ada budget"
          description="Buat budget bulanan, atau isi otomatis dari pengeluaran bulan lalu."
          action={
            !disableAdd && (
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="mr-1 h-4 w-4" /> Buat budget pertama
              </Button>
            )
          }
        />
      ) : (
        <>
          {!hasThisMonth && !disableAdd && (
            <Card className="flex flex-col gap-3 border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                Belum ada budget untuk{' '}
                <span className="font-medium capitalize">
                  {format(new Date(`${thisMonth}-01T00:00:00`), 'MMMM yyyy', { locale: localeId })}
                </span>
                .
              </p>
              <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
                Buat budget bulan ini
              </Button>
            </Card>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBudgets.map((b) => {
              const status = budgetStatus(b.actual, b.planned);
              const pct = b.planned ? Math.min((b.actual / b.planned) * 100, 100) : 0;
              const remaining = b.planned - b.actual;
              return (
                <Card key={b.id} className="transition-colors hover:bg-muted/40">
                  <button
                    type="button"
                    onClick={() => setSelectedBudgetId(b.id)}
                    className="w-full space-y-3 p-4 text-left"
                    aria-label={`Lihat detail budget ${b.month}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-semibold capitalize">
                        {format(new Date(`${b.month}-01T00:00:00`), 'MMMM yyyy', { locale: localeId })}
                        {b.month === thisMonth && (
                          <span className="ml-2 align-middle text-xs font-normal text-muted-foreground">bulan ini</span>
                        )}
                      </span>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.badge)}>
                        {status.label}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" indicatorClassName={status.bar} />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatMoney(b.actual)} / {formatMoney(b.planned)}
                      </span>
                      <span
                        className={cn(
                          'font-medium tabular-nums',
                          remaining < 0 && 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {remaining >= 0 ? `Sisa ${formatMoney(remaining)}` : `Lewat ${formatMoney(-remaining)}`}
                      </span>
                    </div>
                  </button>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <BudgetDetailDialog
        budgetId={selectedBudgetId}
        open={selectedBudgetId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBudgetId(null);
        }}
        onChanged={fetchBudgets}
      />
      <BudgetFormDialog open={isAdding} onOpenChange={setIsAdding} onCreated={fetchBudgets} />
    </div>
  );
}
