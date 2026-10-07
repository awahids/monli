'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';
import { formatMoney } from '@/lib/currency';
import { keysToCamel } from '@/lib/case';
import { shiftMonth } from '@/lib/date';
import { thisBudgetMonth } from '@/lib/budget-period';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/lib/i18n';

type ItemInput = { categoryId: string; amount: number };

type BudgetFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

/** Rounds a suggestion up to a tidy figure (Rp 50k steps for Rupiah). */
function roundUp(amount: number, currency: string) {
  const step = currency === 'IDR' ? 50000 : 10;
  return Math.ceil(amount / step) * step;
}

export function BudgetFormDialog({ open, onOpenChange, onCreated }: BudgetFormDialogProps) {
  const { user, space } = useAppStore();
  const { t } = useT();
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState<string>(() => thisBudgetMonth());
  const [items, setItems] = useState<ItemInput[]>([{ categoryId: '', amount: 0 }]);
  const [extraTotal, setExtraTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', (space?.ownerId ?? user.id))
      .eq('type', 'expense')
      .then(({ data }) => {
        if (data) setCategories(keysToCamel<Category[]>(data));
      });
  }, [space?.ownerId, open, user]);

  const allocated = useMemo(
    () => items.reduce((sum, i) => sum + (i.categoryId ? i.amount : 0), 0),
    [items]
  );
  // The monthly total is the category allocations plus an optional buffer
  // for spending outside those categories.
  const total = allocated + extraTotal;

  const updateItem = (index: number, patch: Partial<ItemInput>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const reset = () => {
    setMonth(thisBudgetMonth());
    setItems([{ categoryId: '', amount: 0 }]);
    setExtraTotal(0);
  };

  /** Pre-fills categories from last month's actual spending. */
  const suggestFromLastMonth = async () => {
    setSuggesting(true);
    try {
      const prev = shiftMonth(month, -1);
      const res = await fetch(`/api/reports/monthly?month=${prev}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const currency = user?.defaultCurrency || 'IDR';
      const rows = (data.data ?? []) as { categoryId: string; actual: number; planned: number }[];
      const suggested = rows
        .filter((r) => categories.some((c) => c.id === r.categoryId) && (r.actual > 0 || r.planned > 0))
        .sort((a, b) => b.actual - a.actual)
        .map((r) => ({
          categoryId: r.categoryId,
          amount: roundUp(Math.max(r.actual, r.planned), currency),
        }));
      if (!suggested.length) {
        toast.info(t('Belum ada pengeluaran berkategori di bulan lalu', 'No categorized spending last month'));
        return;
      }
      setItems(suggested);
      toast.success(t(`${suggested.length} kategori diisi dari pengeluaran bulan lalu`, `${suggested.length} categories filled from last month's spending`));
    } catch {
      toast.error(t('Gagal mengambil data bulan lalu', "Could not get last month's data"));
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !month || total < 1) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          totalAmount: total,
          items: items
            .filter((i) => i.categoryId && i.amount > 0)
            .map((i) => ({ categoryId: i.categoryId, amount: i.amount, rollover: false })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          res.status === 403
            ? t('Paket FREE dibatasi 2 budget. Upgrade ke PRO untuk budget tanpa batas.', 'The FREE plan is limited to 2 budgets. Upgrade to PRO for unlimited budgets.')
            : data.error || t('Gagal membuat budget', 'Could not create the budget')
        );
        return;
      }
      toast.success(t('Budget dibuat', 'Budget created'));
      onOpenChange(false);
      onCreated?.();
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  const usedIds = new Set(items.map((i) => i.categoryId).filter(Boolean));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>{t('Buat budget', 'Create budget')}</DialogTitle>
          <DialogDescription>
            {t('Tentukan batas belanja per kategori. Total budget dihitung otomatis.', 'Set spending limits per category. The budget total is calculated for you.')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-4">
          <div className="space-y-2">
            <Label htmlFor="budget-month">{t('Bulan', 'Month')}</Label>
            <Input id="budget-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{t('Kategori', 'Categories')}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={suggestFromLastMonth}
                disabled={suggesting || !categories.length}
              >
                <Sparkles className="mr-1 h-4 w-4" />
                {suggesting ? t('Mengambil...', 'Loading...') : t('Isi dari bulan lalu', 'Fill from last month')}
              </Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <Select value={item.categoryId} onValueChange={(v) => updateItem(idx, { categoryId: v })}>
                  <SelectTrigger className="w-2/5 shrink-0">
                    <SelectValue placeholder={t('Pilih kategori', 'Choose category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c.id === item.categoryId || !usedIds.has(c.id))
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <MoneyInput
                  className="flex-1"
                  value={item.amount}
                  onValueChange={(amount) => updateItem(idx, { amount })}
                  aria-label={t('Batas kategori', 'Category limit')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('Hapus baris', 'Remove row')}
                  onClick={() =>
                    setItems((prev) =>
                      prev.length === 1 ? [{ categoryId: '', amount: 0 }] : prev.filter((_, i) => i !== idx)
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItems((prev) => [...prev, { categoryId: '', amount: 0 }])}
              disabled={usedIds.size >= categories.length}
            >
              <Plus className="mr-1 h-4 w-4" /> {t('Tambah kategori', 'Add category')}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{t('Cadangan di luar kategori (opsional)', 'Buffer outside categories (optional)')}</Label>
            <MoneyInput value={extraTotal} onValueChange={setExtraTotal} aria-label={t('Cadangan', 'Buffer')} />
            <p className="text-xs text-muted-foreground">
              {t('Untuk pengeluaran yang tidak masuk kategori di atas.', "For spending that doesn't fit the categories above.")}
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('Dialokasikan ke kategori', 'Allocated to categories')}</span>
              <span className="tabular-nums">{formatMoney(allocated)}</span>
            </div>
            <div className="mt-1 flex justify-between font-semibold">
              <span>{t('Total budget', 'Budget total')}</span>
              <span className="tabular-nums">{formatMoney(total)}</span>
            </div>
          </div>
        </div>
        <DialogFooter
          className="sticky bottom-0 border-t bg-background px-4 py-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        >
          <Button onClick={handleSubmit} disabled={submitting || !month || total < 1} className="w-full">
            {submitting ? t('Menyimpan...', 'Saving...') : t('Simpan budget', 'Save budget')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
