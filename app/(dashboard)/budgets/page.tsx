'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { formatIDR } from '@/lib/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      toast.error('Gagal memuat anggaran');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const years = Array.from(
    new Set(budgets.map((b) => b.month.slice(0, 4)))
  ).sort();
  const filteredBudgets = budgets.filter(
    (b) => year === 'all' || b.month.startsWith(year)
  );

  const getBudgetTotals = (budget: BudgetSummary) => {
    const { planned, actual } = budget;
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
    setSelectedBudgetId(id);
  };

  // Card versi mobile/tablet, dengan tombol view lebih besar dan mudah diakses
  const renderBudgetCard = (budget: BudgetSummary) => {
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
            <span>Detail</span>
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
          <div>
            <Button
              onClick={() => setIsAdding(true)}
              className="flex w-full items-center gap-1 sm:w-auto"
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
      {filteredBudgets.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="font-medium">Belum ada anggaran</p>
            <p className="text-sm text-muted-foreground">
              Buat anggaran bulanan untuk memantau pengeluaranmu.
            </p>
            {!disableAdd && (
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="mr-1 h-4 w-4" /> Buat Anggaran
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:hidden">
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

      <BudgetDetailDialog
        budgetId={selectedBudgetId}
        open={selectedBudgetId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBudgetId(null);
        }}
        onChanged={fetchBudgets}
      />
      <BudgetFormDialog
        open={isAdding}
        onOpenChange={setIsAdding}
        onCreated={fetchBudgets}
      />
    </div>
  );
}
