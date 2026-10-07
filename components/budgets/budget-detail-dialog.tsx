'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { MoneyInput } from '@/components/ui/money-input';
import { ProLock } from '@/components/ui/pro-lock';
import { CategoryIcon } from '@/components/transactions/category-icon';

import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { formatMoney } from '@/lib/currency';
import { Budget, BudgetItem, Category } from '@/types';
import { keysToCamel } from '@/lib/case';
import { cn } from '@/lib/utils';
import { spacePlan } from '@/lib/plans';
import { getBudgetStartDay } from '@/lib/budget-period';
import { periodRange } from '@/lib/date';

type BudgetDetailDialogProps = {
  budgetId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after items change so the list can refresh its totals. */
  onChanged?: () => void;
};

const sumAmounts = (items: { amount: number }[]) => items.reduce((sum, i) => sum + i.amount, 0);

export type BudgetStatus = { label: string; badge: string; bar: string };

/** Aman < 80%, Hampir habis 80–100%, Lewat > 100%. */
export function budgetStatus(spent: number, planned: number): BudgetStatus {
  const pct = planned > 0 ? (spent / planned) * 100 : spent > 0 ? 101 : 0;
  if (pct > 100)
    return { label: 'Lewat', badge: 'bg-red-500/15 text-red-700 dark:text-red-300', bar: 'bg-red-500' };
  if (pct >= 80)
    return { label: 'Hampir habis', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' };
  return { label: 'Aman', badge: 'bg-green-500/15 text-green-700 dark:text-green-300', bar: 'bg-primary' };
}

export function BudgetDetailDialog({
  budgetId,
  open,
  onOpenChange,
  onChanged,
}: BudgetDetailDialogProps) {
  const { user, space, categories, setCategories } = useAppStore();

  const [budget, setBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [actuals, setActuals] = useState<Record<string, number>>({});
  const [totalSpent, setTotalSpent] = useState(0);
  // Part of the total not tied to a category (the buffer picked when the
  // budget was made); kept as is when category limits change.
  const [buffer, setBuffer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newAmount, setNewAmount] = useState(0);
  const isPro = spacePlan(user, space) === 'PRO';

  // Always load the budget fresh (with items) and get spending from the
  // server, attributed by budget_month. FREE users get the same data shown
  // blurred behind an upgrade prompt.
  useEffect(() => {
    if (!budgetId || !user) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: budgetData, error } = await supabase
          .from('budgets')
          .select(`*, items:budget_items(*, category:categories(*))`)
          .eq('user_id', (space?.ownerId ?? user.id))
          .eq('id', budgetId)
          .single();
        if (error || !budgetData) throw error ?? new Error('Budget not found');
        const fetchedBudget = keysToCamel<Budget>(budgetData);

        const [reportRes, categoriesData] = await Promise.all([
          fetch(`/api/reports/monthly?month=${fetchedBudget.month}`).then((r) => r.json()),
          useAppStore.getState().categories.length
            ? Promise.resolve(null)
            : supabase
                .from('categories')
                .select('*')
                .eq('user_id', (space?.ownerId ?? user.id))
                .then(({ data }) => data),
        ]);
        if (cancelled) return;

        setBudget(fetchedBudget);
        setItems(fetchedBudget.items || []);
        setBuffer(Math.max(fetchedBudget.totalAmount - sumAmounts(fetchedBudget.items || []), 0));
        const map: Record<string, number> = {};
        (reportRes.data ?? []).forEach((row: { categoryId: string; actual: number }) => {
          map[row.categoryId] = row.actual;
        });
        setActuals(map);
        setTotalSpent(reportRes.totalActual ?? 0);
        if (categoriesData) setCategories(keysToCamel<Category[]>(categoriesData));
      } catch (error) {
        console.error('Failed to fetch budget:', error);
        toast.error('Gagal memuat budget');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [space?.ownerId, budgetId, user, setCategories]);

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setBudget(null);
    }
  }, [open]);

  const totalBudget = budget?.totalAmount ?? 0;
  const overall = budgetStatus(totalSpent, totalBudget);
  const remaining = totalBudget - totalSpent;

  const availableCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense' && !items.some((i) => i.categoryId === c.id)),
    [categories, items]
  );

  /** The total is the category limits plus the buffer, so it follows every change. */
  const saveTotal = async (nextItems: BudgetItem[]) => {
    if (!budget) return;
    const totalAmount = buffer + sumAmounts(nextItems);
    if (totalAmount === budget.totalAmount) return;
    const { error } = await supabase.from('budgets').update({ total_amount: totalAmount }).eq('id', budget.id);
    if (error) {
      toast.error('Gagal menyimpan total budget');
      return;
    }
    setBudget({ ...budget, totalAmount });
  };

  const handleUpdateItem = async (itemId: string, amount: number) => {
    const { error } = await supabase.from('budget_items').update({ amount }).eq('id', itemId);
    if (error) {
      toast.error('Gagal menyimpan batas kategori');
      return;
    }
    await saveTotal(items);
    onChanged?.();
  };

  const handleRemoveItem = async (itemId: string) => {
    const { error } = await supabase.from('budget_items').delete().eq('id', itemId);
    if (error) {
      toast.error('Gagal menghapus kategori');
      return;
    }
    const next = items.filter((i) => i.id !== itemId);
    setItems(next);
    await saveTotal(next);
    onChanged?.();
  };

  const handleAddItem = async () => {
    if (!newCategoryId || newAmount <= 0 || !budget) return;
    const { data, error } = await supabase
      .from('budget_items')
      .insert({ budget_id: budget.id, category_id: newCategoryId, amount: newAmount, rollover: false })
      .select(`*, category:categories(*)`)
      .single();
    if (error || !data) {
      toast.error('Gagal menambah kategori');
      return;
    }
    const next = [...items, keysToCamel<BudgetItem>(data)];
    setItems(next);
    await saveTotal(next);
    onChanged?.();
    setNewCategoryId('');
    setNewAmount(0);
  };

  const sortedItems = [...items].sort((a, b) => {
    const pa = a.amount ? (actuals[a.categoryId] ?? 0) / a.amount : 0;
    const pb = b.amount ? (actuals[b.categoryId] ?? 0) / b.amount : 0;
    return pb - pa;
  });
  const unbudgetedSpent = Object.entries(actuals)
    .filter(([id]) => !items.some((i) => i.categoryId === id))
    .reduce((sum, [, v]) => sum + v, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        {loading || !budget ? (
          <div className="space-y-4 p-6" aria-busy="true">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : (
          <div className="flex max-h-[92dvh] flex-col">
            <DialogHeader
              className="sticky top-0 z-10 border-b bg-background px-4 py-3"
              style={{ paddingTop: '1.5rem' }}
            >
              <DialogTitle className="text-xl font-bold capitalize">
                Budget {format(new Date(`${budget.month}-01T00:00:00`), 'MMMM yyyy', { locale: localeId })}
                {periodRange(budget.month, getBudgetStartDay()) && (
                  <span className="block text-sm font-normal normal-case text-muted-foreground">
                    Periode {periodRange(budget.month, getBudgetStartDay())}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
              <div className="space-y-3 rounded-xl bg-muted/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{remaining >= 0 ? 'Sisa' : 'Lewat'}</p>
                    <p className="font-display text-2xl font-bold tabular-nums">
                      {formatMoney(Math.abs(remaining))}
                    </p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', overall.badge)}>
                    {overall.label}
                  </span>
                </div>
                <Progress
                  value={Math.min(totalBudget ? (totalSpent / totalBudget) * 100 : 0, 100)}
                  indicatorClassName={overall.bar}
                />
                <p className="text-sm text-muted-foreground">
                  Terpakai {formatMoney(totalSpent)} dari {formatMoney(totalBudget)}
                </p>
              </div>

              <ProLock
                locked={!isPro}
                title="Rincian per kategori ada di PRO"
                description="Lihat kategori mana yang aman, hampir habis, atau sudah lewat batas, lalu atur ulang batasnya."
              >
                <div className="space-y-2">
                  {sortedItems.length === 0 && !isEditing && (
                    <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                      Budget ini belum dibagi per kategori. Ketuk &quot;Atur kategori&quot; untuk menambahkan.
                    </p>
                  )}
                  {sortedItems.map((item) => {
                    const spent = actuals[item.categoryId] ?? 0;
                    const status = budgetStatus(spent, item.amount);
                    const pct = item.amount ? Math.min((spent / item.amount) * 100, 100) : 0;
                    return (
                      <div key={item.id} className="space-y-2 rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                            style={{
                              backgroundColor: `${item.category?.color || '#6B7280'}22`,
                              color: item.category?.color || undefined,
                            }}
                          >
                            <CategoryIcon name={item.category?.icon} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {item.category?.name}
                          </span>
                          {isEditing ? (
                            <>
                              <MoneyInput
                                className="w-36"
                                value={item.amount}
                                aria-label={`Batas ${item.category?.name}`}
                                onValueChange={(amount) =>
                                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, amount } : i)))
                                }
                                onBlur={() => handleUpdateItem(item.id, item.amount)}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Hapus ${item.category?.name}`}
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.badge)}>
                              {status.label}
                            </span>
                          )}
                        </div>
                        {!isEditing && (
                          <>
                            <Progress value={pct} className="h-1.5" indicatorClassName={status.bar} />
                            <p className="text-xs text-muted-foreground">
                              {formatMoney(spent)} dari {formatMoney(item.amount)}
                              {spent > item.amount && ` · lewat ${formatMoney(spent - item.amount)}`}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {isEditing && availableCategories.length > 0 && (
                    <div className="flex gap-2 rounded-lg border border-dashed p-3">
                      <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                        <SelectTrigger className="w-2/5 shrink-0">
                          <SelectValue placeholder="Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <MoneyInput className="flex-1" value={newAmount} onValueChange={setNewAmount} aria-label="Batas kategori baru" />
                      <Button
                        size="icon"
                        onClick={handleAddItem}
                        disabled={!newCategoryId || newAmount <= 0}
                        aria-label="Tambah kategori"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {unbudgetedSpent > 0 && !isEditing && (
                    <p className="px-1 text-xs text-muted-foreground">
                      {formatMoney(unbudgetedSpent)} dipakai di kategori yang tidak dianggarkan.
                    </p>
                  )}
                </div>
              </ProLock>
            </div>

            <DialogFooter
              className="sticky bottom-0 z-10 flex-row gap-2 border-t bg-background px-4 py-3"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}
            >
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
                Tutup
              </Button>
              {isPro && (
                <Button onClick={() => setIsEditing((v) => !v)} className="flex-1">
                  {isEditing ? 'Selesai' : 'Atur kategori'}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default BudgetDetailDialog;
