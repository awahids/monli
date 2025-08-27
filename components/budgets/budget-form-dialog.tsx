'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Budget, Category } from '@/types';
import { toast } from 'sonner';
import { formatIDR, parseIDR } from '@/lib/currency';
import { getBudgetMonth } from '@/lib/date';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
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
import { Input } from '@/components/ui/input';

const toCamel = (str: string) => str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

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

type ItemInput = { categoryId: string; amount: string };

type BudgetFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BudgetFormDialog({ open, onOpenChange }: BudgetFormDialogProps) {
  const { user, budgets, setBudgets } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const initialMonth = getBudgetMonth(
    new Date(),
    user?.budgetCutoffDay ?? 31,
  );
  const [month, setMonth] = useState<string>(initialMonth);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<ItemInput[]>([{ categoryId: '', amount: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const monthRef = useRef<HTMLInputElement>(null);
  const totalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    const fetchData = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense');
      if (data) setCategories(keysToCamel<Category[]>(data));
    };
    fetchData();
  }, [open, user]);

  const handleItemChange = (index: number, field: keyof ItemInput, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItem = () => setItems([...items, { categoryId: '', amount: '' }]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!month) {
      monthRef.current?.focus();
      return;
    }
    if (!total || total < 1) {
      totalRef.current?.focus();
      return;
    }
    setSubmitting(true);
    const payload = {
      month,
      totalAmount: total,
      items: items
        .filter(i => i.categoryId && i.amount)
        .map(i => ({
          categoryId: i.categoryId,
          amount: Number(i.amount),
          rollover: false,
        })),
    };
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      const newBudget = keysToCamel<Budget>(data);
      newBudget.items = [];
      setBudgets([...budgets, newBudget]);
      toast.success('Budget created');
      onOpenChange(false);
      setMonth(
        getBudgetMonth(new Date(), user?.budgetCutoffDay ?? 31),
      );
      setTotal(0);
      setItems([{ categoryId: '', amount: '' }]);
    } else {
      const { error } = await res.json();
      toast.error(error || 'Failed to create budget');
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto p-0 sm:p-6">
        <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0">
          <DialogTitle>Add Budget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-4 pb-24 sm:px-0 sm:pb-0">
          <div className="space-y-2">
            <label className="text-sm font-medium">Month</label>
            <Input
              ref={monthRef}
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Total Amount</label>
            <Input
              ref={totalRef}
              inputMode="numeric"
              placeholder="0"
              value={total ? formatIDR(total) : ''}
              onChange={e => setTotal(parseIDR(e.target.value))}
            />
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <Select
                value={item.categoryId}
                onValueChange={(v) => handleItemChange(idx, 'categoryId', v)}
              >
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Amount"
                value={item.amount}
                onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
              />
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addItem}>
            Add Item
          </Button>
        </div>
        <DialogFooter
          className="sticky bottom-0 border-t bg-background px-4 py-4"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <Button
            onClick={handleSubmit}
            disabled={submitting || !month || !total || total < 1}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

