'use client';

import React, { useEffect, useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { formatIDR } from '@/lib/currency';
import { Budget, BudgetItem, Category, Transaction } from '@/types';

function toCamel(str: string) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

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

type BudgetDetailDialogProps = {
  budgetId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BudgetDetailDialog({
  budgetId,
  open,
  onOpenChange,
}: BudgetDetailDialogProps) {
  const {
    user,
    budgets,
    categories,
    transactions,
    setBudgets,
    setCategories,
    setTransactions,
    loading,
    setLoading,
    getCategorySpending,
    getMonthlySpending,
  } = useAppStore();

  const [budget, setBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const isPro = user?.plan === 'PRO';

  useEffect(() => {
    if (!budgetId || !user || !isPro) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (!budgets.find((b) => b.id === budgetId)) {
          const { data: budgetData } = await supabase
            .from('budgets')
            .select(`*, items:budget_items(*, category:categories(*))`)
            .eq('user_id', user.id)
            .eq('id', budgetId)
            .single();
          if (budgetData) {
            const fetchedBudget = keysToCamel<Budget>(budgetData);
            const existing = budgets.find((b) => b.id === fetchedBudget.id);
            const updatedBudgets = existing
              ? budgets.map((b) =>
                  b.id === fetchedBudget.id ? fetchedBudget : b
                )
              : [...budgets, fetchedBudget];
            setBudgets(updatedBudgets);
            setBudget(fetchedBudget);
            setItems(fetchedBudget.items || []);
          }
        } else {
          const existingBudget = budgets.find((b) => b.id === budgetId) || null;
          setBudget(existingBudget);
          setItems(existingBudget?.items || []);
        }

        if (!categories.length) {
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', user.id);
          if (categoriesData)
            setCategories(keysToCamel<Category[]>(categoriesData));
        }

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
        console.error('Failed to fetch budget:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    budgetId,
    user,
    budgets,
    categories.length,
    transactions.length,
    setBudgets,
    setCategories,
    setTransactions,
    setLoading,
    isPro,
  ]);

  const totalBudget = budget?.totalAmount ?? 0;
  const totalSpent = budget ? getMonthlySpending(budget.month) : 0;
  const progress = totalBudget ? (totalSpent / totalBudget) * 100 : 0;
  const overallIndicatorColor =
    progress < 70
      ? 'bg-green-500'
      : progress <= 100
      ? 'bg-orange-500'
      : 'bg-red-500';

  const availableCategories = useMemo(
    () =>
      !isPro
        ? []
        : categories.filter(
            (c) => c.type === 'expense' && !items.some((i) => i.categoryId === c.id)
          ),
    [categories, items, isPro]
  );

  const handleUpdateItem = async (itemId: string, amount: number) => {
    if (isNaN(amount)) return;
    const { error } = await supabase
      .from('budget_items')
      .update({ amount })
      .eq('id', itemId);
    if (!error) {
      const updatedItems = items.map((i) =>
        i.id === itemId ? { ...i, amount } : i
      );
      setItems(updatedItems);
      setBudgets(
        budgets.map((b) =>
          b.id === budget?.id ? { ...b, items: updatedItems } : b
        )
      );
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', itemId);
    if (!error) {
      const updatedItems = items.filter((i) => i.id !== itemId);
      setItems(updatedItems);
      setBudgets(
        budgets.map((b) =>
          b.id === budget?.id ? { ...b, items: updatedItems } : b
        )
      );
    }
  };

  const handleAddItem = async () => {
    const amount = parseFloat(newAmount);
    if (!newCategoryId || isNaN(amount) || !budget) return;
    const { data, error } = await supabase
      .from('budget_items')
      .insert({
        budget_id: budget.id,
        category_id: newCategoryId,
        amount,
        rollover: false,
      })
      .select(`*, category:categories(*)`)
      .single();
    if (!error && data) {
      const newItem = keysToCamel<BudgetItem>(data);
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      setBudgets(
        budgets.map((b) =>
          b.id === budget.id ? { ...b, items: updatedItems } : b
        )
      );
      setNewCategoryId('');
      setNewAmount('');
    }
  };

  // Responsive: combine table and cards, show table on md+, cards on sm
  // Ensure dialog remains within viewport and content scrolls

  if (!isPro) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle>Budget details are a Pro feature</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-muted-foreground">
              Upgrade to unlock detailed budget breakdowns.
            </p>
            <Button asChild>
              <Link href="/upgrade">Upgrade to Pro</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full h-full sm:h-auto p-0 overflow-hidden">
        {loading || !budget ? (
          <div className="flex h-[60dvh] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
            <DialogHeader
              className="sticky top-0 z-10 border-b bg-background px-4 py-3"
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
              <DialogTitle className="text-xl sm:text-2xl font-bold break-words">
                {format(new Date(`${budget.month}-01`), 'MMMM yyyy')}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-8 py-4 space-y-6">
              <Card className="bg-muted/50 w-full">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl font-bold break-words">
                    {format(new Date(`${budget.month}-01`), 'MMMM yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between text-sm">
                    <span>Planned</span>
                    <span className="font-medium">{formatIDR(totalBudget)}</span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between text-sm">
                    <span>Spent</span>
                    <span className="font-medium">{formatIDR(totalSpent)}</span>
                  </div>
                  <Progress
                    value={Math.min(progress, 100)}
                    indicatorClassName={overallIndicatorColor}
                  />
                </CardContent>
              </Card>

              {/* Responsive: Table for md+, Cards for <md */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Spent</TableHead>
                        <TableHead>Progress</TableHead>
                        {isEditing ? <TableHead className="w-0" /> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const spent = getCategorySpending(
                          item.categoryId,
                          budget.month
                        );
                        const progress = item.amount
                          ? (spent / item.amount) * 100
                          : 0;
                        const Icon =
                          item.category &&
                          item.category.icon &&
                          (Icons as any)[item.category.icon as keyof typeof Icons]
                            ? (Icons as any)[
                                item.category.icon as keyof typeof Icons
                              ]
                            : Icons.Circle;
                        const indicatorColor =
                          progress < 70
                            ? 'bg-green-500'
                            : progress <= 100
                            ? 'bg-orange-500'
                            : 'bg-red-500';
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon
                                  className="h-4 w-4"
                                  style={{
                                    color: item.category?.color || undefined,
                                  }}
                                />
                                <span className="break-words">
                                  {item.category?.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={item.amount}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setItems((prev) =>
                                      prev.map((i) =>
                                        i.id === item.id
                                          ? { ...i, amount: isNaN(val) ? 0 : val }
                                          : i
                                      )
                                    );
                                  }}
                                  onBlur={() =>
                                    handleUpdateItem(item.id, item.amount)
                                  }
                                  className="w-24 ml-auto"
                                />
                              ) : (
                                formatIDR(item.amount)
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatIDR(spent)}
                            </TableCell>
                            <TableCell>
                              <Progress
                                value={Math.min(progress, 100)}
                                indicatorClassName={indicatorColor}
                              />
                            </TableCell>
                            {isEditing ? (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  Remove
                                </Button>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        );
                      })}
                      {isEditing ? (
                        <TableRow>
                          <TableCell>
                            <Select
                              value={newCategoryId}
                              onValueChange={setNewCategoryId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCategories.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={newAmount}
                              onChange={(e) => setNewAmount(e.target.value)}
                              className="w-24 ml-auto"
                            />
                          </TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell>
                            <Button
                              onClick={handleAddItem}
                              disabled={!newCategoryId || !newAmount}
                            >
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="space-y-4 md:hidden">
                {items.map((item) => {
                  const spent = getCategorySpending(
                    item.categoryId,
                    budget.month
                  );
                  const progress = item.amount ? (spent / item.amount) * 100 : 0;
                  const Icon =
                    item.category &&
                    item.category.icon &&
                    (Icons as any)[item.category.icon as keyof typeof Icons]
                      ? (Icons as any)[item.category.icon as keyof typeof Icons]
                      : Icons.Circle;
                  const indicatorColor =
                    progress < 70
                      ? 'bg-green-500'
                      : progress <= 100
                      ? 'bg-orange-500'
                      : 'bg-red-500';
                  return (
                    <Card key={item.id} className="bg-muted/50 w-full">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Icon
                            className="h-4 w-4"
                            style={{ color: item.category?.color || undefined }}
                          />
                          <CardTitle className="text-base sm:text-lg break-words">
                            {item.category?.name}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex flex-col gap-1 xs:flex-row xs:justify-between text-sm">
                          <span>Budget</span>
                          <span>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={item.amount}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setItems((prev) =>
                                    prev.map((i) =>
                                      i.id === item.id
                                        ? { ...i, amount: isNaN(val) ? 0 : val }
                                        : i
                                    )
                                  );
                                }}
                                onBlur={() =>
                                  handleUpdateItem(item.id, item.amount)
                                }
                                className="w-24"
                              />
                            ) : (
                              formatIDR(item.amount)
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 xs:flex-row xs:justify-between text-sm">
                          <span>Spent</span>
                          <span>{formatIDR(spent)}</span>
                        </div>
                        <Progress
                          value={Math.min(progress, 100)}
                          indicatorClassName={indicatorColor}
                        />
                        {isEditing ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
                {isEditing ? (
                  <Card className="bg-muted/50 w-full">
                    <CardContent className="flex flex-col gap-2 pt-6">
                      <Select
                        value={newCategoryId}
                        onValueChange={setNewCategoryId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                      />
                      <Button
                        onClick={handleAddItem}
                        disabled={!newCategoryId || !newAmount}
                      >
                        Add
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>

            <DialogFooter
              className="sticky bottom-0 z-10 gap-2 border-t bg-background px-4 py-3"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-none"
              >
                Close
              </Button>
              <Button
                onClick={() => setIsEditing((v) => !v)}
                className="flex-1 sm:flex-none"
              >
                {isEditing ? 'Done' : 'Edit'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default BudgetDetailDialog;
